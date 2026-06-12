"use client";

import { StatusBadge } from "@/components/admin/instagram/StatusBadge";
import { IG_STATUS_LABELS, STATUS_COLORS } from "@/lib/instagram/constants";
import type { IgPostStatus } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CalendarEntry = {
  id: string;
  date: string;
  dayTheme: string;
  post: {
    id: string;
    title: string;
    status: IgPostStatus;
    captions: { hook: string }[];
  } | null;
};

type TimelineItem = {
  id: string;
  title: string;
  status: IgPostStatus;
  date: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  manualPublished: boolean;
  publicationChannel: string | null;
  hook: string | null;
  imageUrl: string | null;
};

export function CalendarView() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/instagram/calendar");
    const data = await res.json();
    setEntries(data.entries ?? (Array.isArray(data) ? data : []));
    setTimeline(data.timeline ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generateWeek() {
    setGenerating(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/generate/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: true }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao gerar calendário");
      return;
    }
    setMessage(`Calendário gerado com ${data.entries?.length ?? 7} dias.`);
    load();
  }

  const grouped = entries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    const weekKey = format(new Date(entry.date), "yyyy-'W'ww");
    if (!acc[weekKey]) acc[weekKey] = [];
    acc[weekKey].push(entry);
    return acc;
  }, {});

  const statusLegend: IgPostStatus[] = ["PENDING_APPROVAL", "APPROVED", "SCHEDULED", "PUBLISHED", "CREATING", "REJECTED"];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-bold">Calendário editorial</h2>
        <p className="mt-1 text-sm text-slate-600">Planejados, aprovados, agendados e publicados em uma visão só.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusLegend.map((s) => (
            <span key={s} className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[s]}`}>
              {IG_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={generateWeek}
          disabled={generating}
          className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {generating ? "Gerando..." : "Gerar calendário desta semana"}
        </button>
        {message && <p className={`mt-3 text-sm ${message.includes("Erro") ? "text-red-600" : "text-green-700"}`}>{message}</p>}
      </div>

      {timeline.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h3 className="font-bold">Linha do tempo (agendados e publicados)</h3>
          <div className="mt-4 space-y-3">
            {timeline
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((item) => (
                <div key={item.id} className={`flex gap-4 rounded-xl border p-4 ${STATUS_COLORS[item.status]}`}>
                  {item.imageUrl && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      {item.manualPublished && <span className="text-xs text-brand-700">Publicação manual</span>}
                      {item.publicationChannel && <span className="text-xs text-slate-600">{item.publicationChannel}</span>}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString("pt-BR")}</p>
                    <Link href={`/admin/instagram/posts/${item.id}`} className="font-semibold text-slate-900 hover:text-brand-600 line-clamp-1">
                      {item.title}
                    </Link>
                    {item.hook && <p className="text-xs text-slate-600 line-clamp-1">{item.hook}</p>}
                  </div>
                  <Link href="/admin/instagram/aprovacao" className="shrink-0 text-xs font-semibold text-brand-600">
                    Aprovar →
                  </Link>
                </div>
              ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-slate-500">Carregando calendário...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
          Nenhuma entrada editorial. Gere a semana ou crie posts em Aprovação.
        </div>
      ) : (
        Object.entries(grouped).map(([week, weekEntries]) => (
          <div key={week} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Semana {week}</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {weekEntries
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-2xl border p-5 shadow-card ${entry.post ? STATUS_COLORS[entry.post.status] : "bg-white"}`}
                  >
                    <p className="text-sm font-semibold capitalize text-brand-700">
                      {format(new Date(entry.date), "EEEE, d 'de' MMM", { locale: ptBR })}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{entry.dayTheme}</p>
                    {entry.post ? (
                      <>
                        <div className="mt-2">
                          <StatusBadge status={entry.post.status} />
                        </div>
                        <Link href={`/admin/instagram/posts/${entry.post.id}`} className="mt-2 block font-semibold text-slate-900 hover:text-brand-600 line-clamp-2">
                          {entry.post.title}
                        </Link>
                        <Link href="/admin/instagram/aprovacao" className="mt-2 inline-block text-xs font-semibold text-brand-600">
                          Ir para aprovação →
                        </Link>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">Sem post vinculado</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
