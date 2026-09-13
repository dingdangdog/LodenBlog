import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { uploadToR2, getR2FileUrl } from "~~/server/utils/r2";
import { requireAuth, ROLE_LEVEL } from "~~/server/utils/permission";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);

    // 检查是否是创作者
    if (authUser.role < ROLE_LEVEL.CREATOR) {
      return error("您不是创作者");
    }

    const formdata = await readFormData(event);
    const file = formdata.get("image") as File;

    // 验证文件
    if (!file || !file.type.startsWith("image/")) {
      return error("请上传图片文件");
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return error("文件大小不得超过10MB");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    const optimizedBuffer = await sharp(originalBuffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `creator-${authUser.id}-${Date.now()}.webp`;
    const objectKey = `creator/avatar/${filename}`;

    await uploadToR2(optimizedBuffer, objectKey, "image/webp");

    // 查询或创建创作者记录
    let creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
    });

    if (!creator) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { name: true, username: true },
      });

      creator = await prisma.creator.create({
        data: {
          userId: authUser.id,
          penName: user?.name || user?.username || "",
          avatar: objectKey,
        },
      });
    } else {
      creator = await prisma.creator.update({
        where: { id: creator.id },
        data: { avatar: objectKey },
      });
    }

    const avatarUrl = getR2FileUrl(objectKey);

    return success(
      {
        creator,
        avatarKey: objectKey,
        avatarUrl,
      },
      "头像已更新"
    );
  } catch (err: any) {
    return error(err.message || "头像上传失败");
  }
});
