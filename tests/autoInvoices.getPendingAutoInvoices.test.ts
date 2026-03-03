import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/routers';

describe('autoInvoices.getPendingAutoInvoices', () => {
  it('should be registered in the router', () => {
    // @ts-ignore - accessing internal router structure for testing
    const procedures = appRouter._def.procedures;
    
    // Check that autoInvoices router exists
    expect(procedures).toHaveProperty('autoInvoices');
    
    // The procedure should be accessible via the nested path
    const autoInvoicesRouter = procedures.autoInvoices;
    expect(autoInvoicesRouter).toBeDefined();
  });

  it('should return 401 for unauthenticated requests', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      // @ts-ignore
      caller.autoInvoices.getPendingAutoInvoices()
    ).rejects.toThrow();
  });

  it('should return 403 for non-finance/admin users', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 999,
        openId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        role: 'team_member', // Not finance or admin
        organizationId: 1,
        profileImageUrl: '',
        loginMethod: 'test',
        canPostJobs: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        pushToken: null,
        notificationPreferences: null,
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      // @ts-ignore
      caller.autoInvoices.getPendingAutoInvoices()
    ).rejects.toThrow('Only finance/admin can view pending invoices');
  });

  it('should return test data for finance users', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: 'finance-user',
        email: 'finance@example.com',
        name: 'Finance User',
        role: 'finance',
        organizationId: 1,
        profileImageUrl: '',
        loginMethod: 'test',
        canPostJobs: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        pushToken: null,
        notificationPreferences: null,
      },
      req: {} as any,
      res: {} as any,
    });

    // @ts-ignore
    const result = await caller.autoInvoices.getPendingAutoInvoices();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('invoiceCode');
    expect(result[0]).toHaveProperty('amount');
  });
});
