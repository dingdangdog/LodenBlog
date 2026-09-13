import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { getServerSession } from "#auth";

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
      userAgent: userAgent ? String(userAgent).substring(0, 500) : null, // 限制长度
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
    // 获取查询参数中的 URI（前端传递）
    const query = getQuery(event);
    const uri = (query.uri as string) || event.path || "/";

    // 获取客户端信息
    const { ipAddress, userAgent } = getClientInfo(event);

    // 尝试获取用户ID（如果已登录）
    let userId: string | null = null;
    try {
      const session = await getServerSession(event);
      if (session?.user) {
        const user = session.user as any;
        if (user.id) {
          userId = user.id as string;
        }
      }
    } catch (error) {
      // 获取会话失败不影响日志记录
    }

    // 记录访客日志
    await prisma.visitLog.create({
      data: {
        userId: userId,
        uri: uri.substring(0, 500), // 限制长度
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });

    return success(null, "记录成功");
  } catch (err: any) {
    // 日志记录失败不应该影响页面加载，静默处理
    console.error("记录访客日志失败:", err);
    return success(null, "记录失败");
  }
});
