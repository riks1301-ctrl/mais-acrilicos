"use client";

import { RecommendationCard } from "@/components/admin/instagram/RecommendationCard";
import type { AgentRecommendation, HybridScoreResult, MetricSnapshotRow } from "@/lib/instagram/metrics/types";
import { useCallback, useEffect, useState } from "react";

type PostMetricsResponse = {
  metrics: MetricSnapshotRow[];
  hybrid: HybridScoreResult;
  recommendations: AgentRecommendation[];
  post: { lastMetricsSyncAt: string | null; instagramMediaId: string | null };
};

function MetricCell({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value != null ? value.toLocaleString("pt-BR") : "indisponível"}</p>
    </div>
  );
}

export function PostPerformancePanel({ postId, status }: { postId: string; status: string }) {
  const [data, setData] = useState<PostMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status !== "PUBLISHED") {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/admin/instagram/metrics/posts/${postId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [postId, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncMetrics() {
    setSyncing(true);
    setMessage(null);
    const res = await fetch(`/api/admin/instagram/metrics/posts/${postId}/sync`, { method: "POST" });
    const result = await res.json();
    setSyncing(false);
    setMessage(res.ok ? "Métricas sincronizadas." : result.error || "Falha na sincronização");
    load();
  }

  if (status !== "PUBLISHED") return null;
  if (loading) return <p className="text-sm text-slate-500">Carregando métricas...</p>;

  const latest = data?.metrics[0];
  const hybrid = data?.hybrid;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Performance e aprendizado</h2>
        <button
          type="button"
          onClick={syncMetrics}
          disabled={syncing || !data?.post.instagramMediaId}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Sincronizar métricas deste post"}
        </button>
      </div>

      {!data?.post.instagramMediaId && (
        <p className="text-sm text-amber-800">Sem mediaId Meta — métricas só disponíveis para posts publicados via API.</p>
      )}

      {message && <p className="text-sm font-medium text-slate-700">{message}</p>}

      {hybrid && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCell label="Score previsto" value={hybrid.predictedScore} />
          <MetricCell label="Score real" value={hybrid.performanceScore} />
          <MetricCell label="Score híbrido" value={hybrid.hybridScore} />
          <MetricCell label="Diferença" value={hybrid.scoreDelta} />
        </div>
      )}
      {hybrid?.interpretation && <p className="text-sm text-slate-700">{hybrid.interpretation}</p>}

      {latest ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCell label="Alcance" value={latest.reach} />
            <MetricCell label="Impressões" value={latest.impressions} />
            <MetricCell label="Curtidas" value={latest.likes} />
            <MetricCell label="Comentários" value={latest.comments} />
            <MetricCell label="Salvamentos" value={latest.saves} />
            <MetricCell label="Compartilhamentos" value={latest.shares} />
            <MetricCell label="Perfil" value={latest.profileVisits} />
            <MetricCell label="Links" value={latest.linkClicks} />
            <MetricCell label="WhatsApp" value={latest.whatsappClicks} />
            <MetricCell label="Engajamento %" value={latest.engagementRate} />
          </div>
          {latest.unavailableMetrics.length > 0 && (
            <p className="text-xs text-slate-500">
              Indisponível na Meta: {latest.unavailableMetrics.join(", ")}
            </p>
          )}
          {data.metrics.length > 1 && (
            <div>
              <h3 className="text-sm font-bold text-slate-600">Evolução ({data.metrics.length} coletas)</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {data.metrics.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    {new Date(m.collectedAt).toLocaleString("pt-BR")} — alcance {m.reach ?? "—"}, engaj. {m.engagementRate ?? "—"}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">Nenhuma métrica coletada ainda.</p>
      )}

      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-600">Recomendações para este post</h3>
          {data.recommendations.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
        </div>
      )}
    </section>
  );
}
