import { ENV } from "./env";

export type EmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send email using configured email service
 * Supports SendGrid, AWS SES, or console logging for development
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;

  // In development or if no email service configured, log to console
  if (!ENV.emailService || ENV.emailService === "console") {
    console.log("=== EMAIL (Development Mode) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    console.log(`Text: ${text || "N/A"}`);
    console.log("================================");
    return true;
  }

  // SendGrid implementation
  if (ENV.emailService === "sendgrid" && ENV.sendgridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: ENV.emailFrom || "noreply@changeindelivery.org" },
          subject,
          content: [
            { type: "text/html", value: html },
            ...(text ? [{ type: "text/plain", value: text }] : []),
          ],
        }),
      });

      if (!response.ok) {
        console.error("SendGrid error:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to send email via SendGrid:", error);
      return false;
    }
  }

  // AWS SES implementation
  if (ENV.emailService === "ses" && ENV.awsAccessKeyId && ENV.awsSecretAccessKey) {
    // AWS SES would require AWS SDK integration
    console.warn("AWS SES not yet implemented, falling back to console logging");
    console.log(`Email to ${to}: ${subject}`);
    return true;
  }

  console.warn("No email service configured, email not sent");
  return false;
}

/**
 * Generate DBS expiry reminder email HTML
 */
export function generateDbsReminderEmail(params: {
  recipientName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  certificateNumber: string;
}): { subject: string; html: string; text: string } {
  const { recipientName, daysUntilExpiry, expiryDate, certificateNumber } = params;

  const urgency =
    daysUntilExpiry <= 7 ? "URGENT" : daysUntilExpiry <= 30 ? "Important" : "Reminder";

  const subject = `${urgency}: DBS Certificate Expiring in ${daysUntilExpiry} Days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0a7ea4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .alert { background-color: ${daysUntilExpiry <= 7 ? "#fee2e2" : daysUntilExpiry <= 30 ? "#fef3c7" : "#dbeafe"}; 
             border-left: 4px solid ${daysUntilExpiry <= 7 ? "#ef4444" : daysUntilExpiry <= 30 ? "#f59e0b" : "#3b82f6"}; 
             padding: 15px; margin: 20px 0; border-radius: 4px; }
    .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background-color: #0a7ea4; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DBS Certificate Expiry Notice</h1>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      
      <div class="alert">
        <strong>${urgency}:</strong> Your DBS certificate will expire in <strong>${daysUntilExpiry} days</strong>.
      </div>

      <p>This is ${daysUntilExpiry <= 7 ? "an urgent" : "a"} reminder that your DBS (Disclosure and Barring Service) certificate is approaching its expiry date.</p>

      <div class="details">
        <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
        <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p><strong>Days Remaining:</strong> ${daysUntilExpiry} days</p>
      </div>

      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Apply for a new DBS check immediately</li>
        <li>Allow 4-6 weeks for processing</li>
        <li>Upload your new certificate to the system once received</li>
        <li>Contact the admin team if you need assistance</li>
      </ul>

      ${
        daysUntilExpiry <= 7
          ? '<p style="color: #ef4444;"><strong>IMPORTANT:</strong> Your certificate expires very soon. You may not be able to work with young people after the expiry date until a new certificate is obtained.</p>'
          : ""
      }

      <p>If you have already renewed your DBS certificate, please upload it to the system as soon as possible.</p>

      <p>Thank you for your cooperation in maintaining our safeguarding standards.</p>

      <p>Best regards,<br>Change In Delivery Team</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder from the Change In Delivery team management system.</p>
      <p>If you have questions, please contact your administrator.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
DBS Certificate Expiry Notice

Dear ${recipientName},

${urgency}: Your DBS certificate will expire in ${daysUntilExpiry} days.

Certificate Number: ${certificateNumber}
Expiry Date: ${new Date(expiryDate).toLocaleDateString("en-GB")}
Days Remaining: ${daysUntilExpiry} days

Action Required:
- Apply for a new DBS check immediately
- Allow 4-6 weeks for processing
- Upload your new certificate to the system once received
- Contact the admin team if you need assistance

${daysUntilExpiry <= 7 ? "IMPORTANT: Your certificate expires very soon. You may not be able to work with young people after the expiry date until a new certificate is obtained." : ""}

If you have already renewed your DBS certificate, please upload it to the system as soon as possible.

Thank you for your cooperation in maintaining our safeguarding standards.

Best regards,
Change In Delivery Team
  `;

  return { subject, html, text };
}
