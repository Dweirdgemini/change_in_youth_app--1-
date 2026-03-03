import { getDb } from "../server/db";
import { budgetLines, projects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function addCompanyReserves() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  // Check if company reserves project exists
  const existingProject = await db
    .select()
    .from(projects)
    .where(eq(projects.name, "Company Reserves"))
    .limit(1);

  let projectId: number;

  if (existingProject.length === 0) {
    // Create company reserves project
    const result = await db.insert(projects).values({
      name: "Company Reserves",
      code: "RESERVES",
      description: "Company reserves for payments not tied to specific projects",
      totalBudget: "50000.00",
      spentBudget: "0.00",
      status: "active",
      startDate: new Date(),
    });
    projectId = Number(result[0].insertId);
    console.log("Created Company Reserves project with ID:", projectId);
  } else {
    projectId = existingProject[0].id;
    console.log("Company Reserves project already exists with ID:", projectId);
  }

  // Check if company reserves budget line exists
  const existingBudgetLine = await db
    .select()
    .from(budgetLines)
    .where(eq(budgetLines.name, "Company Reserves"))
    .limit(1);

  if (existingBudgetLine.length === 0) {
    // Create company reserves budget line
    await db.insert(budgetLines).values({
      projectId,
      name: "Company Reserves",
      category: "contingency",
      description: "General company reserves for miscellaneous expenses",
      allocatedAmount: "50000.00", // £50,000 initial allocation
      spentAmount: "0.00",
    });
    console.log("Created Company Reserves budget line");
  } else {
    console.log("Company Reserves budget line already exists");
  }

  console.log("Company reserves setup complete!");
  process.exit(0);
}

addCompanyReserves().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
