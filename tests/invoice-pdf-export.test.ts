import { describe, it, expect } from "vitest";
import { autoInvoicesRouter } from "../server/routers/autoInvoices";
import { getDb } from "../server/db";
import { invoices } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Invoice PDF Export", () => {
  const mockContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      role: "team_member" as const,
      organizationId: 1,
      profileImageUrl: "",
      loginMethod: "oauth",
      canPostJobs: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
        pushToken: null,
        notificationPreferences: null,
    },
    req: {} as any,
    res: {} as any,
  };

  it("should export invoice as PDF with base64 encoding", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get an invoice owned by user ID 1
    const [userInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, mockContext.user.id))
      .limit(1);

    if (!userInvoice) {
      console.log("No invoices found for user - skipping test");
      return;
    }

    const caller = autoInvoicesRouter.createCaller(mockContext);
    
    const result = await caller.exportInvoicePDF({ invoiceId: userInvoice.id });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.pdf).toBeDefined();
    expect(result.filename).toBeDefined();
    expect(result.filename).toMatch(/\.pdf$/);
    
    // Verify PDF is base64 encoded
    expect(typeof result.pdf).toBe("string");
    expect(result.pdf.length).toBeGreaterThan(0);
    
    // Verify it's valid base64 (should not throw)
    const buffer = Buffer.from(result.pdf, "base64");
    expect(buffer.length).toBeGreaterThan(0);
    
    // PDF files start with %PDF
    const pdfHeader = buffer.toString("utf8", 0, 4);
    expect(pdfHeader).toBe("%PDF");
  });

  it("should include invoice number in filename", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [userInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, mockContext.user.id))
      .limit(1);

    if (!userInvoice) {
      console.log("No invoices found for user - skipping test");
      return;
    }

    const caller = autoInvoicesRouter.createCaller(mockContext);
    const result = await caller.exportInvoicePDF({ invoiceId: userInvoice.id });
    
    expect(result.filename).toContain("Invoice_");
    expect(result.filename).toMatch(/Invoice_.*\.pdf$/);
  });

  it("should throw error when exporting non-existent invoice", async () => {
    const caller = autoInvoicesRouter.createCaller(mockContext);
    
    await expect(
      caller.exportInvoicePDF({ invoiceId: 999999 })
    ).rejects.toThrow("Invoice not found");
  });
});
