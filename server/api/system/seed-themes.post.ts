import prisma from "~~/lib/prisma";
import { success, error } from "~~/server/utils/result";
import { defaultThemePresets } from "~~/utils/theme-presets";

export default defineEventHandler(async () => {
  try {
    const count = await prisma.theme.count();
    if (count > 0) {
      return error("主题数据已存在，无需初始化");
    }

    const themes = await prisma.theme.createMany({
      data: defaultThemePresets.map((theme) => ({
        ...theme,
        colors: JSON.stringify(theme.colors),
      })),
      skipDuplicates: true,
    });

    return success({ count: themes.count }, "主题数据初始化成功");
  } catch (err: any) {
    console.error("初始化主题数据失败:", err);
    return error("初始化主题数据失败", err.message);
  }
});
