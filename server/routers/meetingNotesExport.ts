import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessions, videoCallAttendance } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const meetingNotesExportRouter = router({
  // Generate AI summary of meeting
  generateMeetingSummary: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      transcript: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const content = [
        input.transcript ? `Transcript: ${input.transcript}` : "",
        input.notes ? `Notes: ${input.notes}` : "",
      ].filter(Boolean).join("\n\n");

      if (!content) {
        return { summary: "No content available to summarize.", actionItems: [] };
      }

      const prompt = `Analyze this meeting content and provide:
1. A concise summary (2-3 sentences)
2. Key discussion points (bullet points)
3. Action items with responsible parties if mentioned

Meeting Content:
${content}

Format your response as:
SUMMARY:
[summary here]

KEY POINTS:
- [point 1]
- [point 2]

ACTION ITEMS:
- [action 1]
- [action 2]`;

      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });
      const responseContent = result.choices[0]?.message?.content || "";
      const response = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent);

      // Parse the response
      const summaryMatch = response.match(/SUMMARY:(.*?)(?=KEY POINTS:|ACTION ITEMS:|$)/s);
      const keyPointsMatch = response.match(/KEY POINTS:(.*?)(?=ACTION ITEMS:|$)/s);
      const actionItemsMatch = response.match(/ACTION ITEMS:(.*?)$/s);

      const summary = summaryMatch ? summaryMatch[1].trim() : response;
      const keyPoints = keyPointsMatch 
        ? keyPointsMatch[1].trim().split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.trim().substring(1).trim())
        : [];
      const actionItems = actionItemsMatch
        ? actionItemsMatch[1].trim().split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.trim().substring(1).trim())
        : [];

      return { summary, keyPoints, actionItems };
    }),

  // Get meeting notes export data
  getMeetingNotesData: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get session details
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      // Get attendance records
      const attendance = await db
        .select()
        .from(videoCallAttendance)
        .where(eq(videoCallAttendance.sessionId, input.sessionId));

      const sessionData = session[0];

      // Calculate total duration and attendance stats
      const attendanceStats = attendance.map(record => {
        const duration = (record.durationMinutes || 0) * 60; // Convert to seconds
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return {
          userId: record.userId,
          joinedAt: record.joinedAt,
          leftAt: record.leftAt,
          duration,
          durationFormatted: `${hours}h ${minutes}m`,
          payment: record.calculatedPayment ? parseFloat(record.calculatedPayment) : 0,
        };
      });

      const totalAttendees = attendance.length;
      const averageDuration = attendance.length > 0
        ? attendance.reduce((sum, a) => sum + ((a.durationMinutes || 0) * 60), 0) / attendance.length
        : 0;

      return {
        session: {
          title: sessionData.title,
          description: sessionData.description,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          venue: sessionData.venue,
        },
        attendance: attendanceStats,
        stats: {
          totalAttendees,
          averageDuration,
          totalPayments: attendanceStats.reduce((sum, a) => sum + a.payment, 0),
        },
      };
    }),

  // Export meeting notes as text
  exportAsText: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      includeSummary: z.boolean().optional(),
      includeAttendance: z.boolean().optional(),
      includeTranscript: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      const sessionData = session[0];
      let content = `MEETING NOTES\n\n`;
      content += `Title: ${sessionData.title}\n`;
      content += `Date: ${sessionData.startTime ? new Date(sessionData.startTime).toLocaleString() : 'N/A'}\n`;
      content += `Location: ${sessionData.venue || 'N/A'}\n\n`;

      if (sessionData.description) {
        content += `Description:\n${sessionData.description}\n\n`;
      }

      if (input.includeAttendance) {
        const attendance = await db
          .select()
          .from(videoCallAttendance)
          .where(eq(videoCallAttendance.sessionId, input.sessionId));

        content += `ATTENDANCE (${attendance.length} attendees)\n`;
        content += `${'='.repeat(50)}\n`;
        attendance.forEach((record, index) => {
          const duration = (record.durationMinutes || 0) * 60; // Convert to seconds
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          content += `${index + 1}. User ID ${record.userId}\n`;
          content += `   Joined: ${record.joinedAt ? new Date(record.joinedAt).toLocaleTimeString() : 'N/A'}\n`;
          content += `   Left: ${record.leftAt ? new Date(record.leftAt).toLocaleTimeString() : 'N/A'}\n`;
          content += `   Duration: ${hours}h ${minutes}m\n\n`;
        });
      }

      // Notes are stored separately, not in sessions table

      return { text: content, filename: `meeting-notes-${input.sessionId}.txt` };
    }),
});
