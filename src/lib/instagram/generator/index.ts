import type { IgContentType } from "@prisma/client";
import type { BrandContext, GeneratedIdea } from "@/lib/instagram/types";
import { generateCaptions } from "./captions";
import { critiqueFromIdea, formatCritiqueText } from "./critique";
import { getBrandContextWithServices } from "./context";
import { generateIdeas } from "./ideas";
import { generateWeeklyCalendar } from "./calendar";

export { getBrandContext, getBrandContextWithServices } from "./context";
export { generateIdeas, generateIdea } from "./ideas";
export { generateWeeklyCalendar } from "./calendar";
export { generateCaptions } from "./captions";
export { critiquePost, critiqueFromIdea, formatCritiqueText } from "./critique";
export type FullGeneration = {
  idea: GeneratedIdea;
  captions: ReturnType<typeof generateCaptions>;
  critique: ReturnType<typeof critiqueFromIdea>;
  critiqueText: string;
};

export async function requireBrand(): Promise<BrandContext> {
  const brand = await getBrandContextWithServices();
  if (!brand) throw new Error("Configure a marca em /admin/instagram/marca antes de gerar conteúdo.");
  return brand;
}

export function generateFullContent(brand: BrandContext, idea: GeneratedIdea): FullGeneration {
  const captions = generateCaptions({ brand, idea, title: idea.title });
  const critique = critiqueFromIdea(brand, idea, captions);
  return {
    idea,
    captions,
    critique,
    critiqueText: formatCritiqueText(critique),
  };
}

export async function generateIdeasBatch(count: number, contentType?: IgContentType) {
  const brand = await requireBrand();
  return generateIdeas(brand, count, contentType);
}

export async function generateWeekPlan(weekStart?: Date) {
  const brand = await requireBrand();
  return generateWeeklyCalendar(brand, weekStart);
}
