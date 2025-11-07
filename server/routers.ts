import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as azure from "./azure";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Translation feature routers
  translation: router({
    // Get supported languages
    getSupportedLanguages: publicProcedure.query(() => {
      return azure.SUPPORTED_LANGUAGES;
    }),

    // Get supported scenarios
    getSupportedScenarios: publicProcedure.query(() => {
      return azure.SUPPORTED_SCENARIOS;
    }),

    // Get Azure Speech token for client-side SDK
    getSpeechToken: protectedProcedure.query(async () => {
      try {
        return await azure.getSpeechToken();
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get speech token",
        });
      }
    }),

    // Create a new translation session
    createSession: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          sourceLanguage: z.string(),
          targetLanguage: z.string(),
          scenario: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sessionId = await db.createSession({
          userId: ctx.user.id,
          title: input.title,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          scenario: input.scenario,
          status: "active",
        });
        return { sessionId };
      }),

    // Get user's sessions
    getUserSessions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSessions(ctx.user.id);
    }),

    // Get session details
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }
        return session;
      }),

    // Translate text
    translateText: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          text: z.string(),
          confidence: z.number().optional().refine(
            (val) => val === undefined || !isNaN(val),
            { message: "Confidence must be a valid number" }
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        try {
          const { translatedText, confidence } = await azure.translateText(
            input.text,
            session.sourceLanguage,
            session.targetLanguage,
            session.scenario || undefined
          );

          // Save transcript
          await db.createTranscript({
            sessionId: input.sessionId,
            originalText: input.text,
            translatedText,
            confidence: input.confidence,
          });

          return { translatedText, confidence };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Translation failed",
          });
        }
      }),

    // Get session transcripts
    getTranscripts: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }
        return await db.getSessionTranscripts(input.sessionId);
      }),

    // End session
    endSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        await db.updateSession(input.sessionId, {
          status: "completed",
          endedAt: new Date(),
        });

        return { success: true };
      }),

    // Generate summary
    generateSummary: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        // Check if summary already exists
        const existingSummary = await db.getSessionSummary(input.sessionId);
        if (existingSummary) {
          return { summary: existingSummary.summaryText };
        }

        // Get all transcripts
        const transcripts = await db.getSessionTranscripts(input.sessionId);
        if (transcripts.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No transcripts found for this session",
          });
        }

        try {
          const summaryText = await azure.generateSummary(
            transcripts.map(t => `${t.originalText} → ${t.translatedText}`)
          );

          await db.createSummary({
            sessionId: input.sessionId,
            summaryText,
          });

          return { summary: summaryText };
        } catch (error: any) {
          console.error("Failed to generate summary:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to generate summary",
          });
        }
      }),

    // Get session summary
    getSummary: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        const summary = await db.getSessionSummary(input.sessionId);
        // Return null instead of undefined if no summary exists
        return summary || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
