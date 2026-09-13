export type VisitClientCategory = "human" | "bot" | "unknown";

export interface VisitClassification {
  category: VisitClientCategory;
  botVendor: string | null;
  clientType: string;
}

export interface VisitLikeLog {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface VisitMetrics {
  totalVisits: number;
  humanVisits: number;
  humanUniqueIps: number;
  botVisits: number;
  unknownVisits: number;
  botVendors: Array<{ vendor: string; count: number }>;
}

const BOT_VENDOR_PATTERNS: Array<{ vendor: string; pattern: RegExp }> = [
  {
    vendor: "google",
    pattern:
      /googlebot|adsbot-google|apis-google|mediapartners-google|google-inspectiontool|googleother/i,
  },
  { vendor: "bing", pattern: /bingbot|adidxbot|bingpreview/i },
  { vendor: "baidu", pattern: /baiduspider/i },
  { vendor: "yandex", pattern: /yandex(bot|images|mobilebot)/i },
  { vendor: "duckduckgo", pattern: /duckduckbot/i },
  { vendor: "bytespider", pattern: /bytespider|bytedance/i },
  { vendor: "sogou", pattern: /sogou web spider|sogou spider/i },
  { vendor: "semrush", pattern: /semrushbot/i },
  { vendor: "ahrefs", pattern: /ahrefsbot/i },
  { vendor: "mj12", pattern: /mj12bot/i },
  { vendor: "facebook", pattern: /facebookexternalhit|facebot/i },
  { vendor: "twitter", pattern: /twitterbot/i },
  { vendor: "apple", pattern: /applebot/i },
  { vendor: "petal", pattern: /petalbot/i },
  { vendor: "openai", pattern: /gptbot|chatgpt-user|oai-searchbot/i },
  { vendor: "anthropic", pattern: /claudebot/i },
  { vendor: "amazon", pattern: /amazonbot/i },
  { vendor: "perplexity", pattern: /perplexitybot/i },
  { vendor: "coccoc", pattern: /coccocbot/i },
];

const GENERIC_BOT_PATTERN =
  /bot|spider|crawler|slurp|headless|phantomjs|selenium|scrapy|python-requests|curl|wget|postmanruntime|go-http-client|okhttp|httpclient|axios|insomnia/i;

function getClientType(uaLower: string): string {
  if (
    /curl|wget|python-requests|go-http-client|okhttp|postmanruntime|httpclient|axios|insomnia/i.test(
      uaLower
    )
  ) {
    return "script";
  }
  if (/mobile|iphone|android|ipad|harmonyos/i.test(uaLower)) {
    return "mobile";
  }
  if (/mozilla|chrome|safari|firefox|edg\//i.test(uaLower)) {
    return "browser";
  }
  return "unknown";
}

export function classifyVisit(userAgent: string | null): VisitClassification {
  const ua = (userAgent || "").trim();
  const uaLower = ua.toLowerCase();
  if (!uaLower) {
    return {
      category: "unknown",
      botVendor: null,
      clientType: "unknown",
    };
  }

  for (const item of BOT_VENDOR_PATTERNS) {
    if (item.pattern.test(uaLower)) {
      return {
        category: "bot",
        botVendor: item.vendor,
        clientType: "bot",
      };
    }
  }

  if (GENERIC_BOT_PATTERN.test(uaLower)) {
    return {
      category: "bot",
      botVendor: "other",
      clientType: "bot",
    };
  }

  return {
    category: "human",
    botVendor: null,
    clientType: getClientType(uaLower),
  };
}

export function buildVisitMetrics<T extends VisitLikeLog>(logs: T[]): VisitMetrics {
  const ipSet = new Set<string>();
  const botVendorMap = new Map<string, number>();
  let humanVisits = 0;
  let botVisits = 0;
  let unknownVisits = 0;

  for (const log of logs) {
    const classification = classifyVisit(log.userAgent);
    if (classification.category === "human") {
      humanVisits += 1;
      if (log.ipAddress) {
        ipSet.add(log.ipAddress);
      }
      continue;
    }

    if (classification.category === "bot") {
      botVisits += 1;
      const vendor = classification.botVendor || "other";
      botVendorMap.set(vendor, (botVendorMap.get(vendor) || 0) + 1);
      continue;
    }

    unknownVisits += 1;
  }

  return {
    totalVisits: logs.length,
    humanVisits,
    humanUniqueIps: ipSet.size,
    botVisits,
    unknownVisits,
    botVendors: Array.from(botVendorMap.entries())
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count),
  };
}
