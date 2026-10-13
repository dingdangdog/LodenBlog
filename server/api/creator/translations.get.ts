import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { readProviderModel } from "~~/server/utils/provider-config";

export default defineEventHandler(async (event) => {
  try {
    const [aiConfigs, translationConfigs] = await Promise.all([
      prisma.aiConfig.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
          isActive: true,
          priority: true,
          createdAt: true,
          extraConfig: true,
        },
        where: { isActive: true },
      }),
      prisma.translationConfig.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
          isActive: true,
          priority: true,
          createdAt: true,
          extraConfig: true,
        },
        where: { isActive: true },
      }),
    ]);

    const configs = [
      ...aiConfigs.map((row) => ({ ...row, source: "ai" as const })),
      ...translationConfigs.map((row) => ({
        ...row,
        source: "translation" as const,
      })),
    ]
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map(({ createdAt: _createdAt, extraConfig, ...rest }) => ({
        ...rest,
        model: readProviderModel(extraConfig),
      }));

    return success(configs, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取翻译配置列表失败");
  }
});
