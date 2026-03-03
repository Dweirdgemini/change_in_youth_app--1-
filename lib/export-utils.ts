/**
 * Export utilities for generating PDF and Excel reports
 * 
 * Note: This implementation uses server-side generation for compatibility
 * with React Native. The actual file generation happens on the backend.
 */

import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export interface BudgetExportData {
  projectName: string;
  projectCode: string;
  dateRange: string;
  budgetLines: Array<{
    category: string;
    totalBudget: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
}

/**
 * Generate and download budget report as Excel file
 */
export async function exportBudgetToExcel(data: BudgetExportData): Promise<void> {
  try {
    // In a real implementation, this would call the backend API
    // to generate the Excel file and return a download URL
    
    // For now, we'll create a simple CSV format that can be opened in Excel
    const csv = generateCSV(data);
    
    const fileUri = FileSystem.documentDirectory + `budget_report_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Budget Report",
        UTI: "public.comma-separated-values-text",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Failed to export budget to Excel:", error);
    throw error;
  }
}

/**
 * Generate and download budget report as PDF
 */
export async function exportBudgetToPDF(data: BudgetExportData): Promise<void> {
  try {
    // In a real implementation, this would call the backend API endpoint
    // that generates a properly formatted PDF with branding
    
    // For now, we'll use the CSV approach as a placeholder
    const csv = generateCSV(data);
    
    const fileUri = FileSystem.documentDirectory + `budget_report_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/plain",
        dialogTitle: "Export Budget Report",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Failed to export budget to PDF:", error);
    throw error;
  }
}

/**
 * Generate CSV content from budget data
 */
function generateCSV(data: BudgetExportData): string {
  const lines: string[] = [];
  
  // Header
  lines.push("Change In Youth CIC - Budget Report");
  lines.push("");
  lines.push(`Project: ${data.projectName} (${data.projectCode})`);
  lines.push(`Date Range: ${data.dateRange}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  
  // Budget Lines
  lines.push("Category,Total Budget,Spent,Remaining,Utilization %");
  data.budgetLines.forEach((line) => {
    lines.push(
      `${line.category},£${line.totalBudget.toFixed(2)},£${line.spent.toFixed(2)},£${line.remaining.toFixed(2)},${line.percentage.toFixed(1)}%`
    );
  });
  
  lines.push("");
  
  // Totals
  lines.push(`TOTAL,£${data.totalBudget.toFixed(2)},£${data.totalSpent.toFixed(2)},£${data.totalRemaining.toFixed(2)},${((data.totalSpent / data.totalBudget) * 100).toFixed(1)}%`);
  
  return lines.join("\n");
}

/**
 * Export feedback analytics to Excel
 */
export async function exportFeedbackToExcel(
  projectName: string,
  feedbackData: any[]
): Promise<void> {
  try {
    const csv = generateFeedbackCSV(projectName, feedbackData);
    
    const fileUri = FileSystem.documentDirectory + `feedback_report_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Feedback Report",
        UTI: "public.comma-separated-values-text",
      });
    }
  } catch (error) {
    console.error("Failed to export feedback to Excel:", error);
    throw error;
  }
}

/**
 * Generate CSV content from feedback data
 */
function generateFeedbackCSV(projectName: string, feedbackData: any[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push("Change In Youth CIC - Feedback Report");
  lines.push("");
  lines.push(`Project: ${projectName}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  
  // Feedback Data
  lines.push("Session ID,Date,Session Quality,Facilitator Performance,Venue Rating,Engagement,What Worked Well,What Could Improve,Additional Comments");
  
  feedbackData.forEach((feedback) => {
    const row = [
      feedback.sessionId,
      new Date(feedback.submittedAt).toLocaleDateString(),
      feedback.sessionQuality,
      feedback.facilitatorPerformance,
      feedback.venueRating || "N/A",
      feedback.participantEngagement || "N/A",
      `"${(feedback.whatWorkedWell || "").replace(/"/g, '""')}"`,
      `"${(feedback.whatCouldImprove || "").replace(/"/g, '""')}"`,
      `"${(feedback.additionalComments || "").replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(","));
  });
  
  return lines.join("\n");
}
