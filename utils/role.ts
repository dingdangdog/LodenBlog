export const ROLE_LEVEL = {
  USER: 1,
  CREATOR: 2,
  ADMIN: 99,
} as const;

export type RoleLevel = (typeof ROLE_LEVEL)[keyof typeof ROLE_LEVEL];

export const hasRequiredRole = (
  current?: number | null,
  required: RoleLevel = ROLE_LEVEL.USER
): boolean => {
  if (current === undefined || current === null) {
    return false;
  }
  return current >= required;
};
