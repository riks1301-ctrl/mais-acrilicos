import { z } from "zod";

export const approvePostSchema = z.object({
  forceLowScore: z.boolean().default(false),
  forceNoVisual: z.boolean().default(false),
});

export const rejectPostSchema = z.object({
  reason: z.string().min(10, "Informe o motivo da reprovação (mínimo 10 caracteres)"),
});

export const requestAdjustmentsSchema = z.object({
  notes: z.string().min(10, "Descreva os ajustes necessários"),
});

export const finalPostEditSchema = z.object({
  title: z.string().min(3).optional(),
  finalCaption: z.string().min(20, "Legenda final muito curta"),
  finalCta: z.string().min(5),
  finalHashtags: z.string().min(3),
  format: z.enum(["FEED", "CAROUSEL", "STORY", "REELS"]).optional(),
  suggestedDate: z.string().datetime().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  primaryImageId: z.string().nullable().optional(),
});

export const schedulePostSchema = z.object({
  scheduledFor: z.string().datetime(),
  publicationChannel: z.enum(["FEED", "STORY", "REELS", "CAROUSEL"]),
  publicationNotes: z.string().optional(),
});

export const manualPublishSchema = z.object({
  notes: z.string().min(5, "Informe uma observação sobre a publicação manual"),
});
