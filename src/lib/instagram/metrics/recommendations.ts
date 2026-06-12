import { IG_CONTENT_TYPE_LABELS } from "@/lib/instagram/constants";
import type { AgentRecommendation, PerformanceAnalysis } from "./types";

export function generateRecommendations(analysis: PerformanceAnalysis): AgentRecommendation[] {
  if (analysis.withMetricsCount < 3) {
    return [
      {
        id: "rec-low-data",
        type: "repeat",
        priority: "low",
        message: "Sincronize métricas de pelo menos 3 posts antes de decisões automáticas",
        rationale: analysis.lowDataWarning ?? "Amostra insuficiente para recomendações confiáveis.",
      },
    ];
  }

  const recs: AgentRecommendation[] = [];

  for (const insight of analysis.insights) {
    if (insight.category === "theme" && insight.severity === "positive") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "repeat",
        priority: "high",
        message: insight.title.replace("Repita: ", "Repita esse tipo de post: "),
        rationale: insight.detail,
      });
    }
    if (insight.category === "theme" && insight.severity === "warning") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "avoid",
        priority: "medium",
        message: insight.title.replace("Evitar repetir: ", "Evite esse tipo de legenda/tema: "),
        rationale: insight.detail,
      });
    }
    if (insight.category === "visual" && insight.severity === "positive") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "visual",
        priority: "high",
        message: "Use mais fotos reais de obra e produto pronto",
        rationale: insight.detail,
      });
    }
    if (insight.category === "cta") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "cta",
        priority: "high",
        message: "Este CTA (WhatsApp) gerou mais ação — mantenha wa.me nas legendas",
        rationale: insight.detail,
      });
    }
    if (insight.category === "timing") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "timing",
        priority: "medium",
        message: `Melhor horário detectado: ${insight.title.replace("Melhor faixa horária: ", "")}`,
        rationale: insight.detail,
      });
    }
    if (insight.category === "score_gap") {
      recs.push({
        id: `rec-${insight.id}`,
        type: "score_review",
        priority: "high",
        message: "Post com score alto e desempenho baixo — revisar critério comercial",
        rationale: insight.detail,
        postId: insight.evidence,
      });
    }
  }

  const topService = analysis.rankings.service[0];
  if (topService && topService.key !== "sem_servico" && (topService.avgEngagementRate ?? 0) > 3) {
    recs.push({
      id: "rec-service-campaign",
      type: "campaign",
      priority: "medium",
      message: `Serviço "${topService.label}" merece campanha própria`,
      rationale: `Engajamento médio ${topService.avgEngagementRate}% em ${topService.count} posts.`,
    });
  }

  const carousel = analysis.rankings.format.find((r) => r.key === "CAROUSEL");
  const feed = analysis.rankings.format.find((r) => r.key === "FEED");
  if (carousel && feed && carousel.count > 0 && feed.count > 0) {
    const msg =
      (carousel.avgEngagementRate ?? 0) > (feed.avgEngagementRate ?? 0)
        ? "Carrossel performa melhor que imagem única nesta conta"
        : "Imagem única performa melhor que carrossel nesta conta";
    recs.push({
      id: "rec-format-compare",
      type: "repeat",
      priority: "low",
      message: msg,
      rationale: `Carrossel ${carousel.avgEngagementRate ?? "—"}% vs Feed ${feed.avgEngagementRate ?? "—"}%.`,
    });
  }

  const topPersona = analysis.rankings.persona[0];
  if (topPersona && topPersona.key !== "geral") {
    recs.push({
      id: "rec-persona",
      type: "repeat",
      priority: "medium",
      message: `Priorize conteúdo tipo "${IG_CONTENT_TYPE_LABELS[topPersona.key as keyof typeof IG_CONTENT_TYPE_LABELS] ?? topPersona.label}"`,
      rationale: `Melhor engajamento médio (${topPersona.avgEngagementRate ?? "—"}%).`,
    });
  }

  return recs.slice(0, 12);
}
