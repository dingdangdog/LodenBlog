const r2Domain = ref<string | null>(null);

export const initR2Domain = async () => {
  const res = await $fetch<{
    c: number;
    m: string;
    d: { domain: string | null };
  }>("/api/system/r2-domain");
  if (res.c === 200 && res.d?.domain) {
    r2Domain.value = res.d.domain;
  }
};

/**
 * 标准化头像 URL
 * @param avatar 头像路径
 * @returns 完整的头像 URL
 */
export const normalizeAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) {
    return "";
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  const cleanAvatar = avatar.replace(/^\/+/, "");

  // 优先从 store 获取 R2 域名（从数据库读取），否则从 runtimeConfig 获取
  let finalDomain = r2Domain.value;

  if (!finalDomain) {
    return `/${cleanAvatar}`;
  }

  const trimmedDomain = finalDomain.replace(/\/+$/, "");
  const hasProtocol = /^https?:\/\//i.test(trimmedDomain);
  const base = hasProtocol ? trimmedDomain : `https://${trimmedDomain}`;

  return `${base}/${cleanAvatar}`;
};
