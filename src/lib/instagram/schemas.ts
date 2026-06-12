import { z } from "zod";

const stringList = z.array(z.string().min(1)).min(1);

export const brandConfigSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  instagramHandle: z.string().min(2, "Handle do Instagram obrigatório").transform((v) => v.replace(/^@/, "")),
  segment: z.string().min(2),
  tone: z.string().min(5),
  mainCta: z.string().min(5),
  whatsappNumber: z.string().min(10),
  targetAudience: stringList,
  differentials: stringList,
  primaryHashtags: stringList,
  localHashtags: z.array(z.string()),
  logoUrl: z.string().url().optional().or(z.literal("")),
  brandColors: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
  brandFonts: z
    .object({
      heading: z.string().min(2),
      body: z.string().min(2),
    })
    .optional(),
  artTemplateSet: z.enum(["carousel", "oferta", "bastidores", "institucional"]).optional(),
  visualGuidelines: z.string().optional(),
  publicationMode: z.enum(["MANUAL", "AUTO"]).default("MANUAL"),
});

export type BrandConfigInput = z.infer<typeof brandConfigSchema>;

export const personaSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  segments: z.array(z.string()),
});

export type PersonaInput = z.infer<typeof personaSchema>;

export const generateIdeasSchema = z.object({
  count: z.number().min(1).max(20).default(5),
  contentType: z
    .enum([
      "BEFORE_AFTER",
      "BEHIND_SCENES",
      "PRODUCT_SHOWCASE",
      "EDUCATIONAL_CAROUSEL",
      "DIRECT_OFFER",
      "SEASONAL",
      "REELS_PRODUCTION",
      "RETAIL_TIPS",
      "MATERIAL_COMPARISON",
      "PDV_IDEAS",
      "SOCIAL_PROOF",
      "TESTIMONIAL",
      "PRODUCT_CATALOG",
    ])
    .optional(),
  save: z.boolean().default(true),
});

export const generateCalendarSchema = z.object({
  weekStart: z.string().datetime().optional(),
  save: z.boolean().default(true),
});

export const updateIgPostSchema = z.object({
  title: z.string().min(3).optional(),
  idea: z.string().optional(),
  format: z.enum(["FEED", "CAROUSEL", "STORY", "REELS"]).optional(),
  contentType: z
    .enum([
      "BEFORE_AFTER",
      "BEHIND_SCENES",
      "PRODUCT_SHOWCASE",
      "EDUCATIONAL_CAROUSEL",
      "DIRECT_OFFER",
      "SEASONAL",
      "REELS_PRODUCTION",
      "RETAIL_TIPS",
      "MATERIAL_COMPARISON",
      "PDV_IDEAS",
      "SOCIAL_PROOF",
      "TESTIMONIAL",
      "PRODUCT_CATALOG",
    ])
    .optional(),
  selectedCaptionId: z.string().optional(),
  visualSource: z.enum(["REAL", "MOCKUP", "AI", "MIXED"]).optional(),
  visualFormat: z.string().optional(),
});
