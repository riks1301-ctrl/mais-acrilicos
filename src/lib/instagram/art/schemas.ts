import { z } from "zod";

export const generateArtSchema = z.object({
  templateId: z.enum(["carousel", "oferta", "bastidores", "institucional"]).optional(),
  format: z.string().regex(/^\d+x\d+$/).optional(),
});

export const exportArtSchema = z.object({
  format: z.enum(["png", "jpg", "pdf", "zip"]).default("zip"),
});
