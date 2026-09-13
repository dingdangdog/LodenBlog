import { success, error } from "~~/server/utils/result";
import { requireAuth } from "~~/server/utils/permission";
import { uploadToR2, getR2FileUrl } from "~~/server/utils/r2";
import prisma from "~~/lib/prisma";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);
    const formdata = await readFormData(event);
    const file = formdata.get("file") as File;
    const alt = formdata.get("alt") as string | null;
    const caption = formdata.get("caption") as string | null;

    // 验证文件
    if (!file || !file.type.startsWith("image/")) {
      return error("请上传图片文件");
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return error("文件大小不得超过10MB");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // 使用 sharp 优化图片，最大分辨率1920x1920
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(1920, 1920, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const filename = `media-${authUser.id}-${timestamp}.webp`;
    const objectKey = `media/${filename}`;

    await uploadToR2(optimizedBuffer, objectKey, "image/webp");

    const url = getR2FileUrl(objectKey);

    // 获取图片元数据
    const metadata = await sharp(optimizedBuffer).metadata();
    const metadataJson = JSON.stringify({
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    });

    // 直接保存到数据库
    const media = await prisma.media.create({
      data: {
        userId: authUser.id,
        uploaderId: authUser.id,
        filename: filename,
        originalName: file.name,
        mimeType: "image/webp",
        size: optimizedBuffer.length,
        path: objectKey,
        url: url,
        alt: alt || null,
        caption: caption || null,
        metadata: metadataJson,
      },
    });

    return success(media, "上传成功");
  } catch (err: any) {
    return error(err.message || "上传失败");
  }
});
