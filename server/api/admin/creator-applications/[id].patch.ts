import { success, error } from "~~/server/utils/result";
import { requireAdmin, ROLE_LEVEL } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAdmin(event);
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("申请 ID 不能为空");
    }

    const app = await prisma.creatorApplication.findUnique({
      where: { id },
    });

    if (!app) {
      return error("申请不存在");
    }

    if (app.status !== "PENDING") {
      return error("该申请已处理，无法重复操作");
    }

    const body = await readBody(event);
    const { action, rejectReason } = body;
    const actionStr = typeof action === "string" ? action.toUpperCase() : "";

    if (actionStr === "REJECT") {
      const updated = await prisma.creatorApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: authUser.id,
          rejectReason:
            typeof rejectReason === "string" ? rejectReason.trim() || null : null,
        },
      });
      return success({ application: updated }, "已驳回");
    }

    if (actionStr === "APPROVE") {
      const user = await prisma.user.findUnique({
        where: { id: app.userId },
      });
      if (!user) {
        return error("申请人不存在");
      }

      const existingCreator = await prisma.creator.findUnique({
        where: { userId: app.userId },
      });
      if (existingCreator) {
        await prisma.creatorApplication.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewedBy: authUser.id,
            rejectReason: "用户已成为创作者",
          },
        });
        return error("该用户已是创作者");
      }

      let finalKey = app.key.trim();
      if (!/^[a-zA-Z_]+$/.test(finalKey)) {
        finalKey = `user_${app.userId.slice(0, 8)}`;
      }
      let keyCandidate = finalKey;
      let counter = 1;
      const allCreators = await prisma.creator.findMany({
        select: { key: true },
      });
      while (allCreators.some((c) => c.key.toLowerCase() === keyCandidate.toLowerCase())) {
        keyCandidate = `${finalKey}_${counter}`;
        counter++;
      }
      finalKey = keyCandidate;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: app.userId },
          data: { role: ROLE_LEVEL.CREATOR },
        });

        await tx.creator.create({
          data: {
            userId: app.userId,
            key: finalKey,
            penName: app.penName,
            avatar: user.avatar || null,
          },
        });

        await tx.creatorApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: authUser.id,
          },
        });
      });

      const application = await prisma.creatorApplication.findUnique({
        where: { id },
      });
      return success({ application }, "已通过");
    }

    return error("无效操作");
  } catch (err: any) {
    return error(err.message || "操作失败");
  }
});
