import { envAutoPublishEnabled, loadMetaConfig } from "@/lib/instagram/meta/config";
import { prisma } from "@/lib/prisma";

export type SetupStep = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  hint: string;
};

export type AgentStatus = {
  overall: "setup" | "ready" | "active" | "attention";
  overallLabel: string;
  nextStep: { label: string; href: string; reason: string };
  setupSteps: SetupStep[];
  alerts: { severity: "critical" | "warning" | "info"; message: string }[];
  stats: {
    pendingApproval: number;
    scheduled: number;
    published: number;
    withMetrics: number;
    imagesAvailable: number;
  };
  meta: {
    connected: boolean;
    mode: string;
    autoPublish: boolean;
    envAutoPublish: boolean;
  };
};

export async function getAgentStatus(): Promise<AgentStatus> {
  const brand = await prisma.instagramBrandConfig.findFirst({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  const config = await loadMetaConfig();
  const brandId = brand?.id;

  const [pendingApproval, scheduled, published, imagesAvailable, publishedWithMediaId, withMetrics] =
    await Promise.all([
      brandId ? prisma.instagramPost.count({ where: { brandConfigId: brandId, status: "PENDING_APPROVAL" } }) : 0,
      brandId ? prisma.instagramPost.count({ where: { brandConfigId: brandId, status: "SCHEDULED" } }) : 0,
      brandId ? prisma.instagramPost.count({ where: { brandConfigId: brandId, status: "PUBLISHED" } }) : 0,
      brandId ? prisma.instagramImage.count({ where: { brandConfigId: brandId, status: "AVAILABLE" } }) : 0,
      brandId
        ? prisma.instagramPost.count({ where: { brandConfigId: brandId, status: "PUBLISHED", instagramMediaId: { not: null } } })
        : 0,
      brandId
        ? prisma.instagramPost.count({
            where: { brandConfigId: brandId, status: "PUBLISHED", metrics: { some: {} } },
          })
        : 0,
    ]);

  const setupSteps: SetupStep[] = [
    { id: "brand", label: "Configurar marca", done: !!brand, href: "/admin/instagram/marca", hint: "Tom, CTA, WhatsApp e hashtags" },
    {
      id: "ideas",
      label: "Gerar primeiro post",
      done: (brand?._count.posts ?? 0) > 0,
      href: "/admin/instagram/posts",
      hint: "Ideias + legendas A/B",
    },
    {
      id: "images",
      label: "Subir foto real",
      done: imagesAvailable > 0,
      href: "/admin/instagram/imagens/upload",
      hint: "Biblioteca com imagem AVAILABLE",
    },
    {
      id: "approve",
      label: "Aprovar na fila",
      done: published > 0 || scheduled > 0,
      href: "/admin/instagram/aprovacao",
      hint: "Legenda final + aprovação manual",
    },
    {
      id: "meta",
      label: "Conectar Meta (modo TESTE)",
      done: brand?.metaConnected ?? false,
      href: "/admin/instagram/meta",
      hint: "Validar token sem publicar",
    },
    {
      id: "publish",
      label: "Publicar 1º post via API",
      done: publishedWithMediaId > 0,
      href: "/admin/instagram/aprovacao",
      hint: "Feed + imagem HTTPS + modo ATIVO",
    },
    {
      id: "metrics",
      label: "Sincronizar métricas",
      done: withMetrics > 0,
      href: "/admin/instagram/performance",
      hint: "Aprendizado e recomendações",
    },
  ];

  const alerts: AgentStatus["alerts"] = [];
  if (!brand) alerts.push({ severity: "warning", message: "Marca não configurada — comece em Marca." });
  if (config.tokenExpiresAt && config.tokenExpiresAt < new Date(Date.now() + 14 * 86400000)) {
    alerts.push({ severity: "critical", message: "Token Meta expira em breve — renove em Meta API." });
  }
  if (brand?.metaLastError) {
    alerts.push({ severity: "warning", message: `Último erro Meta: ${brand.metaLastError}` });
  }
  if (pendingApproval > 0) {
    alerts.push({ severity: "info", message: `${pendingApproval} post(s) aguardando sua aprovação.` });
  }
  if (scheduled > 0 && !envAutoPublishEnabled()) {
    alerts.push({
      severity: "info",
      message: `${scheduled} agendado(s) na fila interna — auto publish está DESLIGADO (seguro).`,
    });
  }
  if (publishedWithMediaId > withMetrics) {
    alerts.push({ severity: "info", message: "Posts publicados sem métricas — sincronize em Performance." });
  }

  const doneCount = setupSteps.filter((s) => s.done).length;
  let overall: AgentStatus["overall"] = "setup";
  let overallLabel = "Em configuração";
  if (doneCount >= 7) {
    overall = "active";
    overallLabel = "Agente ativo";
  } else if (doneCount >= 4) {
    overall = "ready";
    overallLabel = "Quase pronto";
  } else if (alerts.some((a) => a.severity === "critical")) {
    overall = "attention";
    overallLabel = "Atenção necessária";
  }

  const next = setupSteps.find((s) => !s.done);

  return {
    overall,
    overallLabel,
    nextStep: next
      ? { label: next.label, href: next.href, reason: next.hint }
      : { label: "Ver performance", href: "/admin/instagram/performance", reason: "Acompanhe resultados e recomendações" },
    setupSteps,
    alerts,
    stats: { pendingApproval, scheduled, published, withMetrics, imagesAvailable },
    meta: {
      connected: brand?.metaConnected ?? false,
      mode: config.mode,
      autoPublish: config.autoPublish,
      envAutoPublish: envAutoPublishEnabled(),
    },
  };
}
