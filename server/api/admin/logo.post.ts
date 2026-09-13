import { success, error } from "~~/server/utils/result";
import { uploadToR2, deleteFromR2, getR2FileUrl } from "~~/server/utils/r2";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  try {
    const formdata = await readFormData(event);
    const file = formdata.get("file") as File;
    const type = (formdata.get("type") as string) || "logo-light"; // logo-light, logo-dark, icon-light, icon-dark

    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      return error("请上传图片文件");
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return error("文件大小不得超过5MB");
    }

    // 验证类型
    const validTypes = ["logo-light", "logo-dark", "icon-light", "icon-dark"];
    if (!validTypes.includes(type)) {
      return error("无效的文件类型");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // 根据类型设置不同的处理参数
    let optimizedBuffer: Buffer;
    let objectKey: string;
    let contentType: string;
    let maxWidth: number;
    let maxHeight: number;

    if (type.startsWith("logo")) {
      // Logo: 最大宽度 400px，保持比例，使用webp格式
      maxWidth = 400;
      maxHeight = 200;
      objectKey = `logo/${type}.webp`;
      contentType = "image/webp";

      optimizedBuffer = await sharp(originalBuffer)
        .resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toBuffer();
    } else {
      // Icon: 固定 64x64，使用PNG格式（ico格式内部通常使用PNG数据）
      maxWidth = 64;
      maxHeight = 64;
      objectKey = `logo/${type}.ico`;
      contentType = "image/x-icon";

      // 转换为PNG格式（ico格式可以包含PNG数据，现代浏览器支持）
      optimizedBuffer = await sharp(originalBuffer)
        .resize(maxWidth, maxHeight, {
          fit: "cover",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    }

    // 删除所有可能的旧文件（包括不同格式的历史文件）
    const basePath = `logo/${type}`;
    const possibleExtensions = type.startsWith("logo")
      ? [".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico"]
      : [".ico", ".png", ".jpg", ".jpeg", ".svg", ".webp"];

    for (const ext of possibleExtensions) {
      const oldKey = `${basePath}${ext}`;
      try {
        await deleteFromR2(oldKey);
        console.log(`已删除旧文件: ${oldKey}`);
      } catch (err) {
        // 如果文件不存在，忽略错误
        // console.log(`旧文件不存在，跳过删除: ${oldKey}`);
      }
    }

    // 上传新文件
    await uploadToR2(optimizedBuffer, objectKey, contentType);

    // 获取公共URL
    const url = getR2FileUrl(objectKey);

    return success(
      {
        url,
        key: objectKey,
        type,
      },
      "上传成功"
    );
  } catch (err: any) {
    return error(err.message || "上传失败");
  }
});
