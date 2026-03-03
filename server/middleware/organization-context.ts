import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";

/**
 * Organization context middleware
 * Automatically adds organizationId to context based on authenticated user
 * Ensures all queries are scoped to the user's organization
 */
export async function withOrganizationContext(ctx: TrpcContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Super admins can access all organizations (handled separately)
  // Regular users are scoped to their organization
  const organizationId = ctx.user.organizationId;

  if (!organizationId && ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User must belong to an organization",
    });
  }

  return {
    ...ctx,
    organizationId,
    isSuperAdmin: ctx.user.role === "super_admin",
  };
}

/**
 * Helper to add organization filter to queries
 * Usage: addOrgFilter(query, ctx.organizationId, ctx.isSuperAdmin)
 */
export function addOrgFilter<T extends { organizationId?: number }>(
  baseQuery: any,
  organizationId: number | undefined,
  isSuperAdmin: boolean
) {
  // Super admins see all data unless they've switched to a specific org
  if (isSuperAdmin && !organizationId) {
    return baseQuery;
  }

  // Regular users and switched super admins see only their org's data
  return baseQuery.where({ organizationId });
}
