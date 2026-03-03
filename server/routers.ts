import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { financeRouter } from "./routers/finance";
import { jobsRouter } from "./routers/jobs";
import { publicJobsRouter } from "./routers/publicJobs";
import { schedulingRouter } from "./routers/scheduling";
import { analyticsRouter } from "./routers/analytics";
import { documentsRouter } from "./routers/documents";
import { chatRouter } from "./routers/chat";
import { surveysRouter } from "./routers/surveys";
// import { notificationsRouter } from "./routers/notifications"; // Temporarily disabled
import { adminRouter } from "./routers/admin";
import { bulkRouter } from "./routers/bulk";
import { calendarRouter } from "./routers/calendar";
import { materialsRouter } from "./routers/materials";
import { userProfileRouter } from "./routers/userProfile";
import { privateMessagesRouter } from "./routers/privateMessages";
import { invoiceSystemRouter } from "./routers/invoiceSystem";
import { videoCallsRouter } from "./routers/videoCalls";
import { contentSharingRouter } from "./routers/contentSharing";
import { meetingRecordingsRouter } from "./routers/meetingRecordings";
import { consentFormsRouter } from "./routers/consentForms";
import { programRegistrationsRouter } from "./routers/programRegistrations";
import { funderReportsRouter } from "./routers/funderReports";
import { participantJourneyRouter } from "./routers/participantJourney";
import { projectAssignmentsRouter } from "./routers/projectAssignments";
import { notificationsRouter } from "./routers/notifications";
import { dbsTrackingRouter } from "./routers/dbsTracking";
import { registerOCRRouter } from "./routers/registerOCR";
import { earningsExportRouter } from "./routers/earningsExport";
import { meetingNotesExportRouter } from "./routers/meetingNotesExport";
import { agoraTokensRouter } from "./routers/agoraTokens";
import { teamChatsRouter } from "./routers/teamChats";
import { personalDevelopmentRouter } from "./routers/personalDevelopment";
import { meetingRequestsRouter } from "./routers/meetingRequests";
import { teamRankingRouter } from "./routers/teamRanking";
import { permissionsRouter } from "./routers/permissions";
import { budgetExportRouter } from "./routers/budgetExport";
import { seedRouter } from "./routers/seed";
import { fileUploadRouter } from "./routers/fileUpload";
import { autoInvoicesRouter } from "./routers/autoInvoices";
import { sessionsRouter } from "./routers/sessions";
import { projectChatRouter } from "./routers/projectChat";
import { socialMediaRouter } from "./routers/socialMedia";
import { participantsRouter } from "./routers/participants";
import { positiveIdRouter } from "./routers/positiveId";
import { feedbackRouter } from "./routers/feedback";
import { organizationsRouter } from "./routers/organizations";
import { adminUsersRouter } from "./routers/admin-users";
import { consentRouter } from "./routers/consent";
import { performanceRankingRouter } from "./routers/performanceRanking";
import { onboardingRouter } from "./routers/onboarding";
import { tasksRouter } from "./routers/tasks";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  finance: financeRouter,
  jobs: jobsRouter,
  publicJobs: publicJobsRouter,
  scheduling: schedulingRouter,
  analytics: analyticsRouter,
  documents: documentsRouter,
  chat: chatRouter,
  surveys: surveysRouter,
  // notifications: notificationsRouter, // Temporarily disabled
  admin: adminRouter,
  adminUsers: adminUsersRouter,
  bulk: bulkRouter,
  calendar: calendarRouter,
  materials: materialsRouter,
  userProfile: userProfileRouter,
  privateMessages: privateMessagesRouter,
  invoiceSystem: invoiceSystemRouter,
  videoCalls: videoCallsRouter,
  contentSharing: contentSharingRouter,
  meetingRecordings: meetingRecordingsRouter,
  consentForms: consentFormsRouter,
  programRegistrations: programRegistrationsRouter,
  funderReports: funderReportsRouter,
  participantJourney: participantJourneyRouter,
  projectAssignments: projectAssignmentsRouter,
  notifications: notificationsRouter,
  dbsTracking: dbsTrackingRouter,
  registerOCR: registerOCRRouter,
  earningsExport: earningsExportRouter,
  meetingNotesExport: meetingNotesExportRouter,
  agoraTokens: agoraTokensRouter,
  teamChats: teamChatsRouter,
  personalDevelopment: personalDevelopmentRouter,
  meetingRequests: meetingRequestsRouter,
  teamRanking: teamRankingRouter,
  permissions: permissionsRouter,
  budgetExport: budgetExportRouter,
  seed: seedRouter,
  fileUpload: fileUploadRouter,
  autoInvoices: autoInvoicesRouter,
  sessions: sessionsRouter,
  projectChat: projectChatRouter,
  socialMedia: socialMediaRouter,
  participants: participantsRouter,
  positiveId: positiveIdRouter,
  feedback: feedbackRouter,
  tasks: tasksRouter,
  organizations: organizationsRouter,
  consent: consentRouter,
  performanceRanking: performanceRankingRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
