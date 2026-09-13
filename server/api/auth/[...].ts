import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "~~/lib/prisma";
import { verifyPassword } from "~~/server/utils/password";
import { ROLE_LEVEL } from "~~/utils/role";

// 登录日志记录工具函数
async function logLoginAttempt(data: {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  loginMethod: string;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string | null;
  location?: string | null;
}) {
  try {
    await prisma.loginLog.create({
      data: {
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        loginMethod: data.loginMethod,
        status: data.status,
        errorMessage: data.errorMessage || null,
        location: data.location || null,
      },
    });
  } catch (error) {
    // 日志记录失败不应该影响登录流程，只记录到控制台
    console.error("Failed to log login attempt:", error);
  }
}

// 获取客户端信息的辅助函数
function getClientInfo(req: any): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  try {
    // 尝试从请求头获取 IP 地址
    const forwarded = req?.headers?.["x-forwarded-for"];
    const realIp = req?.headers?.["x-real-ip"];
    const ip =
      (forwarded ? forwarded.split(",")[0].trim() : null) ||
      realIp ||
      req?.socket?.remoteAddress ||
      null;

    const userAgent = req?.headers?.["user-agent"] || null;

    return {
      ipAddress: ip,
      userAgent: userAgent,
    };
  } catch (error) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }
}

// 扩展 NextAuth 类型
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string; // 数据库的 name（昵称，用于显示）
    role: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string; // 数据库的 name（昵称，用于显示）
    email?: string; // 数据库的 email
    role: number;
  }
}

export default NuxtAuthHandler({
  secret: process.env.NUXT_AUTH_SECRET,

  providers: [
    // @ts-expect-error
    CredentialsProvider.default({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any, req: any) {
        let user = null;
        let errorMessage: string | null = null;
        const clientInfo = getClientInfo(req);

        try {
          if (!credentials?.email || !credentials?.password) {
            errorMessage = "邮箱或密码为空";
            // 异步记录失败日志，不阻塞返回
            logLoginAttempt({
              userId: null,
              ipAddress: clientInfo.ipAddress,
              userAgent: clientInfo.userAgent,
              loginMethod: "credentials",
              status: "FAILED",
              errorMessage: errorMessage,
            }).catch(() => {});
            return null;
          }

          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { username: credentials.email },
              ],
              isActive: true,
            },
          });

          if (!user || !user.password) {
            errorMessage = "用户不存在或未设置密码";
            // 异步记录失败日志，不阻塞返回
            logLoginAttempt({
              userId: user?.id || null,
              ipAddress: clientInfo.ipAddress,
              userAgent: clientInfo.userAgent,
              loginMethod: "credentials",
              status: "FAILED",
              errorMessage: errorMessage,
            }).catch(() => {});
            return null;
          }

          if (!verifyPassword(credentials.password, user.password)) {
            errorMessage = "密码错误";
            // 异步记录失败日志，不阻塞返回
            logLoginAttempt({
              userId: user.id,
              ipAddress: clientInfo.ipAddress,
              userAgent: clientInfo.userAgent,
              loginMethod: "credentials",
              status: "FAILED",
              errorMessage: errorMessage,
            }).catch(() => {});
            return null;
          }

          // 登录成功，异步记录成功日志，不阻塞返回
          logLoginAttempt({
            userId: user.id,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            loginMethod: "credentials",
            status: "SUCCESS",
          }).catch(() => {});

          return {
            id: user.id,
            email: user.email,
            name: user.name, // 数据库的 name（昵称），如果没有则使用 username
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          errorMessage = error instanceof Error ? error.message : "未知错误";
          // 异步记录失败日志，不阻塞返回
          logLoginAttempt({
            userId: user?.id || null,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            loginMethod: "credentials",
            status: "FAILED",
            errorMessage: errorMessage,
          }).catch(() => {});
          return null;
        }
      },
    }),

    // @ts-expect-error

    GithubProvider.default({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      issuer: "https://github.com/login/oauth",
    }),

    // @ts-expect-error

    GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // 处理 undefined URL 的情况
      if (!url || url === "undefined") {
        return baseUrl;
      }
      // 如果 URL 是相对路径，拼接 baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 如果是同域名，直接返回
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // 默认返回 baseUrl
      return baseUrl;
    },

    async jwt({ token, user, account, trigger }) {
      // 处理OAuth登录（GitHub/Google）
      if (account?.provider && account?.provider !== "credentials") {
        const providerId = account.providerAccountId;
        const provider = account.provider;

        // 查找或创建用户
        let dbUser = await prisma.user.findFirst({
          where:
            provider === "github"
              ? { githubId: providerId }
              : provider === "google"
              ? { googleId: providerId }
              : undefined,
        });

        if (!dbUser && token.email) {
          // 如果通过 providerId 找不到，尝试通过 email 查找
          const existingUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });

          if (existingUser) {
            // 如果 email 已存在，更新现有用户，添加 providerId
            // 重要：保持数据库中的用户名不变，不更新 username 和 name
            dbUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                githubId:
                  provider === "github" ? providerId : existingUser.githubId,
                googleId:
                  provider === "google" ? providerId : existingUser.googleId,
                emailVerified: true,
              },
            });
          } else {
            // 新用户：账号（username）仅由邮箱解析，昵称（name）使用 OAuth 的 name
            const baseUsername = (token.email as string).split("@")[0] || "";
            const sanitized = baseUsername.replace(/[^a-zA-Z0-9_]/g, "");
            const base = sanitized || "user";
            let username = base;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${base}${counter}`;
              counter++;
            }

            dbUser = await prisma.user.create({
              data: {
                email: token.email as string,
                username,
                name: token.name || username,
                githubId: provider === "github" ? providerId : undefined,
                googleId: provider === "google" ? providerId : undefined,
                avatar: token.picture as string,
                role: ROLE_LEVEL.USER,
                isActive: true,
                emailVerified: true,
              },
            });
          }
        }

        // 如果找到或创建了用户，使用数据库中的用户信息
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name; // 始终使用数据库中的 name（昵称）
          token.email = dbUser.email; // 确保使用数据库中的 email

          // OAuth 登录成功，异步记录日志
          // 注意：在 jwt callback 中无法直接获取请求信息（IP 和 User-Agent）
          // 但至少记录登录事件，IP 和 User-Agent 可以为空
          logLoginAttempt({
            userId: dbUser.id,
            ipAddress: null, // OAuth 登录流程中无法获取 IP
            userAgent: null, // OAuth 登录流程中无法获取 User-Agent
            loginMethod: provider,
            status: "SUCCESS",
          }).catch(() => {});
        }
      } else if (user) {
        // 处理 Credentials 登录（账号密码登录）
        // 此时 user 来自 authorize 函数返回，已经包含数据库的 username 和 name
        token.role = user.role;
        token.id = user.id;
        token.name = user.name; // 存储数据库的 name（昵称）
        token.email = user.email; // 存储数据库的 email
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        // 确保 name 和 email 使用数据库中的值，而不是 OAuth 返回的值
        session.user.name = token.name;
        session.user.email = (token.email as string) || session.user.email;
        
        // 从数据库获取用户头像
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { avatar: true },
          });
          if (dbUser) {
            (session.user as any).avatar = dbUser.avatar;
          }
        } catch (error) {
          // 如果查询失败，不影响 session 创建
          console.error("Failed to fetch user avatar:", error);
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // OAuth 登录已在 jwt callback 中记录，这里不需要额外处理
    },
  },
});
