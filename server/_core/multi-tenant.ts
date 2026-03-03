import type { TrpcContext } from "./context";

/**
 * Get the organization ID from the authenticated user context.
 * Super admins can optionally specify a different organizationId via input.
 * Falls back to organization ID 1 (Change In Youth) if not set.
 */
export function getOrganizationId(
  ctx: TrpcContext,
  overrideOrgId?: number
): number {
  // Super admins can access any organization
  if (ctx.user?.role === "super_admin" && overrideOrgId) {
    return overrideOrgId;
  }

  // Return user's organization ID, default to 1
  return ctx.user?.organizationId || 1;
}

/**
 * Check if user is super admin (can access all organizations)
 */
export function isSuperAdmin(ctx: TrpcContext): boolean {
  return ctx.user?.role === "super_admin";
}

/**
 * Check if user belongs to the specified organization
 */
export function belongsToOrganization(
  ctx: TrpcContext,
  organizationId: number
): boolean {
  if (isSuperAdmin(ctx)) return true;
  return ctx.user?.organizationId === organizationId;
}
