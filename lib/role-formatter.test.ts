import { describe, it, expect } from "vitest";
import { getRoleLabel, getRoleColor, getRoleIcon } from "./role-formatter";

describe("Role Formatter", () => {
  describe("getRoleLabel", () => {
    it("should convert team_member to Team Member", () => {
      expect(getRoleLabel("team_member")).toBe("Team Member");
    });

    it("should convert admin to Administrator", () => {
      expect(getRoleLabel("admin")).toBe("Administrator");
    });

    it("should convert finance to Finance Officer", () => {
      expect(getRoleLabel("finance")).toBe("Finance Officer");
    });

    it("should convert safeguarding to Safeguarding Lead", () => {
      expect(getRoleLabel("safeguarding")).toBe("Safeguarding Lead");
    });

    it("should convert student to Student", () => {
      expect(getRoleLabel("student")).toBe("Student");
    });

    it("should handle null/undefined by returning Team Member", () => {
      expect(getRoleLabel(null)).toBe("Team Member");
      expect(getRoleLabel(undefined)).toBe("Team Member");
    });

    it("should handle case-insensitive role names", () => {
      expect(getRoleLabel("ADMIN")).toBe("Administrator");
      expect(getRoleLabel("Team_Member")).toBe("Team Member");
    });

    it("should capitalize unknown roles", () => {
      expect(getRoleLabel("custom_role")).toBe("Custom_role");
    });
  });

  describe("getRoleColor", () => {
    it("should return error color for admin", () => {
      expect(getRoleColor("admin")).toBe("bg-error text-background");
    });

    it("should return warning color for finance", () => {
      expect(getRoleColor("finance")).toBe("bg-warning text-background");
    });

    it("should return success color for safeguarding", () => {
      expect(getRoleColor("safeguarding")).toBe("bg-success text-background");
    });

    it("should return primary color for team_member", () => {
      expect(getRoleColor("team_member")).toBe("bg-primary text-background");
    });

    it("should return muted color for student", () => {
      expect(getRoleColor("student")).toBe("bg-muted text-foreground");
    });

    it("should return primary color for unknown roles", () => {
      expect(getRoleColor(null)).toBe("bg-primary text-background");
      expect(getRoleColor("unknown")).toBe("bg-primary text-background");
    });
  });

  describe("getRoleIcon", () => {
    it("should return shield.fill for admin", () => {
      expect(getRoleIcon("admin")).toBe("shield.fill");
    });

    it("should return creditcard.fill for finance", () => {
      expect(getRoleIcon("finance")).toBe("creditcard.fill");
    });

    it("should return heart.fill for safeguarding", () => {
      expect(getRoleIcon("safeguarding")).toBe("heart.fill");
    });

    it("should return person.fill for team_member", () => {
      expect(getRoleIcon("team_member")).toBe("person.fill");
    });

    it("should return book.fill for student", () => {
      expect(getRoleIcon("student")).toBe("book.fill");
    });

    it("should return person.fill for unknown roles", () => {
      expect(getRoleIcon(null)).toBe("person.fill");
      expect(getRoleIcon("unknown")).toBe("person.fill");
    });
  });
});
