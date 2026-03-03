/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines permissions for each user role in the system.
 */

export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "finance" 
  | "safeguarding" 
  | "team_member" 
  | "student"
  | "social_media_manager";

export type Permission =
  // Financial permissions
  | "view_financials"
  | "manage_financials"
  | "approve_invoices"
  | "export_financial_reports"
  
  // Project permissions
  | "view_projects"
  | "manage_projects"
  | "view_project_budget"
  | "manage_project_budget"
  
  // Team & Chat permissions
  | "view_team_chats"
  | "manage_team_chats"
  | "view_all_chats"
  
  // User management
  | "manage_users"
  | "view_all_users"
  
  // Task permissions
  | "view_tasks"
  | "manage_tasks"
  | "assign_tasks"
  
  // Social media permissions
  | "view_media_uploads"
  | "manage_social_media"
  | "post_to_social_media"
  
  // Session & scheduling
  | "view_sessions"
  | "manage_sessions"
  
  // Documents & materials
  | "view_documents"
  | "manage_documents"
  
  // Admin features
  | "access_admin_panel"
  | "manage_permissions";

/**
 * Role permission matrix
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // Super admin has ALL permissions
    "view_financials",
    "manage_financials",
    "approve_invoices",
    "export_financial_reports",
    "view_projects",
    "manage_projects",
    "view_project_budget",
    "manage_project_budget",
    "view_team_chats",
    "manage_team_chats",
    "view_all_chats",
    "manage_users",
    "view_all_users",
    "view_tasks",
    "manage_tasks",
    "assign_tasks",
    "view_media_uploads",
    "manage_social_media",
    "post_to_social_media",
    "view_sessions",
    "manage_sessions",
    "view_documents",
    "manage_documents",
    "access_admin_panel",
    "manage_permissions",
  ],
  
  admin: [
    // Admin: Projects, team chats, team management (NO financials)
    "view_projects",
    "manage_projects",
    "view_project_budget", // Can see budget but not manage
    "view_team_chats",
    "manage_team_chats",
    "view_all_chats",
    "manage_users",
    "view_all_users",
    "view_tasks",
    "manage_tasks",
    "assign_tasks",
    "view_media_uploads",
    "manage_social_media",
    "view_sessions",
    "manage_sessions",
    "view_documents",
    "manage_documents",
    "access_admin_panel",
  ],
  
  finance: [
    // Finance: Financials ONLY (NO projects, NO chats)
    "view_financials",
    "manage_financials",
    "approve_invoices",
    "export_financial_reports",
  ],
  
  social_media_manager: [
    // Social media: View all media uploads, post to social media
    "view_media_uploads",
    "manage_social_media",
    "post_to_social_media",
    "view_team_chats", // Can see chats where media was uploaded
  ],
  
  safeguarding: [
    // Safeguarding: View all users, sessions, documents
    "view_all_users",
    "view_sessions",
    "view_documents",
    "manage_documents",
    "view_projects",
    "view_team_chats",
  ],
  
  team_member: [
    // Team member: Basic access to assigned projects and tasks
    "view_projects",
    "view_team_chats",
    "view_tasks",
    "view_sessions",
    "view_documents",
  ],
  
  student: [
    // Student: Minimal access
    "view_sessions",
    "view_documents",
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if user can access financials
 */
export function canAccessFinancials(role: UserRole): boolean {
  return hasPermission(role, "view_financials");
}

/**
 * Check if user can access projects
 */
export function canAccessProjects(role: UserRole): boolean {
  return hasPermission(role, "view_projects");
}

/**
 * Check if user can access team chats
 */
export function canAccessTeamChats(role: UserRole): boolean {
  return hasPermission(role, "view_team_chats");
}

/**
 * Check if user can access social media features
 */
export function canAccessSocialMedia(role: UserRole): boolean {
  return hasPermission(role, "view_media_uploads");
}
