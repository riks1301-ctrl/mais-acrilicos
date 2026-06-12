import type { ArtTemplateId, BrandColors } from "./types";

type TemplateStyle = {
  overlayOpacity: number;
  headlineColor: string;
  bodyColor: string;
  accentBar: boolean;
  gradientAngle: number;
};

export function templateStyleForSlide(slideType: string, templateId: ArtTemplateId, colors: BrandColors): TemplateStyle {
  const base: TemplateStyle = {
    overlayOpacity: 0.72,
    headlineColor: "#ffffff",
    bodyColor: "#e2e8f0",
    accentBar: true,
    gradientAngle: 135,
  };

  if (templateId === "oferta" || slideType === "cta") {
    return { ...base, overlayOpacity: 0.8, accentBar: true, gradientAngle: 90 };
  }
  if (templateId === "bastidores" || slideType === "example") {
    return { ...base, overlayOpacity: 0.65, bodyColor: "#f1f5f9", gradientAngle: 160 };
  }
  if (templateId === "institucional" || slideType === "solution") {
    return { ...base, headlineColor: colors.text ?? "#0f172a", bodyColor: "#334155", overlayOpacity: 0.55 };
  }
  return base;
}

export function gradientStops(templateId: ArtTemplateId, colors: BrandColors, slideType: string): [string, string] {
  if (slideType === "cta" || templateId === "oferta") {
    return [colors.accent, colors.primary];
  }
  if (templateId === "bastidores") {
    return ["#1e293b", colors.primary];
  }
  if (templateId === "institucional") {
    return [colors.background ?? "#f8fafc", colors.secondary];
  }
  return [colors.primary, colors.secondary];
}
