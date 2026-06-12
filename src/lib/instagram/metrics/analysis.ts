import { IG_CONTENT_TYPE_LABELS, IG_FORMAT_LABELS } from "@/lib/instagram/constants";
import { parseCommercialScore } from "@/lib/instagram/approval/utils";
import {
  detectCtaType,
  detectVisualBucket,
  publishedHourBucket,
} from "./compute";
import type {
  LearningInsight,
  PerformanceAnalysis,
  PostWithMetricsContext,
  RankingItem,
} from "./types";

function latestMetric(post: PostWithMetricsContext) {
  return post.metrics[0] ?? null;
}

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => n != null && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

function buildRanking(
  posts: PostWithMetricsContext[],
  keyFn: (p: PostWithMetricsContext) => string,
  labelFn: (key: string) => string
): RankingItem[] {
  const groups = new Map<string, PostWithMetricsContext[]>();
  for (const p of posts) {
    const key = keyFn(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      label: labelFn(key),
      count: items.length,
      avgReach: avg(items.map((p) => latestMetric(p)?.reach)),
      avgEngagementRate: avg(items.map((p) => latestMetric(p)?.engagementRate)),
      avgPerformanceScore: avg(items.map((p) => p.performanceScore)),
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => (b.avgEngagementRate ?? 0) - (a.avgEngagementRate ?? 0));
}

export function analyzePerformance(posts: PostWithMetricsContext[]): PerformanceAnalysis {
  const published = posts.filter((p) => p.status === "PUBLISHED");
  const withMetrics = published.filter((p) => p.metrics.length > 0);

  const scored = withMetrics
    .map((p) => ({
      id: p.id,
      title: p.title,
      performanceScore: p.performanceScore,
      engagementRate: latestMetric(p)?.engagementRate ?? null,
    }))
    .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0));

  const insights: LearningInsight[] = [];

  const formatRank = buildRanking(withMetrics, (p) => p.format, (k) => IG_FORMAT_LABELS[k as keyof typeof IG_FORMAT_LABELS] ?? k);
  const personaRank = buildRanking(
    withMetrics,
    (p) => p.contentType ?? "geral",
    (k) => IG_CONTENT_TYPE_LABELS[k as keyof typeof IG_CONTENT_TYPE_LABELS] ?? k
  );
  const serviceRank = buildRanking(
    withMetrics,
    (p) => p.postImages[0]?.image?.service?.name ?? p.postImages[0]?.image?.serviceId ?? "sem_servico",
    (k) => (k === "sem_servico" ? "Sem serviço" : k)
  );
  const ctaRank = buildRanking(withMetrics, (p) => detectCtaType(p.finalCta, p.finalCaption), (k) => {
    const labels: Record<string, string> = {
      whatsapp: "WhatsApp",
      link: "Link",
      orcamento: "Orçamento",
      generico: "Genérico",
    };
    return labels[k] ?? k;
  });
  const hourRank = buildRanking(
    withMetrics,
    (p) => publishedHourBucket(p.publishedAt),
    (k) => k
  );
  const visualRank = buildRanking(withMetrics, detectVisualBucket, (k) => {
    const labels: Record<string, string> = {
      foto_real: "Foto real",
      mockup: "Mockup/conceito",
      ia_mockup: "IA / mockup",
      sem_visual: "Sem visual",
      outro: "Outro",
    };
    return labels[k] ?? k;
  });
  const budgetRank = buildRanking(
    withMetrics.filter((p) => detectCtaType(p.finalCta, p.finalCaption) === "whatsapp"),
    (p) => p.contentType ?? "geral",
    (k) => IG_CONTENT_TYPE_LABELS[k as keyof typeof IG_CONTENT_TYPE_LABELS] ?? k
  );

  if (formatRank.length >= 2) {
    const best = formatRank[0];
    const worst = formatRank[formatRank.length - 1];
    if ((best.avgEngagementRate ?? 0) > (worst.avgEngagementRate ?? 0) + 0.5) {
      insights.push({
        id: "format-gap",
        category: "format",
        severity: "positive",
        title: `${best.label} performa melhor que ${worst.label}`,
        detail: `Engajamento médio ${best.avgEngagementRate ?? "—"}% vs ${worst.avgEngagementRate ?? "—"}%.`,
        evidence: `${best.count} posts analisados`,
      });
    }
  }

  if (visualRank.length >= 2) {
    const real = visualRank.find((r) => r.key === "foto_real");
    const mock = visualRank.find((r) => r.key === "mockup" || r.key === "ia_mockup");
    if (real && mock && (real.avgEngagementRate ?? 0) > (mock.avgEngagementRate ?? 0)) {
      insights.push({
        id: "visual-real",
        category: "visual",
        severity: "positive",
        title: "Fotos reais superam mockups",
        detail: `Foto real: ${real.avgEngagementRate ?? "—"}% vs mockup: ${mock.avgEngagementRate ?? "—"}%.`,
      });
    }
  }

  if (ctaRank[0]?.key === "whatsapp") {
    insights.push({
      id: "cta-whatsapp",
      category: "cta",
      severity: "positive",
      title: "CTA WhatsApp lidera engajamento",
      detail: `Média ${ctaRank[0].avgEngagementRate ?? "—"}% nos posts com wa.me/WhatsApp.`,
    });
  }

  if (hourRank[0]) {
    insights.push({
      id: "timing-best",
      category: "timing",
      severity: "info",
      title: `Melhor faixa horária: ${hourRank[0].label}`,
      detail: `Engajamento médio ${hourRank[0].avgEngagementRate ?? "—"}% nesta faixa.`,
    });
  }

  for (const p of withMetrics) {
    const predicted = parseCommercialScore(p.critiqueNotes);
    if (predicted != null && p.performanceScore != null && predicted - p.performanceScore > 20) {
      insights.push({
        id: `gap-${p.id}`,
        category: "score_gap",
        severity: "warning",
        title: "Previsão alta, desempenho baixo",
        detail: `"${p.title}": previsto ${predicted}, real ${p.performanceScore}.`,
        evidence: p.id,
      });
    }
  }

  const themes = buildRanking(withMetrics, (p) => p.contentType ?? "geral", (k) => IG_CONTENT_TYPE_LABELS[k as keyof typeof IG_CONTENT_TYPE_LABELS] ?? k);
  const weak = themes.filter((t) => (t.avgEngagementRate ?? 100) < 2 && t.count >= 2);
  for (const t of weak) {
    insights.push({
      id: `avoid-${t.key}`,
      category: "theme",
      severity: "warning",
      title: `Evitar repetir: ${t.label}`,
      detail: `Engajamento médio baixo (${t.avgEngagementRate ?? "—"}%) em ${t.count} posts.`,
    });
  }

  const strong = themes.filter((t) => (t.avgEngagementRate ?? 0) >= 4);
  for (const t of strong.slice(0, 2)) {
    insights.push({
      id: `repeat-${t.key}`,
      category: "theme",
      severity: "positive",
      title: `Repita: ${t.label}`,
      detail: `Engajamento médio ${t.avgEngagementRate ?? "—"}% — vale campanha própria.`,
    });
  }

  const lowDataWarning =
    withMetrics.length < 3
      ? "Poucos posts com métricas — recomendações são indicativas. Sincronize pelo menos 3 publicações antes de decisões fortes."
      : withMetrics.length < 8
        ? "Amostra pequena — use rankings como tendência, não como regra absoluta."
        : null;

  return {
    publishedCount: published.length,
    withMetricsCount: withMetrics.length,
    lowDataWarning,
    bestPost: scored[0] ?? null,
    worstPost: scored.length > 1 ? scored[scored.length - 1] : null,
    avgReach: avg(withMetrics.map((p) => latestMetric(p)?.reach)),
    avgEngagementRate: avg(withMetrics.map((p) => latestMetric(p)?.engagementRate)),
    rankings: {
      format: formatRank,
      persona: personaRank,
      service: serviceRank,
      cta: ctaRank,
      hour: hourRank,
      visualSource: visualRank,
      budgetIntent: budgetRank,
    },
    insights,
    analyzedAt: new Date().toISOString(),
  };
}
