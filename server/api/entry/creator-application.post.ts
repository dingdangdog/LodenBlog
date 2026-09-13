import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth, ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);

    if (authUser.role >= ROLE_LEVEL.CREATOR) {
      return error("您已是创作者，无需申请");
    }

    const body = await readBody(event);
    const { penName, key, message } = body;

    const penNameStr = typeof penName === "string" ? penName.trim() : "";
    const keyStr = typeof key === "string" ? key.trim() : "";

    if (!penNameStr) {
      return error("笔名不能为空");
    }
    if (!keyStr) {
      return error("个人ID不能为空");
    }
    if (!/^[a-zA-Z_]+$/.test(keyStr)) {
      return error("个人ID只能包含英文字母和下划线");
    }

    const keyLower = keyStr.toLowerCase();
    const existingCreator = await prisma.creator.findFirst({
      where: {
        key: { equals: keyStr, mode: "insensitive" },
      },
    });
    if (existingCreator) {
      return error("该个人ID已被使用");
    }

    const pending = await prisma.creatorApplication.findFirst({
      where: {
        userId: authUser.id,
        status: "PENDING",
      },
    });
    if (pending) {
      return error("您已有待审核的申请，请等待审核结果");
    }

    const application = await prisma.creatorApplication.create({
      data: {
        userId: authUser.id,
        penName: penNameStr,
        key: keyStr,
        message: typeof message === "string" ? message.trim() || null : null,
        status: "PENDING",
      },
    });

    return success({ application }, "提交成功");
  } catch (err: any) {
    return error(err.message || "提交失败");
  }
});
