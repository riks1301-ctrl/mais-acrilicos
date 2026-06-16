import { z } from "zod";

const imageCategory = z.enum([
  "OBRA_PRONTA",
  "BASTIDORES",
  "ACRILICO",
  "DISPLAY",
  "FACHADA",
  "BANNER",
  "ADESIVO",
  "LUMINOSO",
  "PDV",
  "ANTES_DEPOIS",
]);

const imageStatus = z.enum(["AVAILABLE", "IN_REVIEW", "ARCHIVED"]);
const imageType = z.enum(["REAL", "MOCKUP", "CONCEPT", "COMMERCIAL_ART"]);
const visualSource = z.enum(["REAL", "MOCKUP", "AI", "MIXED"]);
const promptPurpose = z.enum(["FEED_SQUARE", "FEED_PORTRAIT", "STORY_REELS", "REELS_COVER", "CAROUSEL"]);

export const imageMetadataSchema = z.object({
  category: imageCategory,
  description: z.string().min(3),
  tags: z.array(z.string()).default([]),
  serviceId: z.string().optional().nullable(),
  clientProject: z.string().optional().nullable(),
  usagePermission: z.string().default("uso_interno"),
  status: imageStatus.default("IN_REVIEW"),
  imageType: imageType.default("REAL"),
  altText: z.string().optional().nullable(),
});

export const updateImageSchema = imageMetadataSchema.partial().extend({
  status: imageStatus.optional(),
});

export const linkImageToPostSchema = z.object({
  imageId: z.string(),
  role: z.enum(["attachment", "cover", "slide", "background"]).default("attachment"),
  order: z.number().int().min(0).optional(),
});

export const generatePromptsSchema = z.object({
  purposes: z.array(promptPurpose).min(1).optional(),
  imageType: imageType.default("CONCEPT"),
});

export const externalImagesSchema = z.object({
  urls: z.array(z.string().min(10)).min(1).max(50),
  category: imageCategory.optional(),
  description: z.string().min(3).optional(),
  tags: z.array(z.string()).default([]),
  status: imageStatus.default("AVAILABLE"),
  imageType: imageType.default("REAL"),
});

export const updatePostVisualSchema = z.object({
  visualSource: visualSource.optional(),
  visualFormat: z.string().optional(),
});

export const carouselSlideSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(1).max(6),
  slideType: z.string(),
  headline: z.string().min(1),
  body: z.string().min(1),
  backgroundImageId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateCarouselSchema = z.object({
  slides: z.array(carouselSlideSchema).min(1).max(6),
});
