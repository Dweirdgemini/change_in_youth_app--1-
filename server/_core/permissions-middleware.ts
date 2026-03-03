/**
 * TRPC Permission Middleware
 * 
 * Provides middleware functions to check permissions before executing TRPC procedures
 */

import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { hasPermission, type Permission, type UserRole } from "../../lib/permissions";

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const userRole = ctx.user.role as UserRole;
    
    if (!hasPermission(userRole, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have permission to access this resource. Required permission: ${permission}`,
      });
    }

    return next();
  };
}

/**
 * Middleware to require ANY of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const userRole = ctx.user.role as UserRole;
    const hasAny = permissions.some(permission => hasPermission(userRole, permission));
    
    if (!hasAny) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have permission to access this resource. Required permissions: ${permissions.join(", ")}`,
      });
    }

    return next();
  };
}

/**
 * Middleware to require ALL of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const userRole = ctx.user.role as UserRole;
    const hasAll = permissions.every(permission => hasPermission(userRole, permission));
    
    if (!hasAll) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have permission to access this resource. Required permissions: ${permissions.join(", ")}`,
      });
    }

    return next();
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: UserRole | UserRole[]) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const userRole = ctx.user.role as UserRole;
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have permission to access this resource. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    return next();
  };
}

/**
 * Middleware to require finance access
 */
export const requireFinanceAccess = requirePermission("view_financials");

/**
 * Middleware to require project access
 */
export const requireProjectAccess = requirePermission("view_projects");

/**
 * Middleware to require admin access
 */
export const requireAdminAccess = requirePermission("access_admin_panel");

/**
 * Middleware to require social media access
 */
export const requireSocialMediaAccess = requirePermission("view_media_uploads");
