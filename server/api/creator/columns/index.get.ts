import { success, error } from "~~/server/utils/result";
import { requireCreator } from "~~/server/utils/permission";
import { columnCardsForAuthor } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "zh";
    const columns = await columnCardsForAuthor(user.id, languageCode, false);
    return success({ columns });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取专栏失败");
  }
});
