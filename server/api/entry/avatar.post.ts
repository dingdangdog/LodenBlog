import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { uploadToR2, getR2FileUrl } from "~~/server/utils/r2";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);
    const formdata = await readFormData(event);
    const file = formdata.get("image") as File;

    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      return error("请上传图片文件");
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 30MB
    if (file.size > maxSizeInBytes) {
      return error("文件大小不得超过10MB");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    const optimizedBuffer = await sharp(originalBuffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${authUser.id}-${Date.now()}.webp`;
    const objectKey = `avatar/${filename}`;

    await uploadToR2(optimizedBuffer, objectKey, "image/webp");

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatar: objectKey },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const avatarUrl = getR2FileUrl(objectKey);

    return success(
      {
        user,
        avatarKey: objectKey,
        avatarUrl,
      },
      "头像已更新"
    );
  } catch (err: any) {
    return error(err.message || "头像上传失败");
  }
});
