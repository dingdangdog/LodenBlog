import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";

const MAX_BODY = 256 * 1024; // 256KB
const TIMEOUT_MS = 30000;

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function extractMeta(html: string, baseUrl: string): {
  name: string;
  description: string;
  icon: string | null;
} {
  const result = {
    name: "",
    description: "",
    icon: null as string | null,
  };

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    result.name = titleMatch[1]?.replace(/<[^>]+>/g, "").trim().slice(0, 200);
  }

  const descMeta = html.match(
    /<meta\s+[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
  );
  if (descMeta) {
    result.description = (descMeta[1] || descMeta[2] || "")
      .trim()
      .slice(0, 500);
  }

  const ogImage = html.match(
    /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>|<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i
  );
  if (ogImage) {
    result.icon = resolveUrl((ogImage[1] || ogImage[2] || "").trim(), baseUrl);
  }

  const iconLink = html.match(
    /<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["'][^>]*>|<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/i
  );
  if (iconLink && !result.icon) {
    result.icon = resolveUrl(
      (iconLink[1] || iconLink[2] || "").trim(),
      baseUrl
    );
  }

  if (!result.icon) {
    try {
      const u = new URL(baseUrl);
      result.icon = `${u.origin}/favicon.ico`;
    } catch {
      result.icon = null;
    }
  }

  return result;
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const url = (query.url as string)?.trim();
    if (!url) {
      return error("请提供链接");
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return error("链接必须以 http:// 或 https:// 开头");
    }

    const html = await $fetch<string>(url, {
      responseType: "text",
      timeout: TIMEOUT_MS,
      maxResponseSize: MAX_BODY,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }).catch((e: any) => {
      throw new Error(e?.message || "无法访问该链接");
    });

    const meta = extractMeta(html, url);
    return success(meta, "解析成功");
  } catch (err: any) {
    return error(err?.message || "解析失败");
  }
});
