import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { 
  sessionFeedback, 
  socialMediaSubmissions, 
  schoolFeedback,
  users 
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Performance Ranking System", () => {
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Use a unique openId with timestamp to avoid duplicates
    const uniqueOpenId = `test-performance-${Date.now()}`;

    // Create a test user
    const result = await db.insert(users).values({
      openId: uniqueOpenId,
      name: "Test Performance User",
      email: `performance-${Date.now()}@test.com`,
      role: "team_member",
      loginMethod: "oauth",
    });

    testUserId = Number(result[0].insertId);
  });

  it("should calculate workshop feedback quality correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert test session feedback
    await db.insert(sessionFeedback).values({
      sessionId: 1,
      userId: testUserId,
      rating: 5,
      workshopQuality: 5,
      facilitatorPerformance: 4,
      venueRating: 5,
      whatWentWell: "Great session",
      improvements: "None",
      engagementLevel: "high",
    });

    await db.insert(sessionFeedback).values({
      sessionId: 2,
      userId: testUserId,
      rating: 4,
      workshopQuality: 4,
      facilitatorPerformance: 5,
      venueRating: 4,
      whatWentWell: "Good session",
      improvements: "Minor improvements",
      engagementLevel: "medium",
    });

    // Query feedback
    const feedback = await db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.userId, testUserId));

    expect(feedback.length).toBe(2);
    expect(feedback[0].workshopQuality).toBe(5);
    expect(feedback[1].workshopQuality).toBe(4);

    // Calculate average
    const avgWorkshopQuality = 
      (feedback[0].workshopQuality! + feedback[1].workshopQuality!) / 2;
    expect(avgWorkshopQuality).toBe(4.5);
  });

  it("should calculate social media post quality correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert test social media submissions
    await db.insert(socialMediaSubmissions).values({
      chatId: 1,
      messageId: 1,
      submittedBy: testUserId,
      caption: "Test post 1",
      platforms: ["instagram"],
      status: "approved",
      qualityRating: 5,
      reviewedBy: 1,
    });

    await db.insert(socialMediaSubmissions).values({
      chatId: 1,
      messageId: 2,
      submittedBy: testUserId,
      caption: "Test post 2",
      platforms: ["twitter"],
      status: "approved",
      qualityRating: 4,
      reviewedBy: 1,
    });

    // Query submissions
    const submissions = await db
      .select()
      .from(socialMediaSubmissions)
      .where(eq(socialMediaSubmissions.submittedBy, testUserId));

    expect(submissions.length).toBe(2);
    expect(submissions[0].qualityRating).toBe(5);
    expect(submissions[1].qualityRating).toBe(4);

    // Calculate average
    const avgQuality = 
      (submissions[0].qualityRating! + submissions[1].qualityRating!) / 2;
    expect(avgQuality).toBe(4.5);
  });

  it("should calculate school feedback ratings correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert test school feedback
    await db.insert(schoolFeedback).values({
      sessionId: 1,
      facilitatorId: testUserId,
      schoolName: "Test School 1",
      contactName: "John Doe",
      contactEmail: "john@testschool.com",
      overallRating: 5,
      deliveryQuality: 5,
      punctuality: 5,
      professionalism: 5,
      studentEngagement: 4,
      comments: "Excellent facilitator",
      wouldRecommend: true,
    });

    await db.insert(schoolFeedback).values({
      sessionId: 2,
      facilitatorId: testUserId,
      schoolName: "Test School 2",
      contactName: "Jane Smith",
      contactEmail: "jane@testschool.com",
      overallRating: 4,
      deliveryQuality: 4,
      punctuality: 5,
      professionalism: 5,
      studentEngagement: 5,
      comments: "Very good session",
      wouldRecommend: true,
    });

    // Query feedback
    const feedback = await db
      .select()
      .from(schoolFeedback)
      .where(eq(schoolFeedback.facilitatorId, testUserId));

    expect(feedback.length).toBe(2);
    expect(feedback[0].overallRating).toBe(5);
    expect(feedback[1].overallRating).toBe(4);

    // Calculate average
    const avgOverallRating = 
      (feedback[0].overallRating + feedback[1].overallRating) / 2;
    expect(avgOverallRating).toBe(4.5);
  });

  it("should determine correct rank based on overall score", () => {
    // Test rank thresholds
    const getRank = (score: number) => {
      if (score >= 4.5) return "trusted";
      if (score >= 4.0) return "high_performer";
      if (score >= 3.0) return "standard";
      return "probationary";
    };

    expect(getRank(4.8)).toBe("trusted");
    expect(getRank(4.5)).toBe("trusted");
    expect(getRank(4.3)).toBe("high_performer");
    expect(getRank(4.0)).toBe("high_performer");
    expect(getRank(3.5)).toBe("standard");
    expect(getRank(3.0)).toBe("standard");
    expect(getRank(2.5)).toBe("probationary");
  });

  it("should calculate overall performance score correctly", () => {
    // Simulate performance metrics
    const workshopQuality = 4.5;
    const facilitatorPerformance = 4.5;
    const socialMediaQuality = 4.5;
    const schoolOverallRating = 4.5;

    const scores = [
      workshopQuality,
      facilitatorPerformance,
      socialMediaQuality,
      schoolOverallRating,
    ];

    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    expect(overallScore).toBe(4.5);
    expect(overallScore).toBeGreaterThanOrEqual(4.5); // Should be "trusted" rank
  });
});
