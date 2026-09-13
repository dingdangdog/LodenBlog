import prisma from "~~/lib/prisma";
import { dbInitConfig } from "../config/db-init.config";
import { defaultThemePresets } from "~~/utils/theme-presets";
import { configCache } from "~~/server/utils/config-cache";
import { ensureDatabaseMigrations } from "~~/server/lib/db-migrations";
import {
  initInfoPages,
  isInfoPagesInitialized,
  removeRetiredInfoPages,
} from "~~/server/utils/init-info-pages";
import { isAiProvider } from "~~/server/utils/provider-kind";

/**
 * 数据库初始化插件
 * 先同步 Prisma schema，再初始化基础数据
 */
export default defineNitroPlugin(async () => {
  if (import.meta.prerender) {
    return;
  }

  console.log("🔧 开始检查 Prisma 数据库同步...");
  await ensureDatabaseMigrations();
  console.log("✅ Prisma 数据库同步检查完成");

  try {
    const removed = await removeRetiredInfoPages();
    if (removed > 0) {
      console.log(`ℹ️  已移除 ${removed} 个已停用信息页（致谢）`);
    }
  } catch (error) {
    console.error("❌ 移除已停用信息页失败:", error);
  }

  try {
    // 首先加载系统配置缓存（必须在其他操作之前）
    await configCache.initialize();
  } catch (error) {
    console.error("❌ 加载系统配置缓存失败:", error);
    // 不中断服务器启动，但记录错误
  }

  // 检查是否启用自动初始化
  if (!dbInitConfig.enabled) {
    console.log("ℹ️  数据库自动初始化已禁用");
    return;
  }

  try {
    console.log("🔧 开始检查数据库基础数据...");

    // 1. 初始化默认语言
    if (dbInitConfig.languages.enabled) {
      await initLanguages();
    }

    // 2. 初始化默认主题
    if (dbInitConfig.themes.enabled) {
      await initThemes();
    }

    // 3. 初始化默认分类（仅在语言存在时）
    if (dbInitConfig.categories.enabled) {
      await initDefaultCategories();
    }

    // 4. 初始化默认标签（可选）
    if (dbInitConfig.tags.enabled) {
      await initDefaultTags();
    }

    // 5. 将存量 AI 行从翻译表拆到 AI 配置表，再分别补齐种子
    await migrateAiConfigsFromTranslation();
    await fixSettingProviderPointers();
    if (dbInitConfig.aiProviders.enabled) {
      await initAiProviders();
    }
    if (dbInitConfig.translationProviders.enabled) {
      await initTranslationProviders();
    }

    // 5.5 信息页：若系统已初始化（有 Setting）但尚无信息页，则按模板创建
    await initInfoPagesIfNeeded();

    console.log("✅ 数据库基础数据检查完成");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
    // 不中断服务器启动，只是记录错误
  }
});

/**
 * 初始化默认语言
 */
async function initLanguages() {
  try {
    const languageCount = await prisma.language.count();

    if (languageCount === 0) {
      console.log("📝 初始化默认语言...");

      const defaultLanguages = dbInitConfig.languages.data;

      await prisma.language.createMany({
        data: defaultLanguages,
        skipDuplicates: true,
      });

      console.log(`✅ 已创建 ${defaultLanguages.length} 种默认语言`);
    } else {
      console.log(`ℹ️  语言数据已存在 (${languageCount} 种)`);
    }
  } catch (error) {
    console.error("语言初始化失败:", error);
    throw error;
  }
}

/**
 * 初始化默认主题
 */
async function initThemes() {
  try {
    const themeCount = await prisma.theme.count();

    if (themeCount === 0) {
      console.log("🎨 初始化默认主题...");

      await prisma.theme.createMany({
        data: defaultThemePresets.map((theme) => ({
          ...theme,
          colors: JSON.stringify(theme.colors),
        })),
        skipDuplicates: true,
      });

      console.log(`✅ 已创建 ${defaultThemePresets.length} 个默认主题`);
    } else {
      console.log(`ℹ️  主题数据已存在 (${themeCount} 个)`);
    }
  } catch (error) {
    console.error("主题初始化失败:", error);
    throw error;
  }
}

/**
 * 初始化默认分类
 * 只有在语言存在且没有分类时才创建
 */
async function initDefaultCategories() {
  try {
    const categoryCount = await prisma.category.count();

    if (categoryCount === 0) {
      console.log("📂 初始化默认分类...");

      const languages = await prisma.language.findMany({
        where: { isActive: true },
      });

      if (languages.length === 0) {
        console.log("⚠️  没有可用语言，跳过分类初始化");
        return;
      }

      const categoryTemplates = dbInitConfig.categories.templates;

      let createdCount = 0;
      for (const template of categoryTemplates) {
        for (const lang of languages) {
          await prisma.category.create({
            data: {
              slug: template.slug,
              name:
                template.names[lang.code as keyof typeof template.names] ||
                template.names.en,
              description:
                template.descriptions[
                lang.code as keyof typeof template.descriptions
                ] || template.descriptions.en,
              languageCode: lang.code,
              isActive: true,
              sortOrder: template.sortOrder,
            },
          });
          createdCount++;
        }
      }

      console.log(`✅ 已创建 ${createdCount} 个默认分类`);
    } else {
      console.log(`ℹ️  分类数据已存在 (${categoryCount} 个)`);
    }
  } catch (error) {
    console.error("分类初始化失败:", error);
    throw error;
  }
}

/**
 * 初始化默认标签
 */
async function initDefaultTags() {
  try {
    const tagCount = await prisma.tag.count();

    if (tagCount === 0) {
      console.log("🏷️  初始化默认标签...");

      const languages = await prisma.language.findMany({
        where: { isActive: true },
      });

      if (languages.length === 0) {
        console.log("⚠️  没有可用语言，跳过标签初始化");
        return;
      }

      const tagTemplates = dbInitConfig.tags.templates;

      let createdCount = 0;
      for (const template of tagTemplates) {
        for (const lang of languages) {
          await prisma.tag.create({
            data: {
              slug: template.slug,
              name:
                template.names[lang.code as keyof typeof template.names] ||
                template.names.en,
              languageCode: lang.code,
            },
          });
          createdCount++;
        }
      }

      console.log(`✅ 已创建 ${createdCount} 个默认标签`);
    } else {
      console.log(`ℹ️  标签数据已存在 (${tagCount} 个)`);
    }
  } catch (error) {
    console.error("标签初始化失败:", error);
    throw error;
  }
}

/**
 * 把 translation_configs 中的 AI 行按原 ID 迁入 ai_configs，再删除源行
 */
async function migrateAiConfigsFromTranslation() {
  try {
    const rows = await prisma.translationConfig.findMany();
    let movedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (!isAiProvider(row.provider)) {
        continue;
      }

      const existing = await prisma.aiConfig.findUnique({
        where: { id: row.id },
      });
      if (!existing) {
        await prisma.aiConfig.create({
          data: {
            id: row.id,
            name: row.name,
            provider: row.provider,
            apiKey: row.apiKey,
            apiSecret: row.apiSecret,
            apiEndpoint: row.apiEndpoint,
            timeout: row.timeout,
            maxRetries: row.maxRetries,
            priority: row.priority,
            extraConfig: row.extraConfig,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        });
        movedCount++;
      } else {
        skippedCount++;
      }

      await prisma.translationConfig.delete({ where: { id: row.id } });
    }

    if (movedCount > 0 || skippedCount > 0) {
      console.log(
        `🔁 已将 ${movedCount} 条 AI 配置从翻译表迁入 AI 表（跳过已存在 ${skippedCount} 条）`
      );
    }
  } catch (error) {
    console.error("AI 配置拆表迁移失败:", error);
    throw error;
  }
}

/**
 * Setting 指针失效时置空：AI翻译必须指向 AiConfig，机器翻译必须指向 TranslationConfig
 */
async function fixSettingProviderPointers() {
  try {
    const settings = await prisma.setting.findMany();
    let updatedCount = 0;

    for (const setting of settings) {
      const data: {
        primaryTranslationProvider?: string | null;
        fallbackTranslationProvider?: string | null;
      } = {};

      if (setting.primaryTranslationProvider) {
        const ai = await prisma.aiConfig.findUnique({
          where: { id: setting.primaryTranslationProvider },
        });
        if (!ai) {
          data.primaryTranslationProvider = null;
        }
      }

      if (setting.fallbackTranslationProvider) {
        const machine = await prisma.translationConfig.findUnique({
          where: { id: setting.fallbackTranslationProvider },
        });
        if (!machine) {
          data.fallbackTranslationProvider = null;
        }
      }

      if (Object.keys(data).length > 0) {
        await prisma.setting.update({
          where: { id: setting.id },
          data,
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`ℹ️  已校正 ${updatedCount} 条设置中的失效翻译服务商指针`);
    }
  } catch (error) {
    console.error("校正翻译服务商指针失败:", error);
    throw error;
  }
}

async function initAiProviders() {
  try {
    console.log("🤖 初始化 AI 服务商配置...");

    const providers = dbInitConfig.aiProviders.providers;
    let createdCount = 0;
    let skippedCount = 0;

    for (const providerConfig of providers) {
      const existing = await prisma.aiConfig.findFirst({
        where: { provider: providerConfig.provider },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.aiConfig.create({
        data: {
          name: providerConfig.name,
          provider: providerConfig.provider,
          apiKey: null,
          apiSecret: null,
          apiEndpoint: null,
          timeout: providerConfig.timeout,
          maxRetries: providerConfig.maxRetries,
          priority: providerConfig.priority,
          extraConfig: providerConfig.extraConfig || null,
          isActive: providerConfig.isActive,
        },
      });

      createdCount++;
    }

    if (createdCount > 0) {
      console.log(`✅ 已创建 ${createdCount} 个 AI 服务商配置`);
    }
    if (skippedCount > 0) {
      console.log(`ℹ️  跳过 ${skippedCount} 个已存在的 AI 服务商配置`);
    }
  } catch (error) {
    console.error("AI 服务商初始化失败:", error);
    throw error;
  }
}

/**
 * 初始化机器翻译服务商配置
 * 使用 provider 字段作为唯一标识，如果已存在则跳过，不存在则创建
 */
async function initTranslationProviders() {
  try {
    console.log("🌐 初始化翻译服务商配置...");

    const providers = dbInitConfig.translationProviders.providers;
    let createdCount = 0;
    let skippedCount = 0;

    for (const providerConfig of providers) {
      // 检查该 provider 是否已存在
      const existing = await prisma.translationConfig.findFirst({
        where: { provider: providerConfig.provider },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // 创建新的翻译服务商配置
      await prisma.translationConfig.create({
        data: {
          name: providerConfig.name,
          provider: providerConfig.provider,
          apiKey: null, // 默认不设置 API Key，需要用户手动配置
          apiSecret: null,
          apiEndpoint: null,
          timeout: providerConfig.timeout,
          maxRetries: providerConfig.maxRetries,
          priority: providerConfig.priority,
          extraConfig: providerConfig.extraConfig || null,
          isActive: providerConfig.isActive,
        },
      });

      createdCount++;
    }

    if (createdCount > 0) {
      console.log(`✅ 已创建 ${createdCount} 个翻译服务商配置`);
    }
    if (skippedCount > 0) {
      console.log(`ℹ️  跳过 ${skippedCount} 个已存在的翻译服务商配置`);
    }
    if (createdCount === 0 && skippedCount === 0) {
      console.log("ℹ️  没有需要初始化的翻译服务商配置");
    }
  } catch (error) {
    console.error("翻译服务商初始化失败:", error);
    throw error;
  }
}

/**
 * 信息页：仅检查表中是否有数据，无数据则初始化
 */
async function initInfoPagesIfNeeded() {
  try {
    const initialized = await isInfoPagesInitialized();
    if (initialized) return;

    const setting = await prisma.setting.findFirst();
    if (!setting) return;

    const languages = await prisma.language.findMany({
      where: { isActive: true },
    });
    if (languages.length === 0) return;

    console.log("📄 初始化信息页（用户协议、隐私政策、关于）...");
    await initInfoPages({
      siteName: setting.title || "Loden",
      domain: setting.domain || undefined,
      languageCodes: languages.map((l) => l.code),
    });
    console.log("✅ 信息页初始化完成");
  } catch (err) {
    console.error("信息页初始化失败:", err);
  }
}
