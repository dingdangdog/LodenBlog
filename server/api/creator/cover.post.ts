import { success, error } from "~~/server/utils/result";
import { requireCreator } from "~~/server/utils/permission";
import { uploadToR2, getR2FileUrl } from "~~/server/utils/r2";
import prisma from "~~/lib/prisma";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireCreator(event);
    const formdata = await readFormData(event);
    const file = formdata.get("file") as File;

    // 验证文件
    if (!file || !file.type.startsWith("image/")) {
      return error("请上传图片文件");
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return error("文件大小不得超过10MB");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // 使用 sharp 优化图片（封面图可以大一些，比如 1200x630）
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(1200, 630, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `cover-${authUser.id}-${Date.now()}.webp`;
    const objectKey = `cover/${filename}`;

    await uploadToR2(optimizedBuffer, objectKey, "image/webp");

    const url = getR2FileUrl(objectKey);

    // 获取图片元数据
    const metadata = await sharp(optimizedBuffer).metadata();
    const metadataJson = JSON.stringify({
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    });

    // 将图片信息保存到 Media 表
    try {
      await prisma.media.create({
        data: {
          userId: authUser.id,
          uploaderId: authUser.id,
          filename: filename,
          originalName: file.name,
          mimeType: "image/webp",
          size: optimizedBuffer.length,
          path: objectKey,
          url: url,
          alt: "cover",
          caption: "cover",
          metadata: metadataJson,
        },
      });
    } catch (dbError: any) {
      // 数据库保存失败不影响上传成功，只记录错误
      console.error("保存封面到 Media 表失败:", dbError);
    }

    return success(
      {
        url,
        key: objectKey,
      },
      "封面上传成功"
    );
  } catch (err: any) {
    return error(err.message || "封面上传失败");
  }
});

