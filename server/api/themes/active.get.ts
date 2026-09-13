import prisma from "~~/lib/prisma";
import { success, error } from "~~/server/utils/result";

const findDefaultThemeByMode = async (mode: "light" | "dark") => {
  const defaultTheme = await prisma.theme.findFirst({
    where: {
      mode,
      isActive: true,
      isDefault: true,
    },
  });

  if (defaultTheme) {
    return defaultTheme;
  }

  return prisma.theme.findFirst({
    where: {
      mode,
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });
};

export default defineEventHandler(async () => {
  try {
    const [lightTheme, darkTheme] = await Promise.all([
      findDefaultThemeByMode("light"),
      findDefaultThemeByMode("dark"),
    ]);

    return success({
      light: lightTheme || null,
      dark: darkTheme || null,
    });
  } catch (err: any) {
    console.error("获取默认主题失败:", err);
    return error("获取默认主题失败", err.message);
  }
});
