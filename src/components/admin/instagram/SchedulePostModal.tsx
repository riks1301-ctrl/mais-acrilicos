"use client";

import { PUBLICATION_CHANNEL_LABELS } from "@/lib/instagram/constants";
import type { IgPublicationChannel } from "@prisma/client";
import { useState } from "react";

type Props = {
  postId: string;
  defaultChannel?: IgPublicationChannel | null;
  onScheduled: () => void;
  onClose: () => void;
};

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function SchedulePostModal({ postId, defaultChannel, onScheduled, onClose }: Props) {
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const defaultDate = now.toISOString().slice(0, 16);

  const [scheduledFor, setScheduledFor] = useState(defaultDate);
  const [channel, setChannel] = useState<IgPublicationChannel>(defaultChannel ?? "FEED");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledFor: new Date(scheduledFor).toISOString(),
        publicationChannel: channel,
        publicationNotes: notes || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao agendar");
      return;
    }
    onScheduled();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Agendar publicação</h3>
        <p className="mt-1 text-sm text-slate-600">Fila interna — não publica no Instagram automaticamente.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Data e hora *</label>
            <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Canal</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value as IgPublicationChannel)} className={inputCls}>
              {Object.entries(PUBLICATION_CHANNEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Observação</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Ex: publicar após conferir imagem no celular" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={submit} disabled={loading} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
            {loading ? "Agendando..." : "Confirmar agendamento"}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
