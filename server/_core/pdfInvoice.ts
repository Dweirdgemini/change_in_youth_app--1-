import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface InvoiceActivity {
  sessionTitle: string;
  projectName: string;
  date: string;
  hours: string;
  payment: string;
}

export interface InvoiceData {
  invoiceNumber: number;
  invoiceCode: string;
  userName: string;
  userEmail: string;
  projectName: string;
  submittedDate: string;
  totalHours: string;
  totalAmount: string;
  activities: InvoiceActivity[];
}

/**
 * Generate a professional PDF invoice
 * Returns a buffer that can be sent as a file download
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Change In Youth CIC", 50, 50);
      
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Team Management & Financial Platform", 50, 80);

      // Invoice Title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("INVOICE", 400, 50);

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`#${data.invoiceNumber}`, 400, 75)
        .text(data.invoiceCode, 400, 90);

      // Divider line
      doc
        .moveTo(50, 120)
        .lineTo(550, 120)
        .stroke();

      // Team Member Info (Invoice Sender)
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("FROM:", 50, 140);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(data.userName, 50, 160)
        .text(data.userEmail, 50, 175);
      
      // Organization Info (Invoice Recipient)
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TO:", 50, 200);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Change In Youth", 50, 220)
        .text("finance@changeinyouth.org.uk", 50, 235)
        .text("167-179 Great Portland Street", 50, 250)
        .text("London, W1W 5PF", 50, 265);
      
      // Project Info
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Project: ${data.projectName}`, 50, 285);

      // Invoice Details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INVOICE DETAILS:", 350, 140);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Date: ${data.submittedDate}`, 350, 160)
        .text(`Total Hours: ${data.totalHours}`, 350, 175)
        .text(`Status: Pending Approval`, 350, 190);

      // Activities Table Header
      const tableTop = 310;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Activity", 50, tableTop)
        .text("Date", 250, tableTop)
        .text("Hours", 350, tableTop)
        .text("Amount", 450, tableTop);

      // Table line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Activities
      let yPosition = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      for (const activity of data.activities) {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .text(activity.sessionTitle, 50, yPosition, { width: 180 })
          .text(activity.date, 250, yPosition)
          .text(activity.hours, 350, yPosition)
          .text(`£${activity.payment}`, 450, yPosition);

        yPosition += 30;
      }

      // Total line
      doc
        .moveTo(350, yPosition + 10)
        .lineTo(550, yPosition + 10)
        .stroke();

      // Total
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TOTAL:", 350, yPosition + 20)
        .text(`£${data.totalAmount}`, 450, yPosition + 20);

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This invoice is auto-generated and requires finance approval before payment.",
          50,
          750,
          { align: "center", width: 500 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
