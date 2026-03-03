/**
 * CSV Template Generator for Historical Invoice Imports
 * 
 * Provides downloadable CSV template with correct column headers and example data
 */

export const CSV_TEMPLATE_HEADERS = [
  "team_member_email",
  "project_name",
  "amount",
  "invoice_number",
  "invoice_date",
  "approved_date",
  "paid_date"
];

export const CSV_TEMPLATE_EXAMPLE_ROWS = [
  ["john.doe@example.com", "Youth Workshops", "150.00", "INV-001", "2024-01-15", "2024-01-20", "2024-01-25"],
  ["jane.smith@example.com", "SNB Detached Outreach", "200.00", "INV-002", "2024-01-16", "2024-01-21", ""],
  ["mike.jones@example.com", "Youth Workshops", "175.50", "INV-003", "2024-01-17", "", ""],
];

/**
 * Generate CSV template content
 */
export function generateCSVTemplate(): string {
  const rows = [
    CSV_TEMPLATE_HEADERS.join(","),
    ...CSV_TEMPLATE_EXAMPLE_ROWS.map(row => row.join(","))
  ];
  return rows.join("\n");
}

/**
 * Download CSV template (web only)
 */
export function downloadCSVTemplate() {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", "invoice_import_template.csv");
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Share CSV template (mobile)
 */
export async function shareCSVTemplate() {
  const csvContent = generateCSVTemplate();
  
  // For React Native, we'll need to use expo-sharing
  // This is a placeholder for the implementation
  try {
    // TODO: Implement with expo-sharing when needed
    console.log("CSV Template:", csvContent);
    return csvContent;
  } catch (error) {
    console.error("Error sharing CSV template:", error);
    throw error;
  }
}
