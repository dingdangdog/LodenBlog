import { success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  return success({ items: [] }, "not implemented: list tags");
});
