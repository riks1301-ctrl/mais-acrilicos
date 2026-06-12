import type { IgContentType, IgPostFormat, IgVisualSource } from "@prisma/client";

export type MetricSnapshot = {
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  profileVisits: number | null;
  linkClicks: number | null;
  whatsappClicks: number | null;
  leads: number | null;
  totalEngagement: number | null;
  engagementRate: number | null;
  unavailableMetrics: string[];
  rawInsights: Record<string, unknown>;
};

export type PostWithMetricsContext = {
  id: string;
  title: string;
  format: IgPostFormat;
  contentType: IgContentType | null;
  status: string;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  finalCta: string | null;
  finalCaption: string | null;
  critiqueNotes: string | null;
  visualSource: IgVisualSource | null;
  instagramMediaId: string | null;
  performanceScore: number | null;
  hybridScore: number | null;
  scoreDelta: number | null;
  lastMetricsSyncAt: Date | null;
  postImages: { image: { serviceId: string | null; service?: { name: string } | null; isRealPhoto: boolean; imageType: string } }[];
  metrics: PublicMetricSnapshotRow[];
};

export type MetricSnapshotRow = MetricSnapshot & {
  id: string;
  collectedAt: Date;
  source: string;
};

/** Métrica exposta na API (sem rawInsights da Meta). */
export type PublicMetricSnapshotRow = Omit<MetricSnapshotRow, "rawInsights">;

export type RankingItem = {
  key: string;
  label: string;
  count: number;
  avgReach: number | null;
  avgEngagementRate: number | null;
  avgPerformanceScore: number | null;
};

export type PerformanceAnalysis = {
  publishedCount: number;
  withMetricsCount: number;
  lowDataWarning: string | null;
  bestPost: { id: string; title: string; performanceScore: number | null; engagementRate: number | null } | null;
  worstPost: { id: string; title: string; performanceScore: number | null; engagementRate: number | null } | null;
  avgReach: number | null;
  avgEngagementRate: number | null;
  rankings: {
    format: RankingItem[];
    persona: RankingItem[];
    service: RankingItem[];
    cta: RankingItem[];
    hour: RankingItem[];
    visualSource: RankingItem[];
    budgetIntent: RankingItem[];
  };
  insights: LearningInsight[];
  analyzedAt: string;
};

export type LearningInsight = {
  id: string;
  category: "format" | "persona" | "service" | "cta" | "timing" | "visual" | "score_gap" | "theme";
  severity: "info" | "positive" | "warning";
  title: string;
  detail: string;
  evidence?: string;
};

export type AgentRecommendation = {
  id: string;
  type: "repeat" | "avoid" | "visual" | "cta" | "timing" | "campaign" | "score_review";
  priority: "high" | "medium" | "low";
  message: string;
  rationale: string;
  postId?: string;
};

export type PerformanceAlert = {
  id: string;
  type: "token_expiring" | "sync_failed" | "scheduled_not_published" | "no_metrics" | "low_performance" | "high_performance";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  postId?: string;
  createdAt: string;
};

export type HybridScoreResult = {
  predictedScore: number | null;
  performanceScore: number | null;
  hybridScore: number | null;
  scoreDelta: number | null;
  interpretation: string;
};

export type SyncResult = {
  ok: boolean;
  synced: string[];
  skipped: { id: string; reason: string }[];
  failed: { id: string; error: string }[];
  processed: number;
};
