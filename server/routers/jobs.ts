import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { jobPostings, jobApplications, jobViews, jobClicks, appAnalytics, users } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";

export const jobsRouter = router({
  // Get all active job postings (public)
  getActiveJobs: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Use raw SQL to avoid Drizzle schema mismatch issues
    const client = (db as any).$client;
    const [rows]: any = await client.promise().query(
      `SELECT * FROM job_postings WHERE status = ? ORDER BY created_at DESC`,
      ["active"]
    );

    return rows;
  }),

  // Get job by ID and increment view count
  getJobById: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const job = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.jobId))
        .limit(1);

      if (!job[0]) throw new Error("Job not found");

      // Increment view count
      await db
        .update(jobPostings)
        .set({ viewCount: sql`${jobPostings.viewCount} + 1` })
        .where(eq(jobPostings.id, input.jobId));

      // Track analytics
      if (db) {
        await db.insert(appAnalytics).values({
          eventType: "job_view",
          eventName: "job_viewed",
          userId: ctx.user?.id || null,
          metadata: JSON.stringify({ jobId: input.jobId, jobTitle: job[0].title }),
          platform: "web",
        });
      }

      return job[0];
    }),

  // Create job posting (admin only)
  createJob: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        jobType: z.string().optional(),
        salary: z.string().optional(),
        requirements: z.string().optional(),
        responsibilities: z.string().optional(),
        closingDate: z.string().optional(),
        // WhatsApp format fields
        applicationLink: z.string().optional(),
        tags: z.string().optional(),
        applicationDeadline: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is admin or has canPostJobs permission
      // For now, allow all authenticated users to post jobs (can be restricted later)
      const canPost = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "team_member";
      
      if (!canPost) {
        throw new Error("You don't have permission to create job postings");
      }

      // Support both traditional format and WhatsApp format
      const description = input.description || `${input.title}\n\nLocation: ${input.location || 'Not specified'}\n\nApply: ${input.applicationLink || 'Contact us'}`;
      const expiresAt = input.applicationDeadline || input.closingDate;

      // Use minimal raw SQL insert - only required columns
      const client = (db as any).$client;
      
      // Insert only the 3 required columns that definitely exist
      // Use promise() to get promise-based API
      const [result]: any = await client.promise().query(
        `INSERT INTO job_postings (title, description, posted_by) VALUES (?, ?, ?)`,
        [input.title, description, ctx.user.id]
      );

      // result is ResultSetHeader with insertId property
      return { success: true, jobId: Number(result.insertId) };
    }),

  // Update job posting
  updateJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        jobType: z.string().optional(),
        salary: z.string().optional(),
        requirements: z.string().optional(),
        responsibilities: z.string().optional(),
        status: z.enum(["active", "closed", "draft"]).optional(),
        closingDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can update job postings");
      }

      const updates: any = {};
      if (input.title) updates.title = input.title;
      if (input.description) updates.description = input.description;
      if (input.location !== undefined) updates.location = input.location;
      if (input.jobType !== undefined) updates.jobType = input.jobType;
      if (input.salary !== undefined) updates.salary = input.salary;
      if (input.requirements !== undefined) updates.requirements = input.requirements;
      if (input.responsibilities !== undefined) updates.responsibilities = input.responsibilities;
      if (input.status) updates.status = input.status;
      if (input.closingDate) updates.closingDate = new Date(input.closingDate);

      await db
        .update(jobPostings)
        .set(updates)
        .where(eq(jobPostings.id, input.jobId));

      return { success: true };
    }),

  // Submit job application
  applyForJob: publicProcedure
    .input(
      z.object({
        jobId: z.number(),
        applicantName: z.string(),
        applicantEmail: z.string().email(),
        applicantPhone: z.string().optional(),
        coverLetter: z.string().optional(),
        resumeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(jobApplications).values({
        jobId: input.jobId,
        userId: ctx.user?.id || null,
        applicantName: input.applicantName,
        applicantEmail: input.applicantEmail,
        applicantPhone: input.applicantPhone || null,
        coverLetter: input.coverLetter || null,
        resumeUrl: input.resumeUrl || null,
        status: "submitted",
      });

      // Increment application count
      await db
        .update(jobPostings)
        .set({ applicationCount: sql`${jobPostings.applicationCount} + 1` })
        .where(eq(jobPostings.id, input.jobId));

      // Track analytics
      await db.insert(appAnalytics).values({
        eventType: "job_application",
        eventName: "job_applied",
        userId: ctx.user?.id || null,
        metadata: JSON.stringify({ jobId: input.jobId, applicantEmail: input.applicantEmail }),
        platform: "web",
      });

      return { success: true, applicationId: Number(result[0].insertId) };
    }),

  // Get applications for a job (admin only)
  getJobApplications: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can view job applications");
      }

      const applications = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.jobId, input.jobId))
        .orderBy(desc(jobApplications.appliedAt));

      return applications;
    }),

  // Review application
  reviewApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        status: z.enum(["reviewed", "shortlisted", "rejected", "hired"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can review applications");
      }

      await db
        .update(jobApplications)
        .set({
          status: input.status,
          notes: input.notes || null,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(jobApplications.id, input.applicationId));

      return { success: true };
    }),

  // Track job view
  trackJobView: publicProcedure
    .input(
      z.object({
        jobId: z.number(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userType = ctx.user ? "team_member" : "public";

      await db.insert(jobViews).values({
        jobId: input.jobId,
        userId: ctx.user?.id || null,
        userType,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      });

      // Increment view count
      await db
        .update(jobPostings)
        .set({ viewCount: sql`${jobPostings.viewCount} + 1` })
        .where(eq(jobPostings.id, input.jobId));

      return { success: true };
    }),

  // Track job click (apply button, external link, etc.)
  trackJobClick: publicProcedure
    .input(
      z.object({
        jobId: z.number(),
        clickType: z.enum(["apply_button", "external_link", "email"]),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userType = ctx.user ? "team_member" : "public";

      await db.insert(jobClicks).values({
        jobId: input.jobId,
        userId: ctx.user?.id || null,
        userType,
        clickType: input.clickType,
        ipAddress: input.ipAddress || null,
      });

      // Increment click count
      await db
        .update(jobPostings)
        .set({ clickCount: sql`${jobPostings.clickCount} + 1` })
        .where(eq(jobPostings.id, input.jobId));

      return { success: true };
    }),

  // Get all jobs (admin only) - includes active, closed, expired
  getAllJobs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view all jobs");
    }

    const jobs = await db
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.createdAt));

    return jobs;
  }),

  // Get job analytics by ID (admin only)
  getJobAnalytics: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can view job analytics");
      }

      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.jobId))
        .limit(1);

      if (!job) throw new Error("Job not found");

      // Get view breakdown
      const views = await db
        .select({
          userType: jobViews.userType,
          count: count(),
        })
        .from(jobViews)
        .where(eq(jobViews.jobId, input.jobId))
        .groupBy(jobViews.userType);

      // Get click breakdown
      const clicks = await db
        .select({
          clickType: jobClicks.clickType,
          userType: jobClicks.userType,
          count: count(),
        })
        .from(jobClicks)
        .where(eq(jobClicks.jobId, input.jobId))
        .groupBy(jobClicks.clickType, jobClicks.userType);

      // Get applications
      const applications = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.jobId, input.jobId))
        .orderBy(desc(jobApplications.appliedAt));

      const publicViews = views.find((v) => v.userType === "public")?.count || 0;
      const teamViews = views.find((v) => v.userType === "team_member")?.count || 0;

      return {
        job,
        totalViews: job.viewCount || 0,
        publicViews,
        teamViews,
        totalClicks: job.clickCount || 0,
        clicks,
        totalApplications: job.applicationCount || 0,
        applications,
      };
    }),

  // Get job engagement metrics (admin only)
  getJobMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view job metrics");
    }

    const jobs = await db.select().from(jobPostings);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === "active").length;
    const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);
    const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);

    const topJobs = jobs
      .sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0))
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        title: j.title,
        views: j.viewCount || 0,
        applications: j.applicationCount || 0,
      }));

    // Get QR code scan metrics (source field removed from schema)
    // TODO: Re-implement QR code tracking if needed by adding source field to jobViews schema
    const qrScansResult = await db.select({ count: count() }).from(jobViews);
    const qrClicksResult = await db.select({ count: count() }).from(jobClicks);
    
    const qrScans = 0; // Placeholder until source field is added
    const qrClicks = qrClicksResult[0]?.count || 0;

    return {
      totalJobs,
      activeJobs,
      totalViews,
      totalApplications,
      averageApplicationsPerJob: totalJobs > 0 ? totalApplications / totalJobs : 0,
      qrScans,
      qrClicks,
      topJobs,
    };
  }),
});
