# 失败翻译任务可换模型后重新执行

**日期：** 2026-10-13

## 背景 / 问题

翻译日志里失败或已完成的任务只能点一次就按原模型重新入队，不能先换成别的模型。

## 变更内容

- 单条重新执行、以及重试所有失败任务，都会先打开选择框。
- 可选已启用的 AI 模型或机器翻译配置；单条默认选中当前模型，批量默认保持各任务原模型。
- 选择「使用系统默认」会清空该任务的服务商，改走站点当前翻译配置。
- 当前模型已停用或未配置时，会提示另选。
- 列表上的服务商标记会带上配置里的模型名。

## 影响范围

- `app/pages/admin/translationlogs.client.vue`
- `server/api/creator/translationlog/[id]/retry.post.ts`
- `server/api/creator/translationlog/retry-all-failed.post.ts`
- `server/api/creator/translationlog/index.get.ts`
- `server/api/creator/translations.get.ts`
- `server/utils/provider-config.ts`
- `locales/*/admin/translationlogs.json`

## 数据库与兼容性

- 无表结构变更。仍使用 `translation_logs.providerId`。
- 未传 `providerId` 的旧请求保持原模型。

## 验证

- 未启动开发服务，未在浏览器中操作该弹窗。
- 已检查相关 JSON 可解析。

## 未做事项

- `FAILURE_LOG` 类型仍不进入翻译队列，页面上也不能对它换模型重跑。
