import type { MetricSnapshot } from "./types";

export function sumEngagement(parts: {
  likes?: number | null;
  comments?: number | null;
  saves?: number | null;
  shares?: number | null;
}): number | null {
  const values = [parts.likes, parts.comments, parts.saves, parts.shares];
  if (values.every((v) => v == null)) return null;
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

export function computeEngagementRate(totalEngagement: number | null, reach: number | null): number | null {
  if (totalEngagement == null || reach == null || reach <= 0) return null;
  return Math.round((totalEngagement / reach) * 10000) / 100;
}

export function finalizeSnapshot(partial: Omit<MetricSnapshot, "totalEngagement" | "engagementRate">): MetricSnapshot {
  const totalEngagement = sumEngagement(partial);
  const engagementRate = computeEngagementRate(totalEngagement, partial.reach);
  return { ...partial, totalEngagement, engagementRate };
}

/** Normaliza engajamento em score 0–100 vs média da conta. */
export function performanceScoreFromRate(rate: number | null, accountAvg: number | null): number | null {
  if (rate == null) return null;
  const baseline = accountAvg && accountAvg > 0 ? accountAvg : 3;
  const ratio = rate / baseline;
  const score = Math.min(100, Math.max(0, Math.round(50 + (ratio - 1) * 35)));
  return score;
}

export function hybridScore(predicted: number | null, performance: number | null): number | null {
  if (predicted == null && performance == null) return null;
  if (predicted == null) return performance;
  if (performance == null) return predicted;
  return Math.round(predicted * 0.4 + performance * 0.6);
}

export function scoreDelta(predicted: number | null, performance: number | null): number | null {
  if (predicted == null || performance == null) return null;
  return Math.round((performance - predicted) * 10) / 10;
}

export function detectCtaType(cta: string | null, caption: string | null): string {
  const text = `${cta ?? ""} ${caption ?? ""}`.toLowerCase();
  if (/wa\.me|whatsapp|api\.whatsapp/.test(text)) return "whatsapp";
  if (/http|www\.|link|clique|acesse/.test(text)) return "link";
  if (/orçamento|orcamento|fale conosco|dm|direct/.test(text)) return "orcamento";
  return "generico";
}

export function detectVisualBucket(post: {
  visualSource: string | null;
  postImages: { image: { isRealPhoto: boolean; imageType: string } }[];
}): string {
  if (post.visualSource === "REAL") return "foto_real";
  if (post.visualSource === "AI") return "ia_mockup";
  if (post.visualSource === "MOCKUP") return "mockup";
  const cover = post.postImages[0]?.image;
  if (!cover) return "sem_visual";
  if (cover.isRealPhoto || cover.imageType === "REAL") return "foto_real";
  if (cover.imageType === "CONCEPT" || cover.imageType === "MOCKUP") return "mockup";
  return "outro";
}

export function publishedHourBucket(date: Date | null): string {
  if (!date) return "desconhecido";
  const h = date.getHours();
  if (h < 6) return "madrugada";
  if (h < 12) return "manhã";
  if (h < 18) return "tarde";
  return "noite";
}
