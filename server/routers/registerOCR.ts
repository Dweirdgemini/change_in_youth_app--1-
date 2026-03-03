import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { registers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const registerOCRRouter = router({
  // Process handwritten register image with OCR
  processRegisterImage: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string(),
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Use built-in AI to analyze the handwritten register
      const prompt = `You are analyzing a handwritten attendance register for a youth program session.

Extract the following information from the image:
1. List of participant names
2. Attendance status for each participant (present/absent)
3. Any notes or comments written next to names

Return the data in this exact JSON format:
{
  "participants": [
    {
      "name": "Full Name",
      "present": true/false,
      "notes": "any notes or empty string"
    }
  ]
}

Important:
- Be accurate with name spelling
- Mark as present if there's a checkmark, tick, or "P"
- Mark as absent if there's an X, cross, or "A"
- If attendance is unclear, mark as present and add a note
- Include all visible names even if partially legible`;

      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const messageContent = response.choices[0].message.content;
      const contentString = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);
      const result = JSON.parse(contentString);

      return {
        success: true,
        participants: result.participants,
        sessionId: input.sessionId,
      };
    }),

  // Save OCR results to database
  saveOCRRegister: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        participants: z.array(
          z.object({
            name: z.string(),
            present: z.boolean(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert all participants into registers table
      for (const participant of input.participants) {
        await db.insert(registers).values({
          sessionId: input.sessionId,
          studentName: participant.name,
          present: participant.present,
          notes: participant.notes || null,
          completedBy: ctx.user.id,
        });
      }

      return {
        success: true,
        count: input.participants.length,
      };
    }),

  // Get register for a session
  getSessionRegister: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const registerEntries = await db
        .select()
        .from(registers)
        .where(eq(registers.sessionId, input.sessionId));

      return registerEntries;
    }),

  // Update register entry
  updateRegisterEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        studentName: z.string().optional(),
        present: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      if (input.studentName !== undefined) updates.studentName = input.studentName;
      if (input.present !== undefined) updates.present = input.present;
      if (input.notes !== undefined) updates.notes = input.notes;

      await db.update(registers).set(updates).where(eq(registers.id, input.entryId));

      return { success: true };
    }),

  // Delete register entry
  deleteRegisterEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(registers).where(eq(registers.id, input.entryId));

      return { success: true };
    }),
});
