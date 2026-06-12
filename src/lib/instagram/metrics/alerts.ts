import { prisma } from "@/lib/prisma";
import { loadMetaConfig } from "@/lib/instagram/meta/config";
import type { PerformanceAlert } from "./types";

const TOKEN_WARN_DAYS = 14;
const METRICS_STALE_HOURS = 72;
const LOW_ENGAGEMENT_THRESHOLD = 1.5;
const HIGH_ENGAGEMENT_THRESHOLD = 6;

export async function generateAlerts(): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [];
  const now = new Date();

  const config = await loadMetaConfig();
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

  if (config.tokenExpiresAt) {
    const daysLeft = (config.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= TOKEN_WARN_DAYS) {
      alerts.push({
        id: "alert-token-expiring",
        type: "token_expiring",
        severity: daysLeft <= 3 ? "critical" : "warning",
        title: "Token Meta expirando",
        message: `Token expira em ${Math.max(0, Math.ceil(daysLeft))} dia(s). Renove em /admin/instagram/meta.`,
        createdAt: now.toISOString(),
      });
    }
  }

  if (brand?.metaLastError) {
    alerts.push({
      id: "alert-meta-error",
      type: "sync_failed",
      severity: "warning",
      title: "Falha recente na Meta",
      message: brand.metaLastError,
      createdAt: (brand.metaLastValidatedAt ?? now).toISOString(),
    });
  }

  const overdueScheduled = await prisma.instagramPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: now },
    },
    take: 10,
    select: { id: true, title: true, scheduledFor: true },
  });

  for (const post of overdueScheduled) {
    alerts.push({
      id: `alert-scheduled-${post.id}`,
      type: "scheduled_not_published",
      severity: "warning",
      title: "Post agendado não publicado",
      message: `"${post.title}" deveria ter sido publicado em ${post.scheduledFor?.toLocaleString("pt-BR")}.`,
      postId: post.id,
      createdAt: now.toISOString(),
    });
  }

  const publishedNoMetrics = await prisma.instagramPost.findMany({
    where: {
      status: "PUBLISHED",
      instagramMediaId: { not: null },
      metrics: { none: {} },
    },
    take: 10,
    select: { id: true, title: true },
  });

  for (const post of publishedNoMetrics) {
    alerts.push({
      id: `alert-no-metrics-${post.id}`,
      type: "no_metrics",
      severity: "info",
      title: "Publicado sem métricas",
      message: `"${post.title}" ainda não tem métricas sincronizadas.`,
      postId: post.id,
      createdAt: now.toISOString(),
    });
  }

  const staleMetrics = await prisma.instagramPost.findMany({
    where: {
      status: "PUBLISHED",
      instagramMediaId: { not: null },
      OR: [
        { lastMetricsSyncAt: null },
        { lastMetricsSyncAt: { lte: new Date(now.getTime() - METRICS_STALE_HOURS * 60 * 60 * 1000) } },
      ],
    },
    take: 5,
    select: { id: true, title: true },
  });

  for (const post of staleMetrics) {
    if (!alerts.some((a) => a.postId === post.id && a.type === "no_metrics")) {
      alerts.push({
        id: `alert-stale-${post.id}`,
        type: "sync_failed",
        severity: "info",
        title: "Métricas desatualizadas",
        message: `Sincronize novamente as métricas de "${post.title}".`,
        postId: post.id,
        createdAt: now.toISOString(),
      });
    }
  }

  const postsWithMetrics = await prisma.instagramPost.findMany({
    where: { status: "PUBLISHED", performanceScore: { not: null } },
    include: { metrics: { orderBy: { collectedAt: "desc" }, take: 1 } },
    take: 50,
  });

  for (const post of postsWithMetrics) {
    const rate = post.metrics[0]?.engagementRate;
    if (rate != null && rate < LOW_ENGAGEMENT_THRESHOLD) {
      alerts.push({
        id: `alert-low-${post.id}`,
        type: "low_performance",
        severity: "warning",
        title: "Baixo desempenho",
        message: `"${post.title}": engajamento ${rate}% abaixo do esperado.`,
        postId: post.id,
        createdAt: now.toISOString(),
      });
    }
    if (rate != null && rate >= HIGH_ENGAGEMENT_THRESHOLD) {
      alerts.push({
        id: `alert-high-${post.id}`,
        type: "high_performance",
        severity: "success",
        title: "Alto desempenho",
        message: `"${post.title}": engajamento ${rate}% — considere repetir o formato.`,
        postId: post.id,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2, success: 3 };
    return sev[a.severity] - sev[b.severity];
  });
}
