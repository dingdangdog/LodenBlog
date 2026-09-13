import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { hashPassword } from "~~/server/utils/password";
import { ROLE_LEVEL } from "~~/utils/role";
import { defaultThemePresets } from "~~/utils/theme-presets";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY, CONFIG_METADATA } from "~~/server/utils/config-keys";
import { initInfoPages } from "~~/server/utils/init-info-pages";

/**
 * 系统初始化接口
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      adminEmail,
      adminUsername,
      adminName,
      adminPassword,
      siteTitle,
      siteDescription,
      siteKeyword,
      siteDomain,
      r2Url,
      r2SecretId,
      r2SecretKey,
      r2Token,
      r2Bucket,
      r2Domain,
      logoLight,
      logoDark,
      iconLight,
      iconDark,
      defaultLang = "zh",
      enabledLanguages,
    } = body;

    // 全部可选语言（与 nuxt i18n 保持一致），初始化时全部写入数据库，按 enabledLanguages 决定是否启用
    const allLanguageConfigs = [
      { code: "zh", name: "Chinese", nativeName: "中文", description: "默认中文语言" },
      { code: "en", name: "English", nativeName: "English", description: "Default English language" },
      { code: "ja", name: "Japanese", nativeName: "日本語", description: "日本語デフォルト言語" },
      { code: "de", name: "German", nativeName: "Deutsch", description: "Standard-Deutsche Sprache" },
      { code: "es", name: "Spanish", nativeName: "Español", description: "Idioma español predeterminado" },
    ];

    // 启用语言列表：若未传则默认为仅主语言
    const enabledSet = new Set<string>(
      Array.isArray(enabledLanguages) && enabledLanguages.length > 0
        ? enabledLanguages
        : [defaultLang]
    );
    if (!enabledSet.has(defaultLang)) {
      enabledSet.add(defaultLang);
    }

    // 验证必填字段
    if (!adminEmail || !adminUsername || !adminPassword) {
      return error("管理员邮箱、用户名和密码不能为空");
    }

    if (!siteTitle || !siteDescription) {
      return error("站点标题和描述不能为空");
    }

    // 检查系统是否已初始化（多重检查，确保安全）
    const [adminCount, settingCount] = await Promise.all([
      prisma.user.count({
        where: { role: ROLE_LEVEL.ADMIN },
      }),
      prisma.setting.count(),
    ]);

    // 如果存在管理员或系统设置，说明系统已初始化
    if (adminCount > 0 || settingCount > 0) {
      return error("系统已经初始化，无法重复初始化");
    }

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      // 在事务内部再次检查，防止并发请求导致的竞态条件
      const [txAdminCount, txSettingCount] = await Promise.all([
        tx.user.count({
          where: { role: ROLE_LEVEL.ADMIN },
        }),
        tx.setting.count(),
      ]);

      if (txAdminCount > 0 || txSettingCount > 0) {
        throw new Error("系统已经初始化，无法重复初始化");
      }
      // 1. 创建管理员用户
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          username: adminUsername,
          name: adminName || adminUsername, // 昵称，默认为用户名
          password: hashPassword(adminPassword),
          role: ROLE_LEVEL.ADMIN,
          isActive: true,
          emailVerified: true,
        },
      });

      // 1.1 创建管理员对应的创作者信息
      // 生成 key：仅允许英文字母和下划线，不符合则用默认值
      let creatorKey = adminUsername.replace(/[^a-zA-Z_]/g, "") || `user_${admin.id.slice(0, 8)}`;
      if (!/^[a-zA-Z_]+$/.test(creatorKey)) {
        creatorKey = `user_${admin.id.slice(0, 8)}`;
      }

      await tx.creator.create({
        data: {
          userId: admin.id,
          key: creatorKey, // key 是必需的
          penName: adminName || adminUsername, // 笔名，默认为昵称或用户名
        },
      });

      // 2. 初始化全部语言（启用与不启用均写入），并设置 isDefault
      await Promise.all(
        allLanguageConfigs.map((lang, index) =>
          tx.language.upsert({
            where: { code: lang.code },
            update: {
              name: lang.name,
              nativeName: lang.nativeName,
              isActive: enabledSet.has(lang.code),
              sortOrder: index + 1,
            },
            create: {
              code: lang.code,
              name: lang.name,
              nativeName: lang.nativeName,
              isActive: enabledSet.has(lang.code),
              isDefault: lang.code === defaultLang,
              sortOrder: index + 1,
            },
          })
        )
      );

      await tx.language.updateMany({
        data: { isDefault: false },
      });
      await tx.language.updateMany({
        where: { code: defaultLang },
        data: { isDefault: true },
      });

      const createdLanguages = await tx.language.findMany({
        where: { code: { in: allLanguageConfigs.map((lang) => lang.code) } },
      });

      // 3. 创建系统设置（再次检查是否已存在）
      const existingSetting = await tx.setting.findFirst();
      if (existingSetting) {
        throw new Error("系统设置已存在，无法重复初始化");
      }

      const setting = await tx.setting.create({
        data: {
          title: siteTitle,
          description: siteDescription,
          keyword: siteKeyword || siteTitle,
          domain: siteDomain || null,
          logo: logoLight || logoDark || "/logo.webp", // 优先使用上传的Logo
          logoLight: logoLight || null,
          logoDark: logoDark || null,
          icon: iconLight || iconDark || "/favicon.ico", // 优先使用上传的图标
          iconLight: iconLight || null,
          iconDark: iconDark || null,
          defaultLang: defaultLang,
          languageCode: defaultLang, // 使用 languageCode 替代 languageId
          i18nEnabled: true,
          primaryLanguage: defaultLang,
          targetLanguages: JSON.stringify([...enabledSet]),
        },
      });

      // 4. 创建默认分类（每种语言一个）
      for (const lang of createdLanguages) {
        // 先检查是否已存在
        const existing = await tx.category.findFirst({
          where: {
            slug: "uncategorized",
            languageCode: lang.code,
          },
        });

        if (!existing) {
          await tx.category.create({
            data: {
              slug: "uncategorized",
              name:
                lang.code === "zh"
                  ? "未分类"
                  : lang.code === "ja"
                  ? "未分類"
                  : "Uncategorized",
              description:
                lang.code === "zh"
                  ? "默认分类"
                  : lang.code === "ja"
                  ? "デフォルトカテゴリ"
                  : "Default category",
              languageCode: lang.code, // 使用 languageCode 替代 languageId
              isActive: true,
              sortOrder: 0,
            },
          });
        }
      }

      // 5. 初始化默认主题
      const createdThemes = await Promise.all(
        defaultThemePresets.map((preset) =>
          tx.theme.upsert({
            where: { name: preset.name },
            update: {
              displayName: preset.displayName,
              mode: preset.mode,
              colors: JSON.stringify(preset.colors),
              isActive: preset.isActive,
              isDefault: preset.isDefault,
              sortOrder: preset.sortOrder,
            },
            create: {
              ...preset,
              colors: JSON.stringify(preset.colors),
            },
          })
        )
      );

      // 5.5 初始化信息页（用户协议、隐私政策、关于）
      const enabledLangCodes = createdLanguages
        .filter((l) => enabledSet.has(l.code))
        .map((l) => l.code);
      await initInfoPages({
        siteName: siteTitle,
        domain: siteDomain || undefined,
        languageCodes: enabledLangCodes,
        db: tx,
      });

      // 6. 初始化 R2 配置（如果提供）
      // 注意：R2 配置可能在步骤 3 已经通过 /api/system/r2-config 保存
      // 这里使用 upsert 确保最终提交时的配置是最新的（允许用户在步骤 3 后修改配置）
      const hasAnyR2Config =
        r2Url || r2SecretId || r2SecretKey || r2Token || r2Bucket || r2Domain;
      if (hasAnyR2Config) {
        const r2Configs: Record<string, string | null> = {};
        
        if (r2Url) r2Configs[CONFIG_KEY.R2_URL] = r2Url;
        if (r2SecretId) r2Configs[CONFIG_KEY.R2_SECRET_ID] = r2SecretId;
        if (r2SecretKey) r2Configs[CONFIG_KEY.R2_SECRET_KEY] = r2SecretKey;
        if (r2Token) r2Configs[CONFIG_KEY.R2_TOKEN] = r2Token;
        if (r2Bucket) r2Configs[CONFIG_KEY.R2_BUCKET] = r2Bucket;
        if (r2Domain) r2Configs[CONFIG_KEY.R2_DOMAIN] = r2Domain;

        // 批量创建/更新 R2 配置（使用 upsert，如果已存在则更新，不存在则创建）
        for (const [key, value] of Object.entries(r2Configs)) {
          const metadata = CONFIG_METADATA[key as keyof typeof CONFIG_METADATA];
          if (metadata) {
            await tx.systemConfig.upsert({
              where: { key },
              update: {
                value,
                description: metadata.description,
                category: metadata.category,
                isEncrypted: metadata.isEncrypted,
              },
              create: {
                key,
                value,
                description: metadata.description,
                category: metadata.category,
                isEncrypted: metadata.isEncrypted,
              },
            });
          }
        }
      }

      return {
        admin,
        languages: createdLanguages,
        setting,
        themes: createdThemes,
        hasAnyR2Config,
      };
    });

    // 只要提交了任意 R2 相关配置，就刷新配置缓存，防止变更后未及时更新缓存导致错误
    if (result.hasAnyR2Config) {
      await configCache.refresh();
    }

    return success(
      {
        adminId: result.admin.id,
        languageCount: result.languages.length,
        themeCount: result.themes.length,
      },
      "系统初始化成功"
    );
  } catch (err: any) {
    console.error("系统初始化失败:", err);
    return error(err.message || "系统初始化失败");
  }
});
