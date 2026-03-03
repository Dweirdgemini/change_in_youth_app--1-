import { TRPCError } from "@trpc/server";

// Define permission levels for each rank
export const RANK_PERMISSIONS = {
  probationary: {
    canViewFinancials: false,
    canApproveMeetings: false,
    canAccessSensitiveData: false,
    canExportData: false,
    canManageTeam: false,
  },
  standard: {
    canViewFinancials: false,
    canApproveMeetings: false,
    canAccessSensitiveData: false,
    canExportData: true,
    canManageTeam: false,
  },
  high_performer: {
    canViewFinancials: true,
    canApproveMeetings: false,
    canAccessSensitiveData: true,
    canExportData: true,
    canManageTeam: false,
  },
  trusted: {
    canViewFinancials: true,
    canApproveMeetings: true,
    canAccessSensitiveData: true,
    canExportData: true,
    canManageTeam: true,
  },
} as const;

export type RankType = keyof typeof RANK_PERMISSIONS;
export type PermissionKey = keyof typeof RANK_PERMISSIONS.probationary;

/**
 * Check if a user's rank has a specific permission
 */
export function hasPermission(
  ranking: string | null | undefined,
  permission: PermissionKey
): boolean {
  const rank = (ranking || "standard") as RankType;
  const permissions = RANK_PERMISSIONS[rank] || RANK_PERMISSIONS.standard;
  return permissions[permission];
}

/**
 * Middleware to check rank-based permissions
 * Throws TRPCError if user doesn't have required permission
 */
export function requirePermission(
  ranking: string | null | undefined,
  permission: PermissionKey,
  errorMessage?: string
): void {
  if (!hasPermission(ranking, permission)) {
    const rank = (ranking || "standard") as RankType;
    const rankLabel = rank.replace("_", " ").toUpperCase();
    
    throw new TRPCError({
      code: "FORBIDDEN",
      message: errorMessage || 
        `This action requires higher permissions. Your current rank (${rankLabel}) does not allow this operation.`,
    });
  }
}

/**
 * Get minimum required rank for a permission
 */
export function getMinimumRankForPermission(permission: PermissionKey): RankType {
  const ranks: RankType[] = ["probationary", "standard", "high_performer", "trusted"];
  
  for (const rank of ranks) {
    if (RANK_PERMISSIONS[rank][permission]) {
      return rank;
    }
  }
  
  return "trusted"; // Default to highest rank if not found
}

/**
 * Get all permissions for a rank
 */
export function getRankPermissions(ranking: string | null | undefined) {
  const rank = (ranking || "standard") as RankType;
  return RANK_PERMISSIONS[rank] || RANK_PERMISSIONS.standard;
}
