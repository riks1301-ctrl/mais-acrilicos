import { parseCommercialScore } from "@/lib/instagram/approval/utils";
import { hybridScore, performanceScoreFromRate, scoreDelta } from "./compute";
import type { HybridScoreResult, PublicMetricSnapshotRow } from "./types";

export function buildHybridScoreResult(
  critiqueNotes: string | null,
  latestMetric: PublicMetricSnapshotRow | null,
  accountAvgEngagementRate: number | null
): HybridScoreResult {
  const predictedScore = parseCommercialScore(critiqueNotes);
  const performanceScore = latestMetric?.engagementRate != null
    ? performanceScoreFromRate(latestMetric.engagementRate, accountAvgEngagementRate)
    : null;

  const hybrid = hybridScore(predictedScore, performanceScore);
  const delta = scoreDelta(predictedScore, performanceScore);

  let interpretation = "Sem dados suficientes para comparar previsão e realidade.";
  if (predictedScore != null && performanceScore != null) {
    if (delta != null && delta > 15) {
      interpretation = "Desempenho real superou a previsão — o critério comercial pode estar conservador para este tipo de post.";
    } else if (delta != null && delta < -15) {
      interpretation = "Score comercial alto, mas desempenho baixo — revisar gancho, visual ou CTA.";
    } else {
      interpretation = "Previsão e desempenho alinhados — continue refinando com mais amostras.";
    }
  } else if (predictedScore != null) {
    interpretation = "Apenas score previsto disponível — sincronize métricas após publicação.";
  }

  return {
    predictedScore,
    performanceScore,
    hybridScore: hybrid,
    scoreDelta: delta,
    interpretation,
  };
}
