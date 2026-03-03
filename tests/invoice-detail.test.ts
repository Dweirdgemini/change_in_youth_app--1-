import { describe, it, expect } from "vitest";
import { financeRouter } from "../server/routers/finance";
import { getDb } from "../server/db";
import { invoices } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Invoice Detail Page", () => {
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

  it("should fetch invoice by ID for the owner", async () => {
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

    const caller = financeRouter.createCaller(mockContext);
    
    const invoice = await caller.getInvoiceById({ invoiceId: userInvoice.id });
    
    expect(invoice).toBeDefined();
    expect(invoice.id).toBe(userInvoice.id);
    expect(invoice.userId).toBe(mockContext.user.id);
    expect(invoice).toHaveProperty("totalAmount");
    expect(invoice).toHaveProperty("status");
    expect(invoice).toHaveProperty("invoiceNumber");
    expect(invoice).toHaveProperty("projectName");
  });

  it("should include all required fields in invoice detail", async () => {
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

    const caller = financeRouter.createCaller(mockContext);
    const invoice = await caller.getInvoiceById({ invoiceId: userInvoice.id });
    
    // Check all fields that the UI expects
    expect(invoice).toHaveProperty("id");
    expect(invoice).toHaveProperty("userId");
    expect(invoice).toHaveProperty("projectId");
    expect(invoice).toHaveProperty("invoiceNumber");
    expect(invoice).toHaveProperty("totalAmount");
    expect(invoice).toHaveProperty("paidAmount");
    expect(invoice).toHaveProperty("description");
    expect(invoice).toHaveProperty("budgetLineCategory");
    expect(invoice).toHaveProperty("status");
    expect(invoice).toHaveProperty("submittedAt");
    expect(invoice).toHaveProperty("invoiceCode");
    expect(invoice).toHaveProperty("projectName");
  });

  it("should throw error when invoice does not exist", async () => {
    const caller = financeRouter.createCaller(mockContext);
    
    await expect(
      caller.getInvoiceById({ invoiceId: 999999 })
    ).rejects.toThrow("Invoice not found");
  });
});
