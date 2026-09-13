import { createHash } from "crypto";

function requireSalt(): string {
  const salt = process.env.NUXT_SALT;
  if (!salt) {
    throw new Error("NUXT_SALT is required");
  }
  return salt;
}

/**
 * 生成密码哈希
 */
export function hashPassword(password: string): string {
  const hash = createHash("sha256");
  hash.update(password + requireSalt());
  return hash.digest("hex");
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

