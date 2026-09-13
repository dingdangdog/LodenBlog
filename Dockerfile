# 多阶段构建 Dockerfile for Nuxt 4 + Prisma

# 阶段 1: 依赖安装和构建
FROM node:22.21.1-alpine3.22 AS builder

ARG APP_VERSION=dev
ARG BUILD_SHA=unknown

WORKDIR /app

# Node 22 自带 Corepack 默认会拉取 pnpm 12。pnpm 12 是原生二进制，
# Corepack 不跑安装脚本且仍查找 bin/pnpm.cjs，会报 MODULE_NOT_FOUND。
# 本仓库 lockfile 由 pnpm 10 生成，改用镜像全局安装 10.33.0。
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

RUN apk add --no-cache openssl libc6-compat \
    && npm install -g pnpm@10.33.0 --registry=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts --registry=https://registry.npmmirror.com

COPY . .

ENV NUXT_PUBLIC_VERSION=$APP_VERSION
RUN pnpm run postinstall && pnpm build

# 阶段 2: 生产运行环境
FROM node:22.21.1-alpine3.22 AS runner

ARG APP_VERSION=dev
ARG BUILD_SHA=unknown

LABEL author.name="Loden"
LABEL project.name="loden"
LABEL org.opencontainers.image.title="loden"
LABEL org.opencontainers.image.version="2.0.0"

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# 运行时工作目录为 /app。启动插件从 prisma/migrations 读取 SQL 做 schema 同步，
# 构建期不连库、不 migrate。
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nuxtjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nuxtjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nuxtjs

EXPOSE 7061

ENV TZ=Asia/Shanghai
ENV NODE_ENV=production
ENV PORT=7061
ENV DATABASE_MODE=postgre
ENV NUXT_RESOURCE=/app/resources
ENV NUXT_PUBLIC_VERSION=2.0.0

CMD ["node", ".output/server/index.mjs"]
