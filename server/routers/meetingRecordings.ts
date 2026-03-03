import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessions } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// In-memory storage for recordings (in production, use S3 or similar)
const recordings: Map<number, {
  sessionId: number;
  recordingUrl: string;
  transcriptUrl: string | null;
  transcript: string | null;
  duration: number;
  recordedAt: Date;
}> = new Map();

export const meetingRecordingsRouter = router({
  // Start recording a meeting
  startRecording: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin/facilitators can start recordings
      if (ctx.user.role !== "admin" && ctx.user.role !== "team_member") {
        throw new Error("Only admins and facilitators can start recordings");
      }

      // Check if session exists
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error("Session not found");
      }

      // In a real implementation, this would start the video recording
      // For now, we'll simulate it
      const recordingId = Date.now();

      return {
        recordingId,
        message: "Recording started",
      };
    }),

  // Stop recording and trigger transcription
  stopRecording: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        recordingUrl: z.string(),
        duration: z.number(), // in seconds
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Store recording info
      const recording = {
        sessionId: input.sessionId,
        recordingUrl: input.recordingUrl,
        transcriptUrl: null,
        transcript: null,
        duration: input.duration,
        recordedAt: new Date(),
      };

      recordings.set(input.sessionId, recording);

      // Keep only last 10 recordings
      if (recordings.size > 10) {
        const oldestKey = Array.from(recordings.keys())[0];
        recordings.delete(oldestKey);
      }

      // In a real implementation, trigger transcription job here
      // For now, we'll simulate it with a placeholder
      setTimeout(() => {
        const rec = recordings.get(input.sessionId);
        if (rec) {
          rec.transcript = "This is a simulated transcript. In production, this would be generated using the manus-speech-to-text utility or an external transcription service.";
          rec.transcriptUrl = `/transcripts/${input.sessionId}.txt`;
        }
      }, 2000);

      return {
        success: true,
        message: "Recording saved. Transcription in progress...",
      };
    }),

  // Get recording for a session
  getRecording: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const recording = recordings.get(input.sessionId);

      if (!recording) {
        return null;
      }

      return {
        sessionId: recording.sessionId,
        recordingUrl: recording.recordingUrl,
        transcriptUrl: recording.transcriptUrl,
        transcript: recording.transcript,
        duration: recording.duration,
        recordedAt: recording.recordedAt,
      };
    }),

  // Get all recordings (last 10)
  getAllRecordings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Only admin can view all recordings
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view all recordings");
    }

    const recordingsList = Array.from(recordings.values())
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, 10);

    // Get session details for each recording
    const recordingsWithSessions = await Promise.all(
      recordingsList.map(async (rec) => {
        const session = await db
          .select()
          .from(sessions)
          .where(eq(sessions.id, rec.sessionId))
          .limit(1);

        return {
          ...rec,
          sessionTitle: session[0]?.title || "Unknown Session",
          sessionDate: session[0]?.startTime || rec.recordedAt,
        };
      })
    );

    return recordingsWithSessions;
  }),

  // Delete old recordings (keep only last 10)
  cleanupOldRecordings: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can cleanup recordings");
    }

    const recordingsList = Array.from(recordings.entries())
      .sort((a, b) => b[1].recordedAt.getTime() - a[1].recordedAt.getTime());

    // Keep only last 10
    if (recordingsList.length > 10) {
      const toDelete = recordingsList.slice(10);
      toDelete.forEach(([key]) => recordings.delete(key));

      return {
        success: true,
        deletedCount: toDelete.length,
      };
    }

    return {
      success: true,
      deletedCount: 0,
    };
  }),

  // Search transcripts
  searchTranscripts: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const query = input.query.toLowerCase();
      const results: any[] = [];

      for (const [sessionId, recording] of recordings.entries()) {
        if (recording.transcript && recording.transcript.toLowerCase().includes(query)) {
          const session = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

          results.push({
            sessionId,
            sessionTitle: session[0]?.title || "Unknown Session",
            sessionDate: session[0]?.startTime || recording.recordedAt,
            transcript: recording.transcript,
            recordingUrl: recording.recordingUrl,
          });
        }
      }

      return results;
    }),
});
