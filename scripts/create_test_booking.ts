import { getDb } from "../server/db";
import {
  projects,
  budgetLines,
  users,
  sessions,
  sessionFacilitators,
  documents,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function createTestBooking() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("Creating test booking scenario...\n");

  // 1. Create or get Positive ID project
  let positiveIdProject = await db
    .select()
    .from(projects)
    .where(eq(projects.name, "Positive ID"))
    .limit(1);

  let projectId: number;

  if (positiveIdProject.length === 0) {
    const result = await db.insert(projects).values({
      name: "Positive ID",
      code: "POS-ID",
      description: "Positive ID youth empowerment workshops",
      totalBudget: "5000.00",
      spentBudget: "0.00",
      status: "active",
      startDate: new Date("2026-01-01"),
    });
    projectId = Number(result[0].insertId);
    console.log(`✓ Created Positive ID project (ID: ${projectId})`);
  } else {
    projectId = positiveIdProject[0].id;
    console.log(`✓ Using existing Positive ID project (ID: ${projectId})`);
  }

  // 2. Create or get budget line for Positive ID
  let budgetLine = await db
    .select()
    .from(budgetLines)
    .where(eq(budgetLines.name, "Positive ID - Facilitator Fees"))
    .limit(1);

  if (budgetLine.length === 0) {
    await db.insert(budgetLines).values({
      projectId,
      name: "Positive ID - Facilitator Fees",
      category: "delivery",
      description: "Budget for facilitator payments",
      allocatedAmount: "2000.00",
      spentAmount: "0.00",
    });
    console.log("✓ Created budget line for Positive ID");
  } else {
    console.log("✓ Using existing budget line");
  }

  // 3. Create or get facilitators (Charmel and Cindy)
  const facilitators = [
    { name: "Charmel", email: "charmel@changeinyouth.org" },
    { name: "Cindy", email: "cindy@changeinyouth.org" },
  ];

  const facilitatorIds: number[] = [];

  for (const fac of facilitators) {
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, fac.email))
      .limit(1);

    if (existingUser.length === 0) {
      const result = await db.insert(users).values({
        email: fac.email,
        name: fac.name,
        role: "team_member",
        loginMethod: "oauth",
        openId: `test-${fac.email}`,
      });
      facilitatorIds.push(Number(result[0].insertId));
      console.log(`✓ Created facilitator: ${fac.name}`);
    } else {
      facilitatorIds.push(existingUser[0].id);
      console.log(`✓ Using existing facilitator: ${fac.name}`);
    }
  }

  // 4. Create session for Monday, January 13th, 2026, 10-11am
  const sessionDate = new Date("2026-01-13T10:00:00Z");
  const sessionEndDate = new Date("2026-01-13T11:00:00Z");

  const sessionResult = await db.insert(sessions).values({
    projectId,
    title: "Positive ID Workshop - Test Run School",
    description: "Youth empowerment workshop focusing on positive identity development",
    venue: "Test Run School, Main Hall",
    startTime: sessionDate,
    endTime: sessionEndDate,
    status: "scheduled",
  });

  const sessionId = Number(sessionResult[0].insertId);
  console.log(`✓ Created session (ID: ${sessionId}) for Monday, January 13th, 2026, 10-11am`);

  // 5. Assign facilitators to session
  for (const facId of facilitatorIds) {
    await db.insert(sessionFacilitators).values({
      sessionId,
      userId: facId,
      // Payment amount will be tracked in video_call_attendance table
    });
  }
  console.log("✓ Assigned Charmel and Cindy as facilitators (£40 each)");

  // 6. Create booking letter
  const bookingLetterContent = {
    schoolName: "Test Run School",
    contactName: "Head Teacher",
    contactEmail: "headteacher@testrunschool.edu",
    contactPhone: "020 1234 5678",
    sessionDetails: {
      title: "Positive ID Workshop",
      venue: "Test Run School, Main Hall",
      date: "Monday, 13th January 2026",
      time: "10:00 AM - 11:00 AM",
      facilitators: "Charmel and Cindy",
      sessionFee: "£40 per facilitator (£80 total)",
    },
    additionalNotes: "Please ensure the hall is set up with chairs in a circle. We will need access to a projector and screen.",
  };

  await db.insert(documents).values({
    sessionId,
    projectId,
    title: "Booking Letter - Test Run School",
    description: JSON.stringify(bookingLetterContent),
    type: "other",
    fileUrl: "/booking-letters/test-run-school-jan-2026.pdf",
    uploadedBy: facilitatorIds[0],
  });
  console.log("✓ Created booking letter");

  // 7. Create workshop materials
  const materials = [
    {
      title: "Positive ID - Participant Register",
      description: "Attendance register for workshop participants",
      type: "register" as const,
      fileUrl: "/materials/positive-id/register-template.pdf",
    },
    {
      title: "Positive ID - Evaluation Form",
      description: "Post-workshop evaluation form for participants",
      type: "evaluation_form" as const,
      fileUrl: "/materials/positive-id/evaluation-form.pdf",
    },
    {
      title: "Positive ID - Invoice Template",
      description: "Invoice template for facilitator payments",
      type: "other" as const,
      fileUrl: "/materials/positive-id/invoice-template.pdf",
    },
  ];

  for (const material of materials) {
    await db.insert(documents).values({
      projectId,
      title: material.title,
      description: material.description,
      type: material.type,
      fileUrl: material.fileUrl,
      uploadedBy: facilitatorIds[0],
    });
  }
  console.log("✓ Created workshop materials (register, evaluation form, invoice template)");

  console.log("\n✅ Test booking scenario created successfully!");
  console.log("\nSummary:");
  console.log("- Project: Positive ID");
  console.log("- Session: Monday, 13th January 2026, 10:00-11:00 AM");
  console.log("- Venue: Test Run School, Main Hall");
  console.log("- Facilitators: Charmel and Cindy (£40 each)");
  console.log("- Documents: Booking letter + 3 workshop materials");
  console.log("\nYou can now view this in the app!");

  process.exit(0);
}

createTestBooking().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
