import {
  boolean,
  date,
  datetime,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ========================================
// ORGANIZATIONS (MULTI-TENANCY)
// ========================================

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#0a7ea4"), // Hex color for branding
  
  // Subscription & Billing
  subscriptionTier: mysqlEnum("subscription_tier", ["trial", "starter", "professional", "enterprise", "custom"]).default("trial").notNull(),
  subscriptionStatus: mysqlEnum("subscription_status", ["trial", "active", "past_due", "suspended", "cancelled"]).default("trial").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  billingEmail: varchar("billing_email", { length: 320 }).notNull(),
  
  // Limits & Quotas
  maxUsers: int("max_users").default(10).notNull(),
  
  // Contact Info
  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  
  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingStep: int("onboarding_step").default(0), // Track wizard progress
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Feature flags per organization
export const organizationFeatures = mysqlTable("organization_features", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  featureSlug: varchar("feature_slug", { length: 100 }).notNull(), // e.g., "consent_forms", "dbs_tracking"
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========================================
// USERS & AUTHENTICATION
// ========================================

// Create index for magic link token lookups
export const magicLinkTokenIndex = "idx_magic_link_token";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull().default(1), // Multi-tenant: which org this user belongs to
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  profileImageUrl: varchar("profileImageUrl", { length: 500 }),
  role: mysqlEnum("role", ["super_admin", "admin", "finance", "safeguarding", "team_member", "student", "social_media_manager"]).default("student").notNull(),
  loginMethod: varchar("loginMethod", { length: 50 }).notNull(),
  canPostJobs: boolean("canPostJobs").default(false).notNull(),
  pushToken: varchar("pushToken", { length: 255 }),
  notificationPreferences: json("notificationPreferences"),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Magic Link Authentication Fields
  magicLinkToken: varchar("magicLinkToken", { length: 255 }),
  magicLinkExpiry: timestamp("magicLinkExpiry"),
  // Account Deletion
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// PROJECTS & BUDGET MANAGEMENT
// ========================================

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull().default(1), // Multi-tenant: which org owns this project
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  totalBudget: decimal("totalBudget", { precision: 10, scale: 2 }).notNull(),
  spentBudget: decimal("spentBudget", { precision: 10, scale: 2 }).default("0.00").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["active", "completed", "archived", "on_hold"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const budgetLines = mysqlTable("budget_lines", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "management_fee",
    "coordinator",
    "delivery",
    "evaluation_report",
    "equipment_materials",
    "venue_hire",
    "contingency"
  ]).notNull(),
  description: text("description"),
  allocatedAmount: decimal("allocatedAmount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal("spentAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// SCHEDULING & SESSIONS
// ========================================

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull().default(1), // Multi-tenant: which org owns this session
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  venue: varchar("venue", { length: 255 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  sessionNumber: int("sessionNumber"),
  totalSessions: int("totalSessions"),
  paymentPerFacilitator: decimal("paymentPerFacilitator", { precision: 10, scale: 2 }),
  isVirtualMeeting: boolean("isVirtualMeeting").default(false).notNull(),
  meetingLink: varchar("meetingLink", { length: 500 }),
  meetingType: mysqlEnum("meetingType", ["zoom", "google_meet", "teams", "other"]),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedBy: int("requestedBy"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  requiredDeliverables: json("requiredDeliverables").$type<string[]>(), // ['register', 'evaluation_form', 'photos', 'videos']
  attendeeCount: int("attendeeCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sessionFacilitators = mysqlTable("session_facilitators", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  clockInTime: timestamp("clockInTime"),
  clockInLatitude: decimal("clockInLatitude", { precision: 10, scale: 8 }),
  clockInLongitude: decimal("clockInLongitude", { precision: 11, scale: 8 }),
  registerCompleted: boolean("registerCompleted").default(false).notNull(),
  evaluationsCompleted: boolean("evaluationsCompleted").default(false).notNull(),
  arrivedOnTime: boolean("arrivedOnTime").default(false).notNull(),
  paymentEligible: boolean("paymentEligible").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// INVOICES & PAYMENTS
// ========================================

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Legacy column
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 500 }),
  budgetLineCategory: mysqlEnum("budgetLineCategory", [
    "coordinator",
    "delivery",
    "venue_hire",
    "evaluation_report",
    "contingency",
    "management_fee"
  ]),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "paid"]).default("draft").notNull(),
  dueDate: timestamp("dueDate"),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  paidAt: timestamp("paidAt"),
  rejectionReason: text("rejectionReason"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: int("rejectedBy"),
  notes: text("notes"),
  adminComments: text("adminComments"),
  aiCategorized: boolean("aiCategorized").default(false).notNull(),
  invoiceCode: varchar("invoice_code", { length: 255 }),
  autoGenerated: boolean("auto_generated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const expectedPayments = mysqlTable("expected_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  budgetLineId: int("budgetLineId"),
  sessionId: int("sessionId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  invoiceSubmitted: boolean("invoiceSubmitted").default(false).notNull(),
  autoGenerated: boolean("autoGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// TASKS & CHECKLISTS
// ========================================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  sessionId: int("sessionId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: int("assignedTo"),
  createdBy: int("createdBy").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const taskChecklist = mysqlTable("task_checklist", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// COMMUNICATIONS
// ========================================

export const chatChannels = mysqlTable("chat_channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["general", "project", "direct", "student_forum"]).default("general").notNull(),
  projectId: int("projectId"),
  isModerated: boolean("isModerated").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  isModerated: boolean("isModerated").default(false).notNull(),
  moderatedBy: int("moderatedBy"),
  moderatedAt: timestamp("moderatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull(),
  projectId: int("projectId"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// DOCUMENTS & COMPLIANCE
// ========================================

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  sessionId: int("sessionId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["consent_form", "evaluation_form", "register", "resource", "other"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const registers = mysqlTable("registers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  present: boolean("present").default(true).notNull(),
  notes: text("notes"),
  completedBy: int("completedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// SURVEYS & FEEDBACK
// ========================================

export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  projectId: int("projectId"),
  sessionId: int("sessionId"),
  createdBy: int("createdBy").notNull(),
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const surveyQuestions = mysqlTable("survey_questions", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  question: text("question").notNull(),
  type: mysqlEnum("type", ["text", "multiple_choice", "rating", "yes_no"]).notNull(),
  options: text("options"),
  required: boolean("required").default(false).notNull(),
  orderIndex: int("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const surveyResponses = mysqlTable("survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  questionId: int("questionId").notNull(),
  userId: int("userId"),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// TRAINING & RESOURCES
// ========================================

export const trainingModules = mysqlTable("training_modules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  category: varchar("category", { length: 50 }).default("general"),
  duration: int("duration").default(30), // duration in minutes
  isRequired: boolean("isRequired").default(false),
  fileUrl: varchar("fileUrl", { length: 500 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trainingProgress = mysqlTable("training_progress", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  moduleId: int("module_id").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});



// ========================================
// ANALYTICS & METRICS
// ========================================

export const staffAvailability = mysqlTable("staff_availability", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamPairings = mysqlTable("team_pairings", {
  id: int("id").autoincrement().primaryKey(),
  facilitator1Id: int("facilitator1Id").notNull(),
  facilitator2Id: int("facilitator2Id").notNull(),
  sessionId: int("sessionId").notNull(),
  projectId: int("projectId").notNull(),
  performanceScore: decimal("performanceScore", { precision: 3, scale: 2 }),
  studentFeedbackScore: decimal("studentFeedbackScore", { precision: 3, scale: 2 }),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// CONNECTEAM-INSPIRED FEATURES
// ========================================

// Pay Rates - Track employee pay rates with effective dates
export const payRates = mysqlTable("pay_rates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  sessionRate: decimal("sessionRate", { precision: 10, scale: 2 }),
  effectiveDate: timestamp("effectiveDate").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Payslips - Store payslip documents for facilitators
export const payslips = mysqlTable("payslips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  payPeriodStart: timestamp("payPeriodStart").notNull(),
  payPeriodEnd: timestamp("payPeriodEnd").notNull(),
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("netAmount", { precision: 10, scale: 2 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Admin Notes - Private notes about users (only visible to admins)
export const adminNotes = mysqlTable("admin_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  note: text("note").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Onboarding Packs - Document collections for new facilitators
export const onboardingPacks = mysqlTable("onboarding_packs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  role: mysqlEnum("role", ["admin", "finance", "team_member", "student"]).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const onboardingPackDocuments = mysqlTable("onboarding_pack_documents", {
  id: int("id").autoincrement().primaryKey(),
  packId: int("packId").notNull(),
  documentId: int("documentId").notNull(),
  orderIndex: int("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User Activity Log - Track all user actions for timeline
export const userActivityLog = mysqlTable("user_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  actionType: varchar("actionType", { length: 100 }).notNull(),
  actionDescription: text("actionDescription").notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  metadata: json("metadata"),
  performedBy: int("performedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Private Messages - Team-to-participant private communication
export const privateMessages = mysqlTable("private_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Session Types - Meeting, Workshop, etc. with pay rates
export const sessionTypes = mysqlTable("session_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  leadFacilitatorRate: decimal("leadFacilitatorRate", { precision: 10, scale: 2 }),
  supportFacilitatorRate: decimal("supportFacilitatorRate", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Invoice Line Items - Detailed breakdown
export const invoiceLineItems = mysqlTable("invoice_line_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  budgetLineId: int("budgetLineId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  sessionId: int("sessionId"),
  expenseId: int("expenseId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Expenses - Receipts and reimbursements
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  budgetLineId: int("budgetLineId").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  expenseDate: timestamp("expenseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Session Content - Photos/videos shared by team
export const sessionContent = mysqlTable("session_content", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  contentType: varchar("contentType", { length: 50 }).notNull(),
  contentUrl: varchar("contentUrl", { length: 500 }).notNull(),
  caption: text("caption"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  publishedAt: timestamp("publishedAt"),
  views: int("views").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Video Call Attendance - Track who joined and duration
export const videoCallAttendance = mysqlTable("video_call_attendance", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").notNull(),
  leftAt: timestamp("leftAt"),
  durationMinutes: int("durationMinutes"),
  calculatedPayment: decimal("calculatedPayment", { precision: 10, scale: 2 }),
  invoiceStatus: mysqlEnum("invoiceStatus", ["unpaid", "invoiced", "paid"]).default("unpaid").notNull(),
  invoiceId: int("invoiceId"),
  invoicedAt: timestamp("invoicedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Funder Reports
export const funderReports = mysqlTable("funder_reports", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  dateFrom: date("dateFrom").notNull(),
  dateTo: date("dateTo").notNull(),
  filters: text("filters"),
  generatedBy: int("generatedBy").notNull(),
  reportData: text("reportData"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Participant Interactions - Journey tracking
export const participantInteractions = mysqlTable("participant_interactions", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  interactionType: varchar("interactionType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  recordedBy: int("recordedBy").notNull(),
  interactionDate: timestamp("interactionDate").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Project Assignments - Team member assignments to projects
export const projectAssignments = mysqlTable("project_assignments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 100 }).default("team_member"),
  assignedBy: int("assignedBy").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

// Program Registrations - Public signup forms
export const programRegistrations = mysqlTable("program_registrations", {
  id: int("id").autoincrement().primaryKey(),
  programName: varchar("programName", { length: 255 }).notNull(),
  participantName: varchar("participantName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  age: int("age"),
  interests: text("interests"),
  additionalInfo: text("additionalInfo"),
  status: varchar("status", { length: 50 }).default("new").notNull(),
  contactedAt: timestamp("contactedAt"),
  contactedBy: int("contactedBy"),
  notes: text("notes"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Parental Consent Forms - Photography and Video Recording
export const consentForms = mysqlTable("consent_forms", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Link to SNG or other projects
  
  // Section 1: Participant Details
  childFullName: varchar("childFullName", { length: 255 }).notNull(),
  childDateOfBirth: date("childDateOfBirth").notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  yearGroup: varchar("yearGroup", { length: 50 }), // e.g., "Year 7", "Year 10"
  parentGuardianFullName: varchar("parentGuardianFullName", { length: 255 }).notNull(),
  parentGuardianContactNumber: varchar("parentGuardianContactNumber", { length: 50 }).notNull(),
  parentGuardianEmail: varchar("parentGuardianEmail", { length: 320 }).notNull(),
  
  // Section 2: Photography and Video Consent
  photographsPermission: boolean("photographsPermission").default(false).notNull(),
  videoPermission: boolean("videoPermission").default(false).notNull(),
  bothPermission: boolean("bothPermission").default(false).notNull(),
  noPermission: boolean("noPermission").default(false).notNull(),
  
  // Section 3: Use of Images and Recordings
  internalUseEvaluation: boolean("internalUseEvaluation").default(false).notNull(),
  internalUseSafeguarding: boolean("internalUseSafeguarding").default(false).notNull(),
  internalUseTraining: boolean("internalUseTraining").default(false).notNull(),
  externalUseSocialMedia: boolean("externalUseSocialMedia").default(false).notNull(),
  externalUseWebsite: boolean("externalUseWebsite").default(false).notNull(),
  externalUsePrintedMaterials: boolean("externalUsePrintedMaterials").default(false).notNull(),
  externalUseFundingReports: boolean("externalUseFundingReports").default(false).notNull(),
  externalUseLocalMedia: boolean("externalUseLocalMedia").default(false).notNull(),
  externalUseEducationalPresentations: boolean("externalUseEducationalPresentations").default(false).notNull(),
  usePermissionType: mysqlEnum("usePermissionType", ["internal_only", "internal_and_external", "internal_and_specific"]),
  specificExternalUses: text("specificExternalUses"), // For custom specifications
  
  // Section 4: Identification and Anonymity
  identificationType: mysqlEnum("identificationType", ["full_identification", "first_name_only", "anonymous", "no_identification"]),
  
  // Section 5: Third-Party Sharing
  thirdPartySharing: boolean("thirdPartySharing").default(false).notNull(),
  
  // Section 6: Data Protection and Privacy
  dataProtectionConfirmed: boolean("dataProtectionConfirmed").default(false).notNull(),
  
  // Section 8: Safeguarding Declaration
  safeguardingConfirmed: boolean("safeguardingConfirmed").default(false).notNull(),
  
  // Section 9: Additional Information
  additionalInformation: text("additionalInformation"),
  
  // Section 10: Consent Declaration
  parentGuardianSignature: text("parentGuardianSignature"), // Base64 signature data
  parentGuardianPrintedName: varchar("parentGuardianPrintedName", { length: 255 }).notNull(),
  consentDate: date("consentDate").notNull(),
  
  // Section 11: Second Parent/Guardian Consent
  secondParentGuardianSignature: text("secondParentGuardianSignature"),
  secondParentGuardianPrintedName: varchar("secondParentGuardianPrintedName", { length: 255 }),
  secondParentConsentDate: date("secondParentConsentDate"),
  
  // Section 12: Change In Youth Confirmation
  receivedBy: varchar("receivedBy", { length: 255 }),
  dateReceived: date("dateReceived"),
  storedIn: varchar("storedIn", { length: 255 }),
  
  // Metadata
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // For audit trail
  userAgent: text("userAgent"), // Browser/device info
  expiryDate: date("expiryDate"), // Optional expiry date for consent
  status: mysqlEnum("status", ["active", "expired", "revoked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type BudgetLine = typeof budgetLines.$inferSelect;
export type InsertBudgetLine = typeof budgetLines.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type SessionFacilitator = typeof sessionFacilitators.$inferSelect;
export type InsertSessionFacilitator = typeof sessionFacilitators.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type ExpectedPayment = typeof expectedPayments.$inferSelect;
export type InsertExpectedPayment = typeof expectedPayments.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export type TaskChecklist = typeof taskChecklist.$inferSelect;
export type InsertTaskChecklist = typeof taskChecklist.$inferInsert;

export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = typeof chatChannels.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type Register = typeof registers.$inferSelect;
export type InsertRegister = typeof registers.$inferInsert;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = typeof trainingModules.$inferInsert;

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type InsertTrainingProgress = typeof trainingProgress.$inferInsert;

export type TeamPairing = typeof teamPairings.$inferSelect;
export type InsertTeamPairing = typeof teamPairings.$inferInsert;

export type PayRate = typeof payRates.$inferSelect;
export type InsertPayRate = typeof payRates.$inferInsert;

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = typeof payslips.$inferInsert;

export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = typeof adminNotes.$inferInsert;

export type OnboardingPack = typeof onboardingPacks.$inferSelect;
export type InsertOnboardingPack = typeof onboardingPacks.$inferInsert;

export type OnboardingPackDocument = typeof onboardingPackDocuments.$inferSelect;
export type InsertOnboardingPackDocument = typeof onboardingPackDocuments.$inferInsert;

export type UserActivity = typeof userActivityLog.$inferSelect;
export type InsertUserActivity = typeof userActivityLog.$inferInsert;

export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = typeof privateMessages.$inferInsert;

export type SessionType = typeof sessionTypes.$inferSelect;
export type InsertSessionType = typeof sessionTypes.$inferInsert;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export type SessionContent = typeof sessionContent.$inferSelect;
export type InsertSessionContent = typeof sessionContent.$inferInsert;

export type VideoCallAttendance = typeof videoCallAttendance.$inferSelect;
export type InsertVideoCallAttendance = typeof videoCallAttendance.$inferInsert;

export type ConsentForm = typeof consentForms.$inferSelect;
export type NewConsentForm = typeof consentForms.$inferInsert;

// DBS Records - Track DBS certificates for team members
export const dbsRecords = mysqlTable("dbs_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  certificateNumber: varchar("certificate_number", { length: 255 }).notNull(),
  dbsType: mysqlEnum("dbs_type", ["basic", "standard", "enhanced", "enhanced_barred"]).notNull().default("enhanced"),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: mysqlEnum("status", ["valid", "expiring_soon", "expired", "pending"]).notNull().default("valid"),
  certificateUrl: text("certificate_url"),
  notes: text("notes"),
  renewalPeriodYears: int("renewal_period_years").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type DbsRecord = typeof dbsRecords.$inferSelect;
export type NewDbsRecord = typeof dbsRecords.$inferInsert;

// Team Channels - Group chats for teams
export const teamChannels = mysqlTable("team_chat_channels", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull().default(1),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("created_by").notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TeamChannel = typeof teamChannels.$inferSelect;
export type NewTeamChannel = typeof teamChannels.$inferInsert;

// Channel Messages
export const teamChatMessages = mysqlTable("team_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channel_id").notNull(),
  userId: int("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TeamChatMessage = typeof teamChatMessages.$inferSelect;
export type NewTeamChatMessage = typeof teamChatMessages.$inferInsert;

// Channel Members
export const channelMembers = mysqlTable("team_chat_members", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channel_id").notNull(),
  userId: int("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type ChannelMember = typeof channelMembers.$inferSelect;
export type NewChannelMember = typeof channelMembers.$inferInsert;

// Development Records - Personal development tracking
export const developmentRecords = mysqlTable("development_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  recordType: mysqlEnum("record_type", ["skill_assessment", "performance_note", "milestone", "goal"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  addedBy: int("added_by").notNull(),
  completedDate: date("completed_date"), // For milestones and goals
  createdAt: timestamp("created_at").defaultNow(),
});

export type DevelopmentRecord = typeof developmentRecords.$inferSelect;
export type NewDevelopmentRecord = typeof developmentRecords.$inferInsert;

// Meeting Requests - Team-initiated meetings
export const meetingRequests = mysqlTable("meeting_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestedBy: int("requested_by").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requestedDate: datetime("requested_date").notNull(),
  durationMinutes: int("duration_minutes").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  sessionId: int("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MeetingRequest = typeof meetingRequests.$inferSelect;
export type NewMeetingRequest = typeof meetingRequests.$inferInsert;

// Meeting Request Participants
export const meetingRequestParticipants = mysqlTable("meeting_request_participants", {
  id: int("id").autoincrement().primaryKey(),
  meetingRequestId: int("meeting_request_id").notNull(),
  userId: int("user_id").notNull(),
});

export type MeetingRequestParticipant = typeof meetingRequestParticipants.$inferSelect;
export type NewMeetingRequestParticipant = typeof meetingRequestParticipants.$inferInsert;

// Rank History - Track all rank changes for team members
export const rankHistory = mysqlTable("rank_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  oldRank: varchar("old_rank", { length: 50 }),
  newRank: varchar("new_rank", { length: 50 }).notNull(),
  changedBy: int("changed_by").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RankHistory = typeof rankHistory.$inferSelect;
export type NewRankHistory = typeof rankHistory.$inferInsert;

// ========================================
// JOB OPPORTUNITIES
// ========================================

// Job postings
export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 255 }),
  jobType: varchar("job_type", { length: 50 }), // full-time, part-time, contract, etc.
  salary: varchar("salary", { length: 100 }),
  applicationUrl: varchar("application_url", { length: 500 }),
  applicationEmail: varchar("application_email", { length: 320 }),
  externalSource: varchar("external_source", { length: 100 }), // e.g., "WhatsApp", "LinkedIn"
  isPublic: boolean("is_public").default(true).notNull(), // visible to public or team only
  status: mysqlEnum("status", ["active", "closed", "draft"]).default("active").notNull(),
  postedBy: int("posted_by").notNull(),
  viewCount: int("view_count").default(0).notNull(),
  clickCount: int("click_count").default(0).notNull(),
  applicationCount: int("application_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type NewJobPosting = typeof jobPostings.$inferInsert;

// Job view tracking - who viewed which job
export const jobViews = mysqlTable("job_views", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  userId: int("user_id"), // null for anonymous public users
  userType: mysqlEnum("user_type", ["team_member", "public"]).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export type JobView = typeof jobViews.$inferSelect;
export type NewJobView = typeof jobViews.$inferInsert;

// Job click tracking - when users click "Apply" or external links
export const jobClicks = mysqlTable("job_clicks", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  userId: int("user_id"), // null for anonymous public users
  userType: mysqlEnum("user_type", ["team_member", "public"]).notNull(),
  clickType: mysqlEnum("click_type", ["apply_button", "external_link", "email"]).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export type JobClick = typeof jobClicks.$inferSelect;
export type NewJobClick = typeof jobClicks.$inferInsert;

// Job applications - track applications submitted through the app
export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  userId: int("user_id"), // null for public applicants
  applicantName: varchar("applicant_name", { length: 255 }),
  applicantEmail: varchar("applicant_email", { length: 320 }),
  applicantPhone: varchar("applicant_phone", { length: 50 }),
  resumeUrl: varchar("resume_url", { length: 500 }),
  coverLetter: text("cover_letter"),
  status: mysqlEnum("status", ["submitted", "reviewed", "shortlisted", "rejected", "hired"]).default("submitted").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: int("reviewed_by"),
  notes: text("notes"),
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;

// ========================================
// APP ANALYTICS
// ========================================

// Analytics Module
export const appAnalytics = mysqlTable("app_analytics", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // app_open, screen_view, feature_use, etc.
  eventName: varchar("event_name", { length: 100 }).notNull(),
  userId: int("user_id"),
  metadata: json("metadata"), // Additional event data
  platform: varchar("platform", { length: 20 }), // ios, android, web
  appVersion: varchar("app_version", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AppAnalytic = typeof appAnalytics.$inferSelect;
export type NewAppAnalytic = typeof appAnalytics.$inferInsert;

export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  duration: int("duration"), // in seconds
  platform: varchar("platform", { length: 20 }),
  deviceInfo: json("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

// ========================================
// INVOICE TEMPLATES
// ========================================

// Invoice Templates for recurring work
export const invoiceTemplates = mysqlTable("invoice_templates", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  projectId: int("project_id").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type NewInvoiceTemplate = typeof invoiceTemplates.$inferInsert;

export const invoiceTemplateItems = mysqlTable("invoice_template_items", {
  id: int("id").primaryKey().autoincrement(),
  templateId: int("template_id").notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'session_type' or 'expense_category'
  itemIdentifier: varchar("item_identifier", { length: 255 }).notNull(), // session type ID or expense category
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InvoiceTemplateItem = typeof invoiceTemplateItems.$inferSelect;
export type NewInvoiceTemplateItem = typeof invoiceTemplateItems.$inferInsert;


// ========================================
// PROJECT TEAM CHAT & SOCIAL MEDIA
// ========================================

// Project chats (e.g., Social Media Preneur cohort 2, Tree of Life)
export const projectChats = mysqlTable("project_chats", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project chat members
export const projectChatMembers = mysqlTable("project_chat_members", {
  id: int("id").primaryKey().autoincrement(),
  chatId: int("chat_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 50 }).default("member"), // 'member' or 'admin'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chat messages with media support
export const projectChatMessages = mysqlTable("project_chat_messages", {
  id: int("id").primaryKey().autoincrement(),
  chatId: int("chat_id").notNull(),
  userId: int("user_id").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // 'text', 'image', 'video'
  content: text("content"), // text content or media URL
  mediaUrl: varchar("media_url", { length: 500 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media submissions from team members
export const socialMediaSubmissions = mysqlTable("social_media_submissions", {
  id: int("id").primaryKey().autoincrement(),
  chatId: int("chat_id").notNull(), // reference to chat channel
  messageId: int("message_id").notNull(), // reference to projectChatMessages
  submittedBy: int("submitted_by").notNull(),
  caption: text("caption"),
  platforms: json("platforms").$type<string[]>().default(JSON.stringify(["instagram"])), // JSON array of platform names
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected'
  qualityRating: int("qualityRating"), // 1-5 rating for post quality (set when reviewed)
  reviewedBy: int("reviewed_by"),
  reviewNotes: text("reviewNotes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Posted social media content with performance metrics
export const socialMediaPosts = mysqlTable("social_media_posts", {
  id: int("id").primaryKey().autoincrement(),
  submissionId: int("submission_id").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // 'instagram' or 'twitter'
  postId: varchar("post_id", { length: 255 }), // platform-specific post ID
  postUrl: varchar("post_url", { length: 500 }),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  views: int("views").default(0),
  reach: int("reach").default(0),
  engagement: int("engagement").default(0),
  postedAt: timestamp("posted_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Content creator performance stats
export const contentCreatorStats = mysqlTable("content_creator_stats", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
  totalSubmissions: int("total_submissions").default(0),
  approvedSubmissions: int("approved_submissions").default(0),
  totalLikes: int("total_likes").default(0),
  totalViews: int("total_views").default(0),
  totalReach: int("total_reach").default(0),
  totalEngagement: int("total_engagement").default(0),
  rank: int("rank"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========================================
// PARTICIPANT REGISTRATION & DEMOGRAPHICS
// ========================================

// Participant accounts (lightweight registration)
export const participants = mysqlTable("participants", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 50 }),
  ethnicity: varchar("ethnicity", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  referralSource: varchar("referral_source", { length: 255 }),
  schoolId: int("school_id"), // link to schools if applicable
  consentGiven: boolean("consent_given").default(true),
  registeredAt: timestamp("registered_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
});

// Link participants to existing session attendance
export const participantSessionLinks = mysqlTable("participant_session_links", {
  id: int("id").primaryKey().autoincrement(),
  participantId: int("participant_id").notNull(),
  sessionId: int("session_id").notNull(),
  linkedAt: timestamp("linked_at").defaultNow(),
});

// ========================================
// PRIVATE PARTICIPANT-STAFF CHAT
// ========================================

// Private conversations between participants and staff
export const privateChats = mysqlTable("private_chats", {
  id: int("id").primaryKey().autoincrement(),
  participantId: int("participant_id").notNull(),
  staffId: int("staff_id").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'archived'
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

// Private chat messages
export const privateChatMessages = mysqlTable("private_chat_messages", {
  id: int("id").primaryKey().autoincrement(),
  chatId: int("chat_id").notNull(),
  senderId: int("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'participant' or 'staff'
  messageType: varchar("message_type", { length: 20 }).default("text"),
  content: text("content"),
  mediaUrl: varchar("media_url", { length: 500 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// POSITIVE ID EVALUATION FORM
// ========================================

// Positive ID evaluation responses
export const positiveIdResponses = mysqlTable("positive_id_responses", {
  id: int("id").primaryKey().autoincrement(),
  participantId: int("participant_id"), // optional if anonymous
  school: varchar("school", { length: 255 }),
  gender: varchar("gender", { length: 50 }),
  age: int("age"),
  feltSafe: varchar("felt_safe", { length: 20 }), // 'agree' or 'disagree'
  helpedFeelBetter: varchar("helped_feel_better", { length: 20 }),
  comfortableAskingHelp: varchar("comfortable_asking_help", { length: 20 }),
  awareOfSupport: varchar("aware_of_support", { length: 20 }), // 'yes', 'no', 'maybe'
  facilitatorsGoodJob: varchar("facilitators_good_job", { length: 20 }),
  heritageImportant: varchar("heritage_important", { length: 20 }),
  heritageReason: text("heritage_reason"),
  wouldRecommend: varchar("would_recommend", { length: 20 }),
  enjoymentRating: int("enjoyment_rating"), // 1-5
  likedMost: text("liked_most"),
  improvements: text("improvements"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export type ProjectChat = typeof projectChats.$inferSelect;
export type NewProjectChat = typeof projectChats.$inferInsert;
export type ProjectChatMember = typeof projectChatMembers.$inferSelect;
export type NewProjectChatMember = typeof projectChatMembers.$inferInsert;
export type ProjectChatMessage = typeof projectChatMessages.$inferSelect;
export type NewProjectChatMessage = typeof projectChatMessages.$inferInsert;
export type SocialMediaSubmission = typeof socialMediaSubmissions.$inferSelect;
export type NewSocialMediaSubmission = typeof socialMediaSubmissions.$inferInsert;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type NewSocialMediaPost = typeof socialMediaPosts.$inferInsert;
export type ContentCreatorStat = typeof contentCreatorStats.$inferSelect;
export type NewContentCreatorStat = typeof contentCreatorStats.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type ParticipantSessionLink = typeof participantSessionLinks.$inferSelect;
export type NewParticipantSessionLink = typeof participantSessionLinks.$inferInsert;
export type PrivateChat = typeof privateChats.$inferSelect;
export type NewPrivateChat = typeof privateChats.$inferInsert;
export type PrivateChatMessage = typeof privateChatMessages.$inferSelect;
export type NewPrivateChatMessage = typeof privateChatMessages.$inferInsert;
export type PositiveIdResponse = typeof positiveIdResponses.$inferSelect;
export type NewPositiveIdResponse = typeof positiveIdResponses.$inferInsert;

// ========================================
// PERMISSIONS & ACCESS CONTROL
// ========================================

// User Permissions - Project/regional access control for admins
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"), // null = all projects
  accessLevel: mysqlEnum("accessLevel", ["read", "write", "admin"]).default("read").notNull(),
  grantedBy: int("grantedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;

// ========================================
// SESSION DELIVERABLES
// ========================================

export const deliverablesCompleted = mysqlTable("deliverables_completed", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(), // facilitator who completed the deliverable
  deliverableType: mysqlEnum("deliverableType", ["register", "evaluation_form", "photos", "videos", "team_feedback"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }), // S3 URL of uploaded proof
  notes: text("notes"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliverableCompleted = typeof deliverablesCompleted.$inferSelect;
export type NewDeliverableCompleted = typeof deliverablesCompleted.$inferInsert;

export const sessionFeedback = mysqlTable("session_feedback", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(), // facilitator providing feedback
  rating: int("rating").notNull(), // 1-5 stars
  workshopQuality: int("workshopQuality"), // 1-5 rating for workshop feedback quality
  facilitatorPerformance: int("facilitatorPerformance"), // 1-5 rating for facilitator performance
  venueRating: int("venueRating"), // 1-5 rating for venue quality
  whatWentWell: text("whatWentWell"),
  improvements: text("improvements"),
  engagementLevel: mysqlEnum("engagementLevel", ["low", "medium", "high"]),
  venueFeedback: text("venueFeedback"),
  suggestions: text("suggestions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionFeedback = typeof sessionFeedback.$inferSelect;
export type NewSessionFeedback = typeof sessionFeedback.$inferInsert;

// School feedback about facilitators and sessions
export const schoolFeedback = mysqlTable("school_feedback", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  facilitatorId: int("facilitatorId").notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  overallRating: int("overallRating").notNull(), // 1-5 rating
  deliveryQuality: int("deliveryQuality"), // 1-5 rating
  punctuality: int("punctuality"), // 1-5 rating
  professionalism: int("professionalism"), // 1-5 rating
  studentEngagement: int("studentEngagement"), // 1-5 rating
  comments: text("comments"),
  wouldRecommend: boolean("wouldRecommend").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SchoolFeedback = typeof schoolFeedback.$inferSelect;
export type NewSchoolFeedback = typeof schoolFeedback.$inferInsert;




// ========================================
// SOCIAL MEDIA MONTHLY RANKINGS & BONUSES
// ========================================

// Monthly quality rankings (based on star ratings)
export const socialMediaQualityRankings = mysqlTable("social_media_quality_rankings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
  averageQualityRating: decimal("average_quality_rating", { precision: 3, scale: 2 }).notNull(), // 1-5 stars
  totalApprovedPosts: int("total_approved_posts").default(0),
  rank: int("rank"),
  bonusAwarded: boolean("bonus_awarded").default(false),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type SocialMediaQualityRanking = typeof socialMediaQualityRankings.$inferSelect;
export type NewSocialMediaQualityRanking = typeof socialMediaQualityRankings.$inferInsert;

// Monthly reach rankings (based on engagement metrics)
export const socialMediaReachRankings = mysqlTable("social_media_reach_rankings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
  totalReach: int("total_reach").default(0),
  totalLikes: int("total_likes").default(0),
  totalShares: int("total_shares").default(0),
  totalEngagement: int("total_engagement").default(0),
  rank: int("rank"),
  bonusAwarded: boolean("bonus_awarded").default(false),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type SocialMediaReachRanking = typeof socialMediaReachRankings.$inferSelect;
export type NewSocialMediaReachRanking = typeof socialMediaReachRankings.$inferInsert;

// Monthly bonus payouts
export const monthlyBonuses = mysqlTable("monthly_bonuses", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
  category: varchar("category", { length: 50 }).notNull(), // 'quality' or 'reach'
  rank: int("rank").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 50 GBP per winner
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'paid'
  awardedAt: timestamp("awarded_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MonthlyBonus = typeof monthlyBonuses.$inferSelect;
export type NewMonthlyBonus = typeof monthlyBonuses.$inferInsert;
