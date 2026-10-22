import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXTERNAL_LINK_MAX_COUNT,
  FREE_CONTENT_MARKER,
  REDEEM_CODE_ALPHABET,
  REDEEM_CODE_LENGTH,
  buildRedeemCode,
  nextSubscriptionWindow,
  normalizeExternalLinks,
  parseExternalLinks,
  remainingDays,
  serializeExternalLinks,
  columnRemovalArticleData,
  splitFreeContent,
  stripFreeMarker,
  tombstoneSlug,
} from "./column-access.ts";

describe("splitFreeContent", () => {
  it("没有标记时免费段为空", () => {
    assert.equal(splitFreeContent("全文都是付费"), null);
  });

  it("只取第一次标记之前的内容", () => {
    const content = `免费段\n${FREE_CONTENT_MARKER}\n付费段\n${FREE_CONTENT_MARKER}\n仍是付费`;
    assert.equal(splitFreeContent(content), "免费段\n");
  });

  it("标记在文首时免费段为空字符串", () => {
    assert.equal(splitFreeContent(`${FREE_CONTENT_MARKER}付费`), "");
  });
});

describe("stripFreeMarker", () => {
  it("只去掉第一次标记", () => {
    const content = `甲${FREE_CONTENT_MARKER}乙${FREE_CONTENT_MARKER}丙`;
    assert.equal(stripFreeMarker(content), `甲乙${FREE_CONTENT_MARKER}丙`);
  });
});

describe("nextSubscriptionWindow", () => {
  const now = new Date("2026-10-01T00:00:00.000Z");

  it("有效期内从到期时间顺延", () => {
    const expiresAt = new Date("2026-10-10T00:00:00.000Z");
    const startsAt = new Date("2026-09-01T00:00:00.000Z");
    const window = nextSubscriptionWindow({
      now,
      currentStartsAt: startsAt,
      currentExpiresAt: expiresAt,
      durationDays: 30,
    });
    assert.equal(window.startsAt.toISOString(), startsAt.toISOString());
    assert.equal(window.appliedFrom.toISOString(), expiresAt.toISOString());
    assert.equal(window.expiresAt.toISOString(), "2026-11-09T00:00:00.000Z");
    assert.equal(window.previousExpiresAt?.toISOString(), expiresAt.toISOString());
  });

  it("过期后从当前时刻重新起算", () => {
    const expiresAt = new Date("2026-09-01T00:00:00.000Z");
    const window = nextSubscriptionWindow({
      now,
      currentStartsAt: new Date("2026-08-01T00:00:00.000Z"),
      currentExpiresAt: expiresAt,
      durationDays: 90,
    });
    assert.equal(window.startsAt.toISOString(), now.toISOString());
    assert.equal(window.appliedFrom.toISOString(), now.toISOString());
    assert.equal(window.expiresAt.toISOString(), "2026-12-30T00:00:00.000Z");
  });

  it("首次开通从当前时刻起算", () => {
    const window = nextSubscriptionWindow({
      now,
      currentStartsAt: null,
      currentExpiresAt: null,
      durationDays: 365,
    });
    assert.equal(window.startsAt.toISOString(), now.toISOString());
    assert.equal(window.previousExpiresAt, null);
    assert.equal(remainingDays(window.expiresAt, now), 365);
  });
});

describe("buildRedeemCode", () => {
  it("码长固定且不含易混字符", () => {
    const code = buildRedeemCode((max) => max - 1);
    assert.equal(code.length, REDEEM_CODE_LENGTH);
    assert.equal(code, REDEEM_CODE_ALPHABET.at(-1)!.repeat(REDEEM_CODE_LENGTH));
    assert.equal(/[01ILO]/.test(code), false);
  });
});

describe("normalizeExternalLinks", () => {
  it("去掉空行并修剪空白，空说明不保留", () => {
    const result = normalizeExternalLinks([
      { name: " 小报童 ", url: " https://xiaobot.net/p/demo ", description: " " },
      { name: "", url: "", description: "只有说明" },
    ]);
    assert.deepEqual(result, {
      ok: true,
      links: [{ name: "小报童", url: "https://xiaobot.net/p/demo" }],
    });
  });

  it("缺名称或非 http(s) 链接时拒绝", () => {
    assert.equal(normalizeExternalLinks([{ name: "", url: "https://a.com" }]).ok, false);
    assert.equal(normalizeExternalLinks([{ name: "x", url: "javascript:alert(1)" }]).ok, false);
    assert.equal(normalizeExternalLinks([{ name: "x", url: "mp.weixin.qq.com" }]).ok, false);
  });

  it("超过数量上限时拒绝", () => {
    const links = Array.from({ length: EXTERNAL_LINK_MAX_COUNT + 1 }, (_, i) => ({
      name: `p${i}`,
      url: `https://a.com/${i}`,
    }));
    assert.equal(normalizeExternalLinks(links).ok, false);
    assert.equal(normalizeExternalLinks(links.slice(1)).ok, true);
  });

  it("非数组输入拒绝，空值视为没有外链", () => {
    assert.equal(normalizeExternalLinks("https://a.com").ok, false);
    assert.deepEqual(normalizeExternalLinks(undefined), { ok: true, links: [] });
  });
});

describe("parseExternalLinks", () => {
  it("损坏或不合规的 JSON 返回空列表", () => {
    assert.deepEqual(parseExternalLinks("not json"), []);
    assert.deepEqual(parseExternalLinks('[{"name":"x","url":"ftp://a"}]'), []);
    assert.deepEqual(parseExternalLinks(null), []);
  });

  it("与序列化结果往返一致", () => {
    const links = [{ name: "公众号", url: "https://mp.weixin.qq.com/s/x", description: "回复关键词" }];
    assert.deepEqual(parseExternalLinks(serializeExternalLinks(links)), links);
    assert.equal(serializeExternalLinks([]), null);
  });
});

describe("columnRemovalArticleData", () => {
  it("保留文章时改为单篇付费，不写价格", () => {
    const data = columnRemovalArticleData(false);
    assert.deepEqual(data, { accessType: "PAID", columnId: null });
    assert.equal("priceAmount" in data, false);
    assert.equal("currency" in data, false);
  });

  it("删除文章时只标记删除并取消发布", () => {
    assert.deepEqual(columnRemovalArticleData(true), {
      status: "DELETED",
      isPublished: false,
    });
  });
});

describe("tombstoneSlug", () => {
  it("让出原来的 slug，重复执行不再叠加", () => {
    assert.equal(tombstoneSlug("hello", "abc"), "hello-deleted-abc");
    assert.equal(tombstoneSlug("hello-deleted-abc", "xyz"), "hello-deleted-abc");
  });

  it("超长 slug 仍不超过 200 且保留删除后缀", () => {
    const next = tombstoneSlug("a".repeat(200), "id");
    assert.equal(next.length <= 200, true);
    assert.equal(next.endsWith("-deleted-id"), true);
  });
});
