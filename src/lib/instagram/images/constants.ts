import type { IgImageCategory, IgImageStatus, IgImageType, IgPromptPurpose, IgVisualSource } from "@prisma/client";

export const IMAGE_CATEGORIES: { id: IgImageCategory; label: string }[] = [
  { id: "OBRA_PRONTA", label: "Obras prontas" },
  { id: "BASTIDORES", label: "Bastidores" },
  { id: "ACRILICO", label: "Acrílicos" },
  { id: "DISPLAY", label: "Displays" },
  { id: "FACHADA", label: "Fachadas" },
  { id: "BANNER", label: "Banners" },
  { id: "ADESIVO", label: "Adesivos" },
  { id: "LUMINOSO", label: "Luminosos" },
  { id: "PDV", label: "PDV" },
  { id: "ANTES_DEPOIS", label: "Antes/depois" },
];

export const IMAGE_STATUS_LABELS: Record<IgImageStatus, string> = {
  AVAILABLE: "Disponível",
  IN_REVIEW: "Em revisão",
  ARCHIVED: "Arquivada",
};

export const IMAGE_TYPE_LABELS: Record<IgImageType, string> = {
  REAL: "Foto real",
  MOCKUP: "Mockup",
  CONCEPT: "Conceito",
  COMMERCIAL_ART: "Arte comercial",
};

export const VISUAL_SOURCE_LABELS: Record<IgVisualSource, string> = {
  REAL: "Imagem real da empresa",
  MOCKUP: "Mockup",
  AI: "Gerada por IA",
  MIXED: "Misto (real + arte)",
};

export const PROMPT_PURPOSES: { id: IgPromptPurpose; label: string; format: string; ratio: string }[] = [
  { id: "FEED_SQUARE", label: "Feed quadrado", format: "1080x1080", ratio: "1:1" },
  { id: "FEED_PORTRAIT", label: "Feed retrato", format: "1080x1350", ratio: "4:5" },
  { id: "STORY_REELS", label: "Story / Reels vertical", format: "1080x1920", ratio: "9:16" },
  { id: "REELS_COVER", label: "Capa de Reels", format: "1080x1920", ratio: "9:16" },
  { id: "CAROUSEL", label: "Carrossel", format: "1080x1080", ratio: "1:1" },
];

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const UPLOAD_PUBLIC_PREFIX = "/uploads/instagram";

export const CAROUSEL_SLIDE_TYPES = [
  { type: "hook", label: "Slide 1 — Gancho forte", order: 1 },
  { type: "problem", label: "Slide 2 — Problema", order: 2 },
  { type: "solution", label: "Slide 3 — Solução", order: 3 },
  { type: "example", label: "Slide 4 — Exemplo/produto", order: 4 },
  { type: "benefit", label: "Slide 5 — Benefício", order: 5 },
  { type: "cta", label: "Slide 6 — CTA WhatsApp", order: 6 },
] as const;

export function categoryLabel(cat: IgImageCategory | null): string {
  if (!cat) return "Sem categoria";
  return IMAGE_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}
