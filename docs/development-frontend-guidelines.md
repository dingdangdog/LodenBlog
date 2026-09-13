# 前端开发规范（Nuxt 3）

本文档用于约束团队在 `app/`（Vue 组件、页面、前端中间件）侧的实现方式，重点保证 UI 表单一致性与交互可预期性。

## 1. 必填字段标识

1. 必填项的提示符必须使用 `*`，且颜色为红色。
2. 已有实现优先复用如下写法：
   - `span`：`class="text-red-500"`，直接展示 `*`（如 `app/components/system/TranslationSettings.vue`）。
   - 表格/配置类场景可使用更小字号：`class="text-xs text-red-500"`，并建议增加 `title="必填"`（如 `app/components/system/Config.vue`）。
3. 禁止使用其他颜色或非星号符号替代必填标识。

## 2. 弹窗交互规则

将弹窗按用途区分为两类，并分别采用不同的关闭策略。

### 2.1 确认类弹窗（Confirmation）

1. 确认类弹窗允许用户点击遮罩区域关闭（等价于取消）。
2. 允许按键 `Esc` 关闭（如组件已实现该行为）。
3. 建议统一使用项目已有的确认弹窗：
   - 通过 `app/components/common/ConfirmDialog.vue` 暴露 `show()`/`hide()`。
   - 通过 `app/composables/useConfirm.ts` 发起确认流程。

> 参考实现：`app/components/common/ConfirmDialog.vue` 的遮罩使用 `@click.self="handleCancel"`。

### 2.2 表单类弹窗（提交/编辑表单）

1. 表单类弹窗禁止“点击弹窗外侧自动关闭”，以避免用户输入丢失。
2. 表单类弹窗的关闭必须来自显式动作：
   - 点击表单内的 `取消/关闭` 按钮
   - 或提交成功后由代码显式关闭
   - 或按键 `Esc`（若组件明确实现）
3. 表单类弹窗实现时，遮罩层可以存在，但不应绑定“遮罩点击即关闭”的逻辑。
4. 建议使用事件拦截防止遮罩层触发：
   - 遮罩容器层使用 `fixed inset-0`
   - 表单内容容器使用 `@click.stop`

> 参考实现：`app/components/system/TranslationSettings.vue` 的“翻译配置编辑模态框”遮罩层未绑定 `click.self` 关闭，仅在内容容器 `@click.stop`。

## 3. 弹窗实现要点（通用）

1. 弹窗主体必须使用 `Teleport to="body"`。
2. 使用 `fixed inset-0` 作为遮罩层的布局基线，z-index 采用项目已有层级习惯（如 `z-[9999]` / `z-50`）。
3. 弹窗内交互元素（input/select/textarea/button）必须阻止冒泡到遮罩层：使用 `@click.stop` 或在必要时补齐 `@click.self` 的边界条件。

## 4. 不要绕过后端校验

1. 前端负责提示用户应填项与基础校验，但后端必须仍校验必填字段与权限。
2. 当后端返回 `error` 时，前端应展示后端 message（或 i18n 文案）给用户。

