import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

// 获取客户端信息的辅助函数
function getClientInfo(event: any): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  try {
    const headers = event.node.req.headers;
    // 尝试从请求头获取 IP 地址（支持 nginx 和 docker）
    const forwarded = headers["x-forwarded-for"];
    const realIp = headers["x-real-ip"];
    const cfConnectingIp = headers["cf-connecting-ip"]; // Cloudflare
    const ip =
      (forwarded ? String(forwarded).split(",")[0].trim() : null) ||
      (realIp ? String(realIp) : null) ||
      (cfConnectingIp ? String(cfConnectingIp) : null) ||
      event.node.req.socket?.remoteAddress ||
      null;

    const userAgent = headers["user-agent"] || null;

    return {
      ipAddress: ip,
      userAgent: userAgent ? String(userAgent).substring(0, 500) : null,
    };
  } catch (error) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }
}

export default defineEventHandler(async (event) => {
  try {
    const slugParam = getRouterParam(event, "slug");
    if (!slugParam) {
      return error("文章 slug 不能为空");
    }

    // slug 统一转为小写
    const slug = slugParam.toLowerCase();

    // 获取客户端传递的实际访问 URI（用于记录访客日志）
    const body = await readBody(event).catch(() => ({}));
    const query = getQuery(event);
    const articleUri =
      (body.uri as string) || (query.uri as string) || `/post/${slug}`;

    // 查找文章
    const articleContent = await prisma.articleContent.findFirst({
      where: { slug },
      include: {
        // 通过 Prisma 关系查询 ArticleBase（如果 schema 中有定义关系）
        // 否则手动查询
      },
    });

    if (!articleContent) {
      return error("文章不存在", null);
    }

    // 手动查询 ArticleBase（因为 schema 中可能没有定义关系）
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleContent.articleBaseId },
    });

    if (!articleBase || !articleBase.isPublished) {
      return error("文章不存在或未发布", null);
    }

    // 获取客户端信息
    const { ipAddress, userAgent } = getClientInfo(event);

    // 尝试获取用户ID（如果已登录）
    let userId: string | null = null;
    try {
      const { getServerSession } = await import("#auth");
      const session = await getServerSession(event);
      if (session?.user) {
        const user = session.user as any;
        if (user.id) {
          userId = user.id as string;
        }
      }
    } catch (error) {
      // 获取会话失败不影响浏览量记录
    }

    // 去重逻辑：检查最近30分钟内是否已有相同访问记录
    // 注意：URI 可能是 /post/{slug} 或 /{languageCode}/post/{slug}
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 构建去重查询条件
    // 匹配所有包含 /post/{slug} 的 URI（处理多语言情况）
    const whereConditions: any = {
      uri: {
        contains: `/post/${slug}`,
      },
      createdAt: {
        gte: thirtyMinutesAgo,
      },
    };

    // 如果已登录，使用用户ID去重（更准确）
    if (userId) {
      whereConditions.userId = userId;
    } else {
      // 如果未登录，使用 IP + User-Agent 去重
      // 注意：需要同时满足 IP 和 User-Agent 才能去重，避免误判
      const ipAndUserAgentConditions: any[] = [];
      if (ipAddress) {
        ipAndUserAgentConditions.push({ ipAddress });
      }
      if (userAgent) {
        ipAndUserAgentConditions.push({ userAgent });
      }

      // 如果 IP 和 User-Agent 都有，使用 AND 条件
      if (ipAndUserAgentConditions.length === 2) {
        whereConditions.AND = ipAndUserAgentConditions;
      } else if (ipAndUserAgentConditions.length === 1) {
        // 如果只有一个条件，直接使用
        Object.assign(whereConditions, ipAndUserAgentConditions[0]);
      }
      // 如果都没有，只使用 URI 和时间窗口去重（不太准确，但总比没有好）
    }

    const recentVisit = await prisma.visitLog.findFirst({
      where: whereConditions,
      orderBy: {
        createdAt: "desc",
      },
    });

    // 如果30分钟内已有访问记录，不增加浏览量
    if (recentVisit) {
      return success({ viewCount: articleBase.viewCount, recorded: false });
    }

    // 记录访客日志（使用实际访问的 URI）
    await prisma.visitLog.create({
      data: {
        userId: userId,
        uri: articleUri.substring(0, 500),
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });

    // 增加浏览量
    const updatedArticle = await prisma.articleBase.update({
      where: { id: articleBase.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return success({
      viewCount: updatedArticle.viewCount,
      recorded: true,
    });
  } catch (err: any) {
    console.error("记录文章浏览量失败:", err);
    return error(err.message || "记录文章浏览量失败");
  }
});
