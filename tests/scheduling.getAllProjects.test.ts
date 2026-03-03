import { describe, it, expect } from "vitest";
import { appRouter } from "../server/routers";

describe("scheduling.getAllProjects", () => {
  it("should return list of projects", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-admin",
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin",
        organizationId: 1,
        profileImageUrl: "",
        loginMethod: "test",
        canPostJobs: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        pushToken: null,
        notificationPreferences: null,
      },
    });

    const projects = await (caller.scheduling as any).getAllProjects();
    
    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
    console.log(`[Test] Found ${projects.length} projects`);
    
    if (projects.length > 0) {
      const firstProject = projects[0];
      expect(firstProject).toHaveProperty("id");
      expect(firstProject).toHaveProperty("name");
      console.log(`[Test] Sample project: ${firstProject.name}`);
    }
  });
});
