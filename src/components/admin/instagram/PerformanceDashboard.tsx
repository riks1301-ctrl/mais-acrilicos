"use client";

import { AlertCard } from "@/components/admin/instagram/AlertCard";
import { LearningInsights } from "@/components/admin/instagram/LearningInsights";
import { MetricsTable } from "@/components/admin/instagram/MetricsTable";
import { RecommendationCard } from "@/components/admin/instagram/RecommendationCard";
import type { AgentRecommendation, PerformanceAlert, PerformanceAnalysis } from "@/lib/instagram/metrics/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DashboardData = PerformanceAnalysis & {
  lowDataWarning?: string | null;
  posts: {
    id: string;
    title: string;
    format: string;
    publishedAt: string | null;
    performanceScore: number | null;
    hybridScore: number | null;
    latestMetric: { reach: number | null; impressions: number | null; likes: number | null; comments: number | null; saves: number | null; shares: number | null; engagementRate: number | null; profileVisits: number | null; linkClicks: number | null; whatsappClicks: number | null; collectedAt: string } | null;
  }[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RankingList({ title, items }: { title: string; items: { label: string; avgEngagementRate: number | null; count: number }[] }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {items.slice(0, 5).map((r) => (
          <li key={r.label} className="flex justify-between gap-2">
            <span className="text-slate-700">{r.label}</span>
            <span className="text-slate-500">{r.avgEngagementRate ?? "—"}% ({r.count})</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-slate-400">Sem dados</li>}
      </ul>
    </div>
  );
}

export function PerformanceDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [dashRes, alertRes, recRes] = await Promise.all([
      fetch("/api/admin/instagram/performance/dashboard"),
      fetch("/api/admin/instagram/performance/alerts"),
      fetch("/api/admin/instagram/performance/recommendations"),
    ]);
    if (dashRes.ok) setDashboard(await dashRes.json());
    if (alertRes.ok) setAlerts(await alertRes.json());
    if (recRes.ok) setRecommendations(await recRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function syncAll() {
    setSyncing(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/metrics/sync?limit=10", { method: "POST" });
    const data = await res.json();
    setSyncing(false);
    setMessage(res.ok ? `Sincronizados: ${data.synced?.length ?? 0}, falhas: ${data.failed?.length ?? 0}` : data.error);
    load();
  }

  async function seedDemo() {
    if (!confirm("Gerar métricas demo? Requer INSTAGRAM_METRICS_DEMO=true")) return;
    const res = await fetch("/api/admin/instagram/metrics/seed-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Demo: ${data.synced?.length} posts` : data.error);
    load();
  }

  if (loading) return <p className="text-slate-500">Carregando performance...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={syncAll} disabled={syncing} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          {syncing ? "Sincronizando..." : "Sincronizar métricas (Meta)"}
        </button>
        <button type="button" onClick={seedDemo} className="rounded-xl border px-4 py-2 text-sm font-semibold">
          Carregar demo (dev)
        </button>
      </div>
      {message && <p className="text-sm text-slate-700">{message}</p>}

      {dashboard?.lowDataWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dashboard.lowDataWarning}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Publicados" value={String(dashboard?.publishedCount ?? 0)} />
        <Stat label="Com métricas" value={String(dashboard?.withMetricsCount ?? 0)} />
        <Stat label="Alcance médio" value={dashboard?.avgReach != null ? dashboard.avgReach.toLocaleString("pt-BR") : "—"} />
        <Stat label="Engajamento médio" value={dashboard?.avgEngagementRate != null ? `${dashboard.avgEngagementRate}%` : "—"} />
      </div>

      {(dashboard?.bestPost || dashboard?.worstPost) && (
        <div className="grid gap-4 md:grid-cols-2">
          {dashboard.bestPost && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-bold text-green-800">Melhor post</p>
              <Link href={`/admin/instagram/posts/${dashboard.bestPost.id}`} className="font-bold text-green-900 hover:underline">
                {dashboard.bestPost.title}
              </Link>
              <p className="text-sm text-green-800">Score {dashboard.bestPost.performanceScore ?? "—"} · {dashboard.bestPost.engagementRate ?? "—"}%</p>
            </div>
          )}
          {dashboard.worstPost && dashboard.worstPost.id !== dashboard.bestPost?.id && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-800">Pior post</p>
              <Link href={`/admin/instagram/posts/${dashboard.worstPost.id}`} className="font-bold text-red-900 hover:underline">
                {dashboard.worstPost.title}
              </Link>
              <p className="text-sm text-red-800">Score {dashboard.worstPost.performanceScore ?? "—"} · {dashboard.worstPost.engagementRate ?? "—"}%</p>
            </div>
          )}
        </div>
      )}

      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Alertas</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {alerts.slice(0, 6).map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Posts publicados</h2>
        <MetricsTable rows={dashboard?.posts ?? []} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankingList title="Por formato" items={dashboard?.rankings.format ?? []} />
        <RankingList title="Por persona/tipo" items={dashboard?.rankings.persona ?? []} />
        <RankingList title="Por serviço" items={dashboard?.rankings.service ?? []} />
        <RankingList title="Por CTA" items={dashboard?.rankings.cta ?? []} />
        <RankingList title="Melhores horários" items={dashboard?.rankings.hour ?? []} />
        <RankingList title="Intenção orçamento (CTA WhatsApp)" items={dashboard?.rankings.budgetIntent ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Aprendizados automáticos</h2>
        <LearningInsights insights={dashboard?.insights ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Recomendações do agente</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">Colete métricas para gerar recomendações.</p>
          ) : (
            recommendations.map((r) => <RecommendationCard key={r.id} rec={r} />)
          )}
        </div>
      </section>
    </div>
  );
}
