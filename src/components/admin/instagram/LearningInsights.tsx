import type { LearningInsight } from "@/lib/instagram/metrics/types";

const SEV_ICON: Record<LearningInsight["severity"], string> = {
  positive: "✓",
  warning: "⚠",
  info: "ℹ",
};

export function LearningInsights({ insights }: { insights: LearningInsight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-slate-500">Sincronize métricas de posts publicados para gerar aprendizados.</p>;
  }

  return (
    <ul className="space-y-2">
      {insights.map((i) => (
        <li key={i.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="mr-2">{SEV_ICON[i.severity]}</span>
          <span className="font-semibold text-slate-900">{i.title}</span>
          <p className="mt-1 text-slate-600">{i.detail}</p>
        </li>
      ))}
    </ul>
  );
}
