import { z } from "zod";

export const generateArtSchema = z.object({
  templateId: z.enum(["carousel", "oferta", "bastidores", "institucional"]).optional(),
  format: z.string().regex(/^\d+x\d+$/).optional(),
  slideOrder: z.number().int().min(1).max(6).optional(),
  prepareOnly: z.boolean().optional(),
  finalize: z.boolean().optional(),
});

export const exportArtSchema = z.object({
  format: z.enum(["png", "jpg", "pdf", "zip"]).default("zip"),
});
