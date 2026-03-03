/**
 * Budget line category display names
 * Maps database enum values to user-friendly display names
 */

export type BudgetCategory =
  | "management_fee"
  | "coordinator"
  | "delivery"
  | "evaluation_report"
  | "equipment_materials"
  | "venue_hire"
  | "contingency";

export const BUDGET_CATEGORY_DISPLAY_NAMES: Record<BudgetCategory, string> = {
  management_fee: "Management Fee",
  coordinator: "Coordinator",
  delivery: "Delivery",
  evaluation_report: "Evaluation Report",
  equipment_materials: "Equipment and Materials",
  venue_hire: "Venue Hire",
  contingency: "Contingency",
};

export function getBudgetCategoryDisplayName(category: BudgetCategory): string {
  return BUDGET_CATEGORY_DISPLAY_NAMES[category] || category;
}

export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: "management_fee", label: "Management Fee" },
  { value: "coordinator", label: "Coordinator" },
  { value: "delivery", label: "Delivery" },
  { value: "evaluation_report", label: "Evaluation Report" },
  { value: "equipment_materials", label: "Equipment and Materials" },
  { value: "venue_hire", label: "Venue Hire" },
  { value: "contingency", label: "Contingency" },
];
