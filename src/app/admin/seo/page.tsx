"use client";

import { useEffect, useState } from "react";

export default function AdminSeoPage() {
  const [stats, setStats] = useState({ pending: 0, generated: 0, total: 0 });
  const [count, setCount] = useState(10);
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => { fetch("/api/admin/seo/generate").then((r) => r.json()).then(setStats).catch(() => {}); }, []);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/admin/seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count, publish }) });
    const data = await res.json();
    if (res.ok) { setTitles(data.titles || []); setStats(await fetch("/api/admin/seo/generate").then((r) => r.json())); }
    else alert(data.error);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Gerador SEO</h1>
      <p className="text-slate-600">Fila com 200+ artigos pré-configurados</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">{Object.entries({ Pendentes: stats.pending, Gerados: stats.generated, Total: stats.total }).map(([k, v]) => <div key={k} className="rounded-2xl bg-white p-6 shadow-card"><p className="text-sm text-slate-500">{k}</p><p className="text-3xl font-bold">{v}</p></div>)}</div>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-card space-y-4">
        <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-xl border px-4 py-3" />
        <label className="flex gap-2"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publicar automaticamente</label>
        <button onClick={generate} disabled={loading} className="rounded-xl bg-brand-600 px-6 py-3 text-white">{loading ? "Gerando..." : "Gerar artigos"}</button>
        {titles.length > 0 && <ul className="text-sm">{titles.map((t) => <li key={t}>✓ {t}</li>)}</ul>}
      </div>
    </div>
  );
}
