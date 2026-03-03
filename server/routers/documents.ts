import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";
import { eq, and, desc, or } from "drizzle-orm";

export const documentsRouter = router({
  // Upload a document
  uploadDocument: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        documentType: z.enum(["consent_form", "evaluation_form", "register", "resource", "other"]),
        fileUrl: z.string(),
        sessionId: z.number().optional(),
        studentId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(documents).values({
        title: input.title,
        type: input.documentType,
        fileUrl: input.fileUrl,
        uploadedBy: ctx.user.id,
        sessionId: input.sessionId || null,
        projectId: null,
        description: input.description || null,
      });

      return { success: true, documentId: Number(result[0].insertId) };
    }),

  // Get documents with filters
  getDocuments: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["consent_form", "evaluation_form", "register", "resource", "other"]).optional(),
        sessionId: z.number().optional(),
        studentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(documents);

      const conditions = [];
      if (input.documentType) conditions.push(eq(documents.type, input.documentType));
      if (input.sessionId) conditions.push(eq(documents.sessionId, input.sessionId));
      // Note: studentId field doesn't exist in schema, filtering by sessionId only

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(documents.createdAt));
      return results;
    }),

  // Get document by ID
  getDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!document[0]) throw new Error("Document not found");

      return document[0];
    }),

  // Delete document
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!document[0]) throw new Error("Document not found");

      // Only the uploader or admin can delete
      if (document[0].uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to delete this document");
      }

      await db.delete(documents).where(eq(documents.id, input.documentId));

      return { success: true };
    }),

  // Get documents for a session
  getSessionDocuments: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessionDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.sessionId, input.sessionId))
        .orderBy(desc(documents.createdAt));

      return sessionDocuments;
    }),

  // Get my uploaded documents
  getMyDocuments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const myDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedBy, ctx.user.id))
      .orderBy(desc(documents.createdAt));

    return myDocuments;
  }),

  // Update document metadata
  updateDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        sessionId: z.number().optional(),
        studentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!document[0]) throw new Error("Document not found");

      // Only the uploader or admin can update
      if (document[0].uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to update this document");
      }

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.sessionId !== undefined) updates.sessionId = input.sessionId;
      if (input.studentId !== undefined) updates.studentId = input.studentId;

      await db.update(documents).set(updates).where(eq(documents.id, input.documentId));

      return { success: true };
    }),

  // List all documents (for Documents & Compliance page)
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allDocuments = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));

    return allDocuments;
  }),

  // Get document statistics
  getDocumentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view document statistics");
    }

    const allDocuments = await db.select().from(documents);

    const stats = {
      totalDocuments: allDocuments.length,
      consentForms: allDocuments.filter((d) => d.type === "consent_form").length,
      evaluationForms: allDocuments.filter((d) => d.type === "evaluation_form").length,
      registers: allDocuments.filter((d) => d.type === "register").length,
      resources: allDocuments.filter((d) => d.type === "resource").length,
      other: allDocuments.filter((d) => d.type === "other").length,
    };

    return stats;
  }),
});
