"use client";

import { ApprovalCard, type ApprovalItem } from "@/components/admin/instagram/ApprovalCard";
import { MetaStatusBanner } from "@/components/admin/instagram/MetaStatusBanner";
import { useCallback, useEffect, useState } from "react";

const FILTERS = [
  { id: "", label: "Fila completa" },
  { id: "PENDING_APPROVAL", label: "Aguardando aprovação" },
  { id: "APPROVED", label: "Aprovados" },
  { id: "SCHEDULED", label: "Agendados" },
  { id: "REJECTED", label: "Reprovados" },
];

export function ApprovalQueue() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter ? `/api/admin/instagram/approval?status=${filter}` : "/api/admin/instagram/approval";
    const res = await fetch(url);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = items.filter((i) => i.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      <MetaStatusBanner />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === f.id ? "bg-brand-600 text-white" : "bg-white shadow-card text-slate-600"}`}
          >
            {f.label}
            {f.id === "PENDING_APPROVAL" && pending > 0 && ` (${pending})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando fila...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
          Nenhum post nesta fila. Gere conteúdo em Posts e aguarde status &quot;Aguardando aprovação&quot;.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApprovalCard key={item.id} item={item} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
