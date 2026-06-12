import { DEFAULT_BRAND_CONFIG } from "@/lib/instagram/brand-defaults";
import type { InstagramBrandConfig } from "@prisma/client";
import type { ArtTemplateId, BrandColors, BrandFonts } from "./types";

export const DEFAULT_BRAND_FONTS: BrandFonts = {
  heading: "Arial, Helvetica, sans-serif",
  body: "Arial, Helvetica, sans-serif",
};

export const ART_TEMPLATE_LABELS: Record<ArtTemplateId, string> = {
  carousel: "Carrossel educativo",
  oferta: "Template de oferta",
  bastidores: "Bastidores / produção",
  institucional: "Institucional",
};

export function resolveBrandColors(brand: InstagramBrandConfig): BrandColors {
  const raw = brand.brandColors as BrandColors | null;
  const defaults = DEFAULT_BRAND_CONFIG.brandColors as BrandColors;
  return {
    primary: raw?.primary ?? defaults.primary,
    secondary: raw?.secondary ?? defaults.secondary,
    accent: raw?.accent ?? defaults.accent,
    background: raw?.background ?? defaults.background ?? "#f8fafc",
    text: raw?.text ?? defaults.text ?? "#0f172a",
  };
}

export function resolveBrandFonts(brand: InstagramBrandConfig): BrandFonts {
  const raw = brand.brandFonts as BrandFonts | null;
  return {
    heading: raw?.heading ?? DEFAULT_BRAND_FONTS.heading,
    body: raw?.body ?? DEFAULT_BRAND_FONTS.body,
  };
}

export function resolveArtTemplate(brand: InstagramBrandConfig): ArtTemplateId {
  const t = brand.artTemplateSet as ArtTemplateId;
  if (t && t in ART_TEMPLATE_LABELS) return t;
  return "carousel";
}
