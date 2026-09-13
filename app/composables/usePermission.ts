import { ROLE_LEVEL, hasRequiredRole } from "~~/utils/role";

export const usePermission = () => {
  const { data: session, status } = useAuth();

  const user = computed(() => session.value?.user as any);
  const roleLevel = computed(() => Number(user.value?.role ?? 0));

  const isAuthenticated = computed(
    () => !!user.value && status.value === "authenticated"
  );

  const isUser = computed(() =>
    hasRequiredRole(roleLevel.value, ROLE_LEVEL.USER)
  );
  const isCreator = computed(() =>
    hasRequiredRole(roleLevel.value, ROLE_LEVEL.CREATOR)
  );
  const isAdmin = computed(() =>
    hasRequiredRole(roleLevel.value, ROLE_LEVEL.ADMIN)
  );

  const hasRole = (minRole: number) =>
    hasRequiredRole(roleLevel.value, minRole);

  const isOwner = (ownerId: string) => user.value?.id === ownerId;

  const canEdit = (ownerId: string) =>
    isOwner(ownerId) || hasRequiredRole(roleLevel.value, ROLE_LEVEL.ADMIN);

  return {
    user,
    roleLevel,
    isAuthenticated,
    isUser,
    isCreator,
    isAdmin,
    hasRole,
    isOwner,
    canEdit,
  };
};
