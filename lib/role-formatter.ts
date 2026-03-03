/**
 * Convert database role values to user-friendly display labels
 */
export function getRoleLabel(role: string | undefined | null): string {
  const roleMap: Record<string, string> = {
    admin: "Administrator",
    finance: "Finance Officer",
    safeguarding: "Safeguarding Lead",
    team_member: "Team Member",
    student: "Student",
  };

  return roleMap[role?.toLowerCase() || ""] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "Team Member");
}

/**
 * Get a color for the role badge
 */
export function getRoleColor(role: string | undefined | null): string {
  const colorMap: Record<string, string> = {
    admin: "bg-error text-background",
    finance: "bg-warning text-background",
    safeguarding: "bg-success text-background",
    team_member: "bg-primary text-background",
    student: "bg-muted text-foreground",
  };

  return colorMap[role?.toLowerCase() || ""] || "bg-primary text-background";
}

/**
 * Get an icon name for the role
 */
export function getRoleIcon(role: string | undefined | null): string {
  const iconMap: Record<string, string> = {
    admin: "shield.fill",
    finance: "creditcard.fill",
    safeguarding: "heart.fill",
    team_member: "person.fill",
    student: "book.fill",
  };

  return iconMap[role?.toLowerCase() || ""] || "person.fill";
}
