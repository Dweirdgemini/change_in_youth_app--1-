import { getDb } from "./db";
import { 
  projects, 
  budgetLines, 
  sessions, 
  documents, 
  surveys, 
  surveyQuestions,
  trainingModules,
  sessionTypes
} from "../drizzle/schema";

/**
 * Seed the database with sample data for testing
 */
export async function seedDatabase() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }

  console.log("🌱 Starting database seed...");

  try {
    // 1. Create sample projects
    console.log("Creating projects...");
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
      // New projects from budget Excel file
      {
        name: "It's My Business",
        code: "IMB-2025",
        description: "Business skills and entrepreneurship program",
        status: "active" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalBudget: "15000.00",
      },
      {
        name: "Do It Now Now",
        code: "DINN-2025",
        description: "Positive ID delivery program",
        status: "active" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalBudget: "14800.00",
      },
      {
        name: "Community Chest Fund",
        code: "CC-2025",
        description: "Community-led project funding initiative",
        status: "active" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalBudget: "19400.00",
      },
      {
        name: "SNG #iwill Fund 2.0",
        code: "SNG-2025",
        description: "Youth-led wellbeing and social action program",
        status: "active" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalBudget: "10000.00",
      },
    ];

    const insertedProjects = await db.insert(projects).values(projectData).$returningId();
    console.log(`✅ Created ${insertedProjects.length} projects`);

    // 2. Create budget lines for each project
    console.log("Creating budget lines...");
    const budgetLineData = [];
    for (let i = 0; i < insertedProjects.length; i++) {
      const project = insertedProjects[i];
      
      // It's My Business (IMB) - project index 5
      if (i === 5) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Management Fee",
            category: "management_fee" as const,
            allocatedAmount: "1500.00",
            spentAmount: "504.00",
          },
          {
            projectId: project.id,
            name: "Facilitator Fee",
            category: "delivery" as const,
            allocatedAmount: "6300.00",
            spentAmount: "1125.00",
          },
          {
            projectId: project.id,
            name: "Project Coordinator",
            category: "coordinator" as const,
            allocatedAmount: "3600.00",
            spentAmount: "2000.00",
          },
          {
            projectId: project.id,
            name: "Hoodies",
            category: "contingency" as const,
            allocatedAmount: "480.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Goodie Bags",
            category: "contingency" as const,
            allocatedAmount: "720.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Contingency",
            category: "contingency" as const,
            allocatedAmount: "1200.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Evaluation Report",
            category: "evaluation_report" as const,
            allocatedAmount: "1200.00",
            spentAmount: "0.00",
          }
        );
      }
      // Do It Now Now (DINN) - project index 6
      else if (i === 6) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Management Fee",
            category: "management_fee" as const,
            allocatedAmount: "1500.00",
            spentAmount: "1512.00",
          },
          {
            projectId: project.id,
            name: "Positive ID Delivery",
            category: "delivery" as const,
            allocatedAmount: "6300.00",
            spentAmount: "1125.00",
          },
          {
            projectId: project.id,
            name: "Project Coordinator (PM Support)",
            category: "coordinator" as const,
            allocatedAmount: "3600.00",
            spentAmount: "2000.00",
          },
          {
            projectId: project.id,
            name: "Hoodies",
            category: "contingency" as const,
            allocatedAmount: "480.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Positive ID Goodie Bags",
            category: "contingency" as const,
            allocatedAmount: "720.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Contingency",
            category: "contingency" as const,
            allocatedAmount: "1000.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Evaluation Report",
            category: "evaluation_report" as const,
            allocatedAmount: "1200.00",
            spentAmount: "0.00",
          }
        );
      }
      // Community Chest Fund (CC) - project index 7
      else if (i === 7) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Management Fee 10%",
            category: "management_fee" as const,
            allocatedAmount: "2000.00",
            spentAmount: "504.00",
          },
          {
            projectId: project.id,
            name: "Coordinator Fee (Delivery/Media)",
            category: "coordinator" as const,
            allocatedAmount: "4200.00",
            spentAmount: "100.00",
          },
          {
            projectId: project.id,
            name: "Facilitator Fee",
            category: "delivery" as const,
            allocatedAmount: "8000.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Venue Hire",
            category: "venue_hire" as const,
            allocatedAmount: "4000.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Monitoring & Evaluation",
            category: "evaluation_report" as const,
            allocatedAmount: "1200.00",
            spentAmount: "0.00",
          }
        );
      }
      // SNG #iwill Fund 2.0 - project index 8
      else if (i === 8) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Staff costs (Delivery)",
            category: "delivery" as const,
            allocatedAmount: "3000.00",
            spentAmount: "799.00",
          },
          {
            projectId: project.id,
            name: "Training for staff and Wellbeing Champions",
            category: "delivery" as const,
            allocatedAmount: "1500.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Venue Hire",
            category: "venue_hire" as const,
            allocatedAmount: "1500.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Wellbeing Champions Resource Pack",
            category: "contingency" as const,
            allocatedAmount: "1000.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Marketing / Social media",
            category: "contingency" as const,
            allocatedAmount: "500.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Refreshments",
            category: "contingency" as const,
            allocatedAmount: "500.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Youth-led social action project delivery",
            category: "contingency" as const,
            allocatedAmount: "1000.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "10% Project management",
            category: "management_fee" as const,
            allocatedAmount: "1000.00",
            spentAmount: "504.00",
          }
        );
      }
      // Social Media Preneur - project index 2
      else if (i === 2) {
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Coordinator Fee (Delivery/Media)",
            category: "coordinator" as const,
            description: "£105 per day for 40 days",
            allocatedAmount: "4200.00",
            spentAmount: "2449.00",
          },
          {
            projectId: project.id,
            name: "Facilitator Fee",
            category: "delivery" as const,
            description: "£250 per day × 32 workshops",
            allocatedAmount: "8000.00",
            spentAmount: "5200.00",
          },
          {
            projectId: project.id,
            name: "Venue Hire",
            category: "venue_hire" as const,
            description: "£125 per day × 32 workshops",
            allocatedAmount: "4000.00",
            spentAmount: "1440.00",
          },
          {
            projectId: project.id,
            name: "Monitoring & Evaluation",
            category: "evaluation_report" as const,
            description: "Report measurements and write up",
            allocatedAmount: "1200.00",
            spentAmount: "0.00",
          },
          {
            projectId: project.id,
            name: "Contingency (Food, Media and other Expenses)",
            category: "contingency" as const,
            description: "Demirra, Cindy",
            allocatedAmount: "600.00",
            spentAmount: "555.00",
          },
          {
            projectId: project.id,
            name: "Management Fee 10%",
            category: "management_fee" as const,
            description: "10% management fee covering office and financial management costs",
            allocatedAmount: "2000.00",
            spentAmount: "1512.00",
          }
        );
      } else {
        // Generic budget lines for other projects
        budgetLineData.push(
          {
            projectId: project.id,
            name: "Workshop Delivery",
            category: "delivery" as const,
            allocatedAmount: "20000.00",
            spentAmount: "5000.00",
          },
          {
            projectId: project.id,
            name: "Mentoring Sessions",
            category: "delivery" as const,
            allocatedAmount: "10000.00",
            spentAmount: "2000.00",
          },
          {
            projectId: project.id,
            name: "Transport & Travel",
            category: "contingency" as const,
            allocatedAmount: "3000.00",
            spentAmount: "500.00",
          },
          {
            projectId: project.id,
            name: "Equipment & Materials",
            category: "contingency" as const,
            allocatedAmount: "5000.00",
            spentAmount: "1000.00",
          }
        );
      }
    }
    await db.insert(budgetLines).values(budgetLineData);
    console.log(`✅ Created ${budgetLineData.length} budget lines`);

    // 3. Create session types
    console.log("Creating session types...");
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
      {
        name: "Mentoring Session",
        description: "One-on-one mentoring with participant",
        defaultDuration: 60,
        payRate: "25.00",
        payRateType: "per_session" as const,
      },
    ];
    await db.insert(sessionTypes).values(sessionTypeData);
    console.log(`✅ Created ${sessionTypeData.length} session types`);

    // 4. Create sample sessions for this week
    console.log("Creating sessions...");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const sessionData = [
      {
        projectId: insertedProjects[0].id,
        title: "Positive ID Workshop - Session 1",
        description: "Introduction to identity and self-confidence",
        startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 2 days from now, 10am
        endTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 2 days from now, 12pm
        venue: "Brent Youth Centre, 123 High Road, Brent, NW10 2XY",
        status: "scheduled" as const,
        maxParticipants: 20,
        sessionNumber: 1,
        totalSessions: 6,
        paymentPerFacilitator: "60.00",
      },
      {
        projectId: insertedProjects[0].id,
        title: "Positive ID Workshop - Session 2",
        description: "Exploring values and beliefs",
        startTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 4 days from now, 10am
        endTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 4 days from now, 12pm
        venue: "Brent Youth Centre, 123 High Road, Brent, NW10 2XY",
        status: "scheduled" as const,
        maxParticipants: 20,
        sessionNumber: 2,
        totalSessions: 6,
        paymentPerFacilitator: "60.00",
      },
      {
        projectId: insertedProjects[2].id,
        title: "Social Media Preneur - Content Creation",
        description: "Learn to create engaging social media content",
        startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 3 days from now, 2pm
        endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 3 days from now, 4pm
        venue: "Westminster Community Hub, 45 Victoria Street, London, SW1E 5NE",
        status: "scheduled" as const,
        maxParticipants: 15,
        sessionNumber: 3,
        totalSessions: 8,
        paymentPerFacilitator: "60.00",
      },
      {
        projectId: insertedProjects[3].id,
        title: "Mind Like A Pro - Mindfulness Session",
        description: "Introduction to mindfulness and stress management",
        startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 5 days from now, 11am
        endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 5 days from now, 1pm
        venue: "Hackney Youth Space, 78 Mare Street, Hackney, E8 4RG",
        status: "scheduled" as const,
        maxParticipants: 12,
        sessionNumber: 1,
        totalSessions: 4,
        paymentPerFacilitator: "60.00",
      },
      {
        projectId: insertedProjects[4].id,
        title: "Tree of Life - Creative Storytelling",
        description: "Using art and storytelling to explore identity",
        startTime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 6 days from now, 10am
        endTime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 6 days from now, 12pm
        venue: "Hackney Youth Space, 78 Mare Street, Hackney, E8 4RG",
        status: "scheduled" as const,
        maxParticipants: 18,
        sessionNumber: 2,
        totalSessions: 5,
        paymentPerFacilitator: "60.00",
      },
    ];
    await db.insert(sessions).values(sessionData);
    console.log(`✅ Created ${sessionData.length} sessions`);

    // 5. Create sample documents
    console.log("Creating documents...");
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
        projectId: insertedProjects[0].id,
        title: "Parental Consent Form",
        description: "Consent form for participants under 18",
        fileUrl: "https://example.com/documents/consent-form.pdf",
        type: "consent_form" as const,
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
      {
        projectId: insertedProjects[3].id,
        title: "Mind Like A Pro - Facilitator Guide",
        description: "Comprehensive facilitator guide for mental health sessions",
        fileUrl: "https://example.com/documents/mlap-guide.pdf",
        type: "resource" as const,
        uploadedBy: 1,
      },
    ];
    await db.insert(documents).values(documentData);
    console.log(`✅ Created ${documentData.length} documents`);

    // 6. Create sample surveys
    console.log("Creating surveys...");
    const surveyData = [
      {
        title: "Post-Workshop Feedback",
        description: "Please share your thoughts about today's workshop",
        createdBy: 1,
        status: "active" as const,
        projectId: insertedProjects[0].id,
      },
      {
        title: "Program Impact Survey",
        description: "Help us understand the impact of our programs",
        createdBy: 1,
        status: "active" as const,
        projectId: insertedProjects[0].id,
      },
      {
        title: "Facilitator Feedback",
        description: "Share your experience as a facilitator",
        createdBy: 1,
        status: "active" as const,
      },
    ];
    const insertedSurveys = await db.insert(surveys).values(surveyData).$returningId();
    console.log(`✅ Created ${insertedSurveys.length} surveys`);

    // 7. Create survey questions
    console.log("Creating survey questions...");
    const questionData = [
      {
        surveyId: insertedSurveys[0].id,
        question: "How would you rate today's workshop?",
        type: "rating" as const,
        required: true,
        orderIndex: 1,
      },
      {
        surveyId: insertedSurveys[0].id,
        question: "What did you enjoy most about the session?",
        type: "text" as const,
        required: true,
        orderIndex: 2,
      },
      {
        surveyId: insertedSurveys[0].id,
        question: "What could be improved?",
        type: "text" as const,
        required: false,
        orderIndex: 3,
      },
      {
        surveyId: insertedSurveys[1].id,
        question: "Has this program helped build your confidence?",
        type: "multiple_choice" as const,
        options: JSON.stringify(["Yes, significantly", "Yes, somewhat", "Not really", "No"]),
        required: true,
        orderIndex: 1,
      },
      {
        surveyId: insertedSurveys[1].id,
        question: "Would you recommend this program to a friend?",
        type: "multiple_choice" as const,
        options: JSON.stringify(["Definitely", "Probably", "Maybe", "No"]),
        required: true,
        orderIndex: 2,
      },
    ];
    await db.insert(surveyQuestions).values(questionData);
    console.log(`✅ Created ${questionData.length} survey questions`);

    // 8. Create training modules
    console.log("Creating training modules...");
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
      {
        title: "Diversity and Inclusion",
        description: "Creating inclusive spaces for all young people",
        content: "Understand different forms of discrimination and learn practical strategies for creating truly inclusive programs.",
        category: "compliance" as const,
        duration: 60,
        isRequired: true,
        createdBy: 1,
      },
      {
        title: "Positive ID Program Overview",
        description: "Introduction to the Positive ID program methodology",
        content: "Learn about the Positive ID framework, session structure, and key learning outcomes.",
        category: "program" as const,
        duration: 45,
        isRequired: false,
        createdBy: 1,
      },
    ];
    await db.insert(trainingModules).values(trainingData);
    console.log(`✅ Created ${trainingData.length} training modules`);

    // 9. Notifications (skipped - table needs to be created in schema)
    console.log("Skipping notifications (table not found in schema)...");

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${insertedProjects.length} projects`);
    console.log(`   - ${budgetLineData.length} budget lines`);
    console.log(`   - ${sessionData.length} sessions`);
    console.log(`   - ${documentData.length} documents`);
    console.log(`   - ${insertedSurveys.length} surveys with ${questionData.length} questions`);
    console.log(`   - ${trainingData.length} training modules`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
