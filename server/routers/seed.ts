import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { projects, budgetLines, sessions, documents, surveys, trainingModules, sessionTypes } from "../../drizzle/schema";

export const seedRouter = router({
  /**
   * Seed the database with sample data
   */
  seedDatabase: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Failed to connect to database");
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Create sample projects
      const projectData = [
        {
          name: "Positive ID I AM Brent",
          code: "PID-BRENT",
          description: "Identity and confidence building program for young people in Brent",
          status: "active" as const,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          totalBudget: "50000.00",
        },
        {
          name: "Positive ID Westminster",
          code: "PID-WEST",
          description: "Westminster borough identity development program",
          status: "active" as const,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          totalBudget: "45000.00",
        },
        {
          name: "Social Media Preneur",
          code: "SMP-2026",
          description: "Social media entrepreneurship training for young people",
          status: "active" as const,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-06-30"),
          totalBudget: "30000.00",
        },
        {
          name: "Mind Like A Pro",
          code: "MLAP-2026",
          description: "Mental health and wellbeing program",
          status: "active" as const,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          totalBudget: "40000.00",
        },
        {
          name: "Tree of Life Hackney",
          code: "TOL-HACK",
          description: "Creative storytelling and identity exploration program",
          status: "active" as const,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          totalBudget: "35000.00",
        },
      ];

      const insertedProjects = await db.insert(projects).values(projectData).$returningId();

      // 2. Create budget lines for each project
      const budgetLineData = [];
      for (const project of insertedProjects) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Workshop Delivery",
            allocatedAmount: "20000.00",
            spentAmount: "5000.00",
          },
          {
            projectId: project.id,
            name: "Mentoring Sessions",
            allocatedAmount: "10000.00",
            spentAmount: "2000.00",
          },
          {
            projectId: project.id,
            name: "Transport & Travel",
            allocatedAmount: "3000.00",
            spentAmount: "500.00",
          }
        );
      }
      await db.insert(budgetLines).values(budgetLineData);

      // 3. Create session types
      const sessionTypeData = [
        {
          name: "Team Meeting",
          description: "Internal team coordination meeting",
          defaultDuration: 60,
          payRate: "18.00",
          payRateType: "hourly" as const,
        },
        {
          name: "Workshop Delivery - Lead",
          description: "Lead facilitator for workshop delivery",
          defaultDuration: 120,
          payRate: "60.00",
          payRateType: "per_session" as const,
        },
        {
          name: "Workshop Delivery - Support",
          description: "Support facilitator for workshop delivery",
          defaultDuration: 120,
          payRate: "40.00",
          payRateType: "per_session" as const,
        },
      ];
      await db.insert(sessionTypes).values(sessionTypeData);

      // 4. Create sample sessions for this week
      const sessionData = [
        {
          projectId: insertedProjects[0].id,
          title: "Positive ID Workshop - Session 1",
          description: "Introduction to identity and self-confidence",
          startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
          venue: "Brent Youth Centre, 123 High Road, Brent, NW10 2XY",
          status: "scheduled" as const,
          sessionNumber: 1,
          totalSessions: 6,
          paymentPerFacilitator: "60.00",
        },
        {
          projectId: insertedProjects[0].id,
          title: "Positive ID Workshop - Session 2",
          description: "Exploring values and beliefs",
          startTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
          venue: "Brent Youth Centre, 123 High Road, Brent, NW10 2XY",
          status: "scheduled" as const,
          sessionNumber: 2,
          totalSessions: 6,
          paymentPerFacilitator: "60.00",
        },
        {
          projectId: insertedProjects[2].id,
          title: "Social Media Preneur - Content Creation",
          description: "Learn to create engaging social media content",
          startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
          venue: "Westminster Community Hub, 45 Victoria Street, London, SW1E 5NE",
          status: "scheduled" as const,
          sessionNumber: 3,
          totalSessions: 8,
          paymentPerFacilitator: "60.00",
        },
      ];
      await db.insert(sessions).values(sessionData);

      // 5. Create sample documents
      const documentData = [
        {
          projectId: insertedProjects[0].id,
          title: "Positive ID - Session Register Template",
          description: "Attendance register for workshop sessions",
          fileUrl: "https://example.com/documents/register-template.pdf",
          type: "register" as const,
          uploadedBy: 1,
        },
        {
          projectId: insertedProjects[0].id,
          title: "Positive ID - Evaluation Form",
          description: "Post-session evaluation form for participants",
          fileUrl: "https://example.com/documents/evaluation-form.pdf",
          type: "evaluation_form" as const,
          uploadedBy: 1,
        },
        {
          projectId: insertedProjects[2].id,
          title: "Social Media Preneur - Course Materials",
          description: "Complete course materials and worksheets",
          fileUrl: "https://example.com/documents/smp-materials.pdf",
          type: "resource" as const,
          uploadedBy: 1,
        },
      ];
      await db.insert(documents).values(documentData);

      // 6. Create training modules
      const trainingData = [
        {
          title: "Safeguarding Essentials",
          description: "Essential safeguarding training for all team members",
          content: "This module covers key safeguarding principles, recognizing signs of abuse, reporting procedures, and maintaining professional boundaries with young people.",
          category: "safeguarding" as const,
          duration: 120,
          isRequired: true,
          createdBy: 1,
        },
        {
          title: "Facilitation Skills",
          description: "Learn effective workshop facilitation techniques",
          content: "Develop your skills in engaging groups, managing challenging behavior, and creating inclusive learning environments.",
          category: "skills" as const,
          duration: 90,
          isRequired: false,
          createdBy: 1,
        },
        {
          title: "Mental Health First Aid",
          description: "Recognize and respond to mental health challenges",
          content: "Learn to identify signs of mental health issues in young people and provide appropriate initial support.",
          category: "wellbeing" as const,
          duration: 180,
          isRequired: true,
          createdBy: 1,
        },
      ];
      await db.insert(trainingModules).values(trainingData);

      return {
        success: true,
        message: "Database seeded successfully!",
        summary: {
          projects: insertedProjects.length,
          budgetLines: budgetLineData.length,
          sessions: sessionData.length,
          documents: documentData.length,
          trainingModules: trainingData.length,
        },
      };
    } catch (error: any) {
      console.error("Error seeding database:", error);
      throw new Error(`Failed to seed database: ${error.message}`);
    }
  }),
});
