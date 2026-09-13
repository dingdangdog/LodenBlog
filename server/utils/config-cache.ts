import prisma from "~~/lib/prisma";
import { CONFIG_KEY, CONFIG_METADATA, type ConfigKey } from "./config-keys";

/**
 * 配置缓存
 * 在服务器启动时加载所有配置到内存，提供快速访问
 */
class ConfigCache {
  private cache: Map<string, string | null> = new Map();
  private initialized: boolean = false;

  /**
   * 初始化配置缓存
   * 从数据库加载所有配置到内存
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log("📦 开始加载系统配置到缓存...");

      // 从数据库加载所有配置
      const configs = await prisma.systemConfig.findMany();
      // console.log(configs);
      // 清空现有缓存
      this.cache.clear();

      // 将配置加载到缓存
      for (const config of configs) {
        this.cache.set(config.key, config.value);
      }

      // 确保所有定义的配置键都在缓存中（即使值为 null）
      for (const key of Object.values(CONFIG_KEY)) {
        if (!this.cache.has(key)) {
          this.cache.set(key, null);
        }
      }

      this.initialized = true;
      console.log(`✅ 已加载 ${configs.length} 个系统配置到缓存`);
    } catch (error) {
      console.error("❌ 加载系统配置失败:", error);
      throw error;
    }
  }

  /**
   * 获取配置值
   * @param key 配置键
   * @returns 配置值，如果不存在则返回 null
   */
  get(key: ConfigKey): string | null {
    if (!this.initialized) {
      console.warn(`⚠️  配置缓存未初始化，尝试获取配置: ${key}`);
      return null;
    }
    return this.cache.get(key) || null;
  }

  /**
   * 获取配置值（带默认值）
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值，如果不存在则返回默认值
   */
  getWithDefault(key: ConfigKey, defaultValue: string): string {
    const value = this.get(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * 设置配置值（同时更新缓存和数据库）
   * @param key 配置键
   * @param value 配置值
   */
  async set(key: ConfigKey, value: string | null): Promise<void> {
    const metadata = CONFIG_METADATA[key];
    if (!metadata) {
      throw new Error(`未知的配置键: ${key}`);
    }

    try {
      // 更新数据库
      await prisma.systemConfig.upsert({
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

      // 更新缓存
      this.cache.set(key, value);
    } catch (error) {
      console.error(`设置配置失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 批量设置配置值
   * @param configs 配置对象 { key: value }
   */
  async setBatch(configs: Record<ConfigKey, string | null>): Promise<void> {
    try {
      // 使用事务批量更新
      await prisma.$transaction(
        Object.entries(configs).map(([key, value]) => {
          const configKey = key as ConfigKey;
          const metadata = CONFIG_METADATA[configKey];
          if (!metadata) {
            throw new Error(`未知的配置键: ${configKey}`);
          }

          return prisma.systemConfig.upsert({
            where: { key: configKey },
            update: {
              value,
              description: metadata.description,
              category: metadata.category,
              isEncrypted: metadata.isEncrypted,
            },
            create: {
              key: configKey,
              value,
              description: metadata.description,
              category: metadata.category,
              isEncrypted: metadata.isEncrypted,
            },
          });
        })
      );

      // 更新缓存
      for (const [key, value] of Object.entries(configs)) {
        this.cache.set(key as ConfigKey, value);
      }
    } catch (error) {
      console.error("批量设置配置失败:", error);
      throw error;
    }
  }

  /**
   * 刷新缓存（从数据库重新加载）
   * 凡在别处直接写入 systemConfig 表（如初始化 R2、init 接口）后，应调用此方法使缓存及时生效
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * 获取布尔配置（用于开关项）
   * 仅当值为 "false"（不区分大小写）时返回 false，否则返回 true（含未配置或空字符串，便于向后兼容）
   */
  getBoolean(key: ConfigKey): boolean {
    const value = this.get(key);
    if (value === null || value === undefined) return true;
    return String(value).toLowerCase() !== "false";
  }

  /**
   * 检查配置是否存在
   * @param key 配置键
   * @returns 是否存在
   */
  has(key: ConfigKey): boolean {
    const value = this.get(key);
    return value !== null && value !== "";
  }

  /**
   * 获取所有配置（用于管理界面）
   */
  getAll(): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const key of Object.values(CONFIG_KEY)) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * 检查缓存是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例
export const configCache = new ConfigCache();
