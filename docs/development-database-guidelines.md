# 数据库开发规范（Prisma + PostgreSQL）

本文档用于约束团队在 `prisma/schema.prisma` 和后续迁移/建模时的方式，重点保证“约定式枚举”和“约定式关联字段”的可维护性。

## 1. 约定式枚举（不要用数据库枚举）

1. 业务枚举字段必须使用 `String` 或 `Int` 来表达其“允许值集合”，并用注释/文档约定允许值集合。
2. 禁止在 Prisma schema 中定义 `enum` 类型或在数据库侧强制使用枚举类型。
3. 表结构中允许的写法示例：
   - `status String @default("DRAFT") @db.VarChar(20) // DRAFT/PUBLISHED/ARCHIVED`
   - `role Int @default(1) // USER/CREATOR/ADMIN（用数字约定）`

> 参考实现：`prisma/schema.prisma` 中多个字段以 `String`/`Int` + 注释描述允许值集合，而没有 `enum` 定义。

## 2. 约定式主外键（不要强定义主外键）

1. 外键字段使用 `xxxId String`（或同等语义字段）方式存储，禁止在 Prisma 层使用显式关系建模（避免 `@relation`）。
2. 约定关联关系通过“字段语义 + 代码校验/业务约束”实现，不依赖数据库层的外键约束来保证一致性。
3. 禁止为外键增加强制的数据库级约束（如缺少也不应影响现有迁移/运行）。

> 参考实现：`Media` 模型中注释明确写了 `FK - 手动关联，不使用 Prisma 关系`，并直接提供 `uploaderId` 等字段。

## 3. 字段通用约定

1. 主键统一使用 `id String @id @default(cuid())`，并在 schema 中明确 `@db.VarChar(36)`。
2. 时间戳字段统一使用：
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
3. 多语言字段优先使用 `languageCode String @db.VarChar(10)`：
   - 不建议引入 `languageId` 作为主关联键（除非已有代码明确采用）。

## 4. 索引与唯一性约束

1. 查询频繁字段必须显式添加 `@@index(...)`，并按业务查询模式规划组合索引（例如文章状态/发布时间组合索引）。
2. 语言维度唯一约束优先使用 `@@unique([...])`：
   - 示例：`@@unique([articleBaseId, languageCode])`
   - 示例：`@@unique([slug, languageCode])`
3. 表名映射必须使用 `@@map("xxx")`：
   - Prisma model 的命名可以是语义化复数/单数，但物理表名需要保持项目约定。

## 5. 在迁移/建模中保持向后兼容

1. 新增字段优先使用可空类型（`String?` / `DateTime?` / `Int?`）或合理默认值，降低线上迁移风险。
2. 对已经存在的数据约束（唯一/必填）需要谨慎：避免在无数据回填策略时直接增加严格约束。

