"use client";

import { IG_CONTENT_TYPE_LABELS } from "@/lib/instagram/constants";
import type { IgContentType } from "@prisma/client";
import { useState } from "react";

type Props = {
  onGenerated: () => void;
};

export function GenerateIdeasPanel({ onGenerated }: Props) {
  const [count, setCount] = useState(5);
  const [contentType, setContentType] = useState<IgContentType | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_ideas",
        count,
        contentType: contentType || undefined,
        save: true,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Erro ao gerar ideias");
      return;
    }

    setMessage(`${data.posts?.length ?? data.ideas?.length ?? 0} ideias geradas e salvas.`);
    onGenerated();
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-slate-900">Gerar ideias de posts</h2>
      <p className="mt-1 text-sm text-slate-600">O agente cria títulos e briefings alinhados à marca Mais Acrílicos.</p>

      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Quantidade</label>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-24 rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipo de conteúdo (opcional)</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as IgContentType | "")}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(IG_CONTENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Gerando..." : "Gerar ideias"}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${message.includes("Erro") ? "text-red-600" : "text-green-700"}`}>{message}</p>
      )}
    </div>
  );
}
