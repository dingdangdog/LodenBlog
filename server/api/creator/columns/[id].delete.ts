import { success, error } from "~~/server/utils/result";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, removeColumn } from "~~/server/utils/column-domain";

function readDeleteArticles(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");

    const body = await readBody(event).catch(() => ({}));
    const deleteArticles = readDeleteArticles(
      body?.deleteArticles ?? getQuery(event).deleteArticles
    );
    if (deleteArticles === null) return error("请选择是否同时删除专栏文章");

    const result = await removeColumn(user.id, id, deleteArticles);
    return success(
      result,
      deleteArticles ? "专栏和文章已删除" : "专栏已删除，文章已改为单篇付费"
    );
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "删除专栏失败");
  }
});
