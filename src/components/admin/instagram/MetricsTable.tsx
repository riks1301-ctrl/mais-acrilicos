import Link from "next/link";

type Row = {
  id: string;
  title: string;
  format: string;
  publishedAt: string | null;
  performanceScore: number | null;
  hybridScore: number | null;
  latestMetric: {
    reach: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    saves: number | null;
    shares: number | null;
    engagementRate: number | null;
    profileVisits: number | null;
    linkClicks: number | null;
    whatsappClicks: number | null;
    collectedAt: string;
  } | null;
};

function fmt(n: number | null | undefined, suffix = "") {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR")}${suffix}`;
}

export function MetricsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500 text-sm">
        Nenhum post publicado com métricas ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b text-xs text-slate-500">
          <tr>
            <th className="p-3">Post</th>
            <th className="p-3">Alcance</th>
            <th className="p-3">Impressões</th>
            <th className="p-3">Curtidas</th>
            <th className="p-3">Coment.</th>
            <th className="p-3">Salvos</th>
            <th className="p-3">Engaj. %</th>
            <th className="p-3">Score</th>
            <th className="p-3">Coleta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-3">
                <Link href={`/admin/instagram/posts/${r.id}`} className="font-semibold text-brand-700 hover:underline">
                  {r.title}
                </Link>
                <p className="text-xs text-slate-400">{r.format}</p>
              </td>
              <td className="p-3">{fmt(r.latestMetric?.reach)}</td>
              <td className="p-3">{fmt(r.latestMetric?.impressions)}</td>
              <td className="p-3">{fmt(r.latestMetric?.likes)}</td>
              <td className="p-3">{fmt(r.latestMetric?.comments)}</td>
              <td className="p-3">{fmt(r.latestMetric?.saves)}</td>
              <td className="p-3">{fmt(r.latestMetric?.engagementRate, "%")}</td>
              <td className="p-3">{fmt(r.hybridScore ?? r.performanceScore)}</td>
              <td className="p-3 text-xs text-slate-500">
                {r.latestMetric?.collectedAt ? new Date(r.latestMetric.collectedAt).toLocaleString("pt-BR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
