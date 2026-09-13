import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth, ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);

    const list = await prisma.creatorApplication.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
    });

    const latest = list[0] ?? null;
    return success(
      {
        applications: list,
        latest,
        isCreator: authUser.role >= ROLE_LEVEL.CREATOR,
      },
      "获取成功"
    );
  } catch (err: any) {
    return error(err.message || "获取失败");
  }
});
