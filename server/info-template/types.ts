/** 单条信息：仅标题 + 正文，入库即 content 字段 */
export type InfoBlock = {
  title: string;
  content: string;
};

export type InfoKey = "terms" | "privacy" | "about";
