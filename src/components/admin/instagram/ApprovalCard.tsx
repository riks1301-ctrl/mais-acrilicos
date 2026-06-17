"use client";

import { ApprovalHistory } from "@/components/admin/instagram/ApprovalHistory";
import { MetaPublishPanel } from "@/components/admin/instagram/MetaPublishPanel";
import { FinalPostEditor } from "@/components/admin/instagram/FinalPostEditor";
import { PublicationLogList } from "@/components/admin/instagram/PublicationLogList";
import { SchedulePostModal } from "@/components/admin/instagram/SchedulePostModal";
import { ContentTypeBadge, FormatBadge, ScoreBadge, StatusBadge } from "@/components/admin/instagram/StatusBadge";
import { IG_CONTENT_TYPE_LABELS } from "@/lib/instagram/constants";
import type { IgContentType, IgPostFormat, IgPostStatus, IgPublicationChannel } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type ApprovalItem = {
  id: string;
  title: string;
  format: IgPostFormat;
  contentType: IgContentType | null;
  status: IgPostStatus;
  commercialScore: number | null;
  hasVisual: boolean;
  hasCarousel: boolean;
  serviceName: string | null;
  suggestedDate: string | null;
  scheduledFor: string | null;
  finalCaption: string | null;
  finalCta: string | null;
  finalHashtags: string | null;
  internalNotes: string | null;
  publicationChannel: IgPublicationChannel | null;
  manualPublished: boolean;
  warnings: string[];
  selectedCaption: { hook: string; body: string; cta: string; hashtags: string; isSelected: boolean } | null;
  postImages: { image: { id: string; url: string; description: string | null } }[];
  carousel: { slides: { headline: string }[] } | null;
  approvals: { id: string; status: string; notes: string | null; reviewedAt: string; adminId: string | null }[];
  publicationLogs: { id: string; action: string; createdAt: string; details: unknown; errorMessage: string | null }[];
  instagramMediaId: string | null;
  metaPublishError: string | null;
};

type Props = {
  item: ApprovalItem;
  onRefresh: () => void;
};

export function ApprovalCard({ item, onRefresh }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [publishNotes, setPublishNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cover = item.postImages[0]?.image;

  async function approve(force: { forceLowScore?: boolean; forceNoVisual?: boolean } = {}) {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/admin/instagram/posts/${item.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(force),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.code === "LOW_SCORE" && confirm(`${data.error}\n\nAprovar mesmo assim?`)) {
        return approve({ forceLowScore: true, ...force });
      }
      if (data.code === "NO_VISUAL" && confirm(`${data.error}\n\nAprovar mesmo assim?`)) {
        return approve({ forceNoVisual: true, ...force });
      }
      setMessage(data.error);
      return;
    }
    setMessage("Post aprovado.");
    onRefresh();
  }

  async function reject() {
    if (rejectReason.length < 10) {
      setMessage("Motivo deve ter pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/instagram/posts/${item.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error);
      return;
    }
    setShowReject(false);
    onRefresh();
  }

  async function requestAdjustments() {
    setLoading(true);
    const res = await fetch(`/api/admin/instagram/posts/${item.id}/request-adjustments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: adjustNotes }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error);
      return;
    }
    setShowAdjust(false);
    onRefresh();
  }

  async function manualPublish() {
    setLoading(true);
    const res = await fetch(`/api/admin/instagram/posts/${item.id}/manual-publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: publishNotes }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error);
      return;
    }
    setShowPublish(false);
    onRefresh();
  }

  async function cancelSchedule() {
    await fetch(`/api/admin/instagram/posts/${item.id}/schedule`, { method: "DELETE" });
    onRefresh();
  }

  async function deletePost() {
    setLoading(true);
    const res = await fetch(`/api/admin/instagram/posts/${item.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error ?? "Não foi possível excluir.");
      return;
    }
    setShowDelete(false);
    onRefresh();
  }

  const discardLabel = item.status === "APPROVED" || item.status === "SCHEDULED" ? "Descartar" : "Reprovar";

  const personaLabel = item.contentType ? IG_CONTENT_TYPE_LABELS[item.contentType] : "Geral";

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-card">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={item.status} />
        <FormatBadge format={item.format} />
        <ContentTypeBadge type={item.contentType} />
        {item.commercialScore !== null && <ScoreBadge score={item.commercialScore} />}
      </div>

      {item.warnings.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {item.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
      <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
        <p><span className="font-medium">Persona/tipo:</span> {personaLabel}</p>
        <p><span className="font-medium">Serviço:</span> {item.serviceName ?? "—"}</p>
        {item.suggestedDate && (
          <p><span className="font-medium">Data sugerida:</span> {new Date(item.suggestedDate).toLocaleDateString("pt-BR")}</p>
        )}
        {item.scheduledFor && (
          <p><span className="font-medium">Agendado:</span> {new Date(item.scheduledFor).toLocaleString("pt-BR")}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cover && (
          <div className="relative aspect-square overflow-hidden rounded-xl border">
            <Image src={cover.url} alt="" fill className="object-cover" sizes="200px" />
          </div>
        )}
        <div className="text-sm">
          <p className="font-semibold text-slate-800">Legenda final</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-600 line-clamp-6">
            {item.finalCaption ?? item.selectedCaption?.hook ?? "— Preencha na edição final —"}
          </p>
          {item.hasCarousel && (
            <p className="mt-2 text-xs text-brand-700">✓ Carrossel com {item.carousel?.slides.length ?? 0} slides</p>
          )}
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-brand-700">{message}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {(item.status === "PENDING_APPROVAL" || item.status === "CREATING" || item.status === "REJECTED") && (
          <>
            <button type="button" disabled={loading} onClick={() => approve()} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white">
              Aprovar
            </button>
            <button type="button" onClick={() => setShowEditor(true)} className="rounded-xl border px-3 py-2 text-xs font-semibold">
              Editar final
            </button>
            <button type="button" onClick={() => setShowReject(true)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
              Reprovar
            </button>
            <button type="button" onClick={() => setShowAdjust(true)} className="rounded-xl border px-3 py-2 text-xs font-semibold text-amber-700">
              Solicitar ajustes
            </button>
          </>
        )}
        {(item.status === "APPROVED" || item.status === "SCHEDULED") && (
          <>
            <button type="button" onClick={() => setShowSchedule(true)} className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white">
              {item.status === "SCHEDULED" ? "Reagendar" : "Agendar"}
            </button>
            {item.status === "SCHEDULED" && (
              <button type="button" onClick={cancelSchedule} className="rounded-xl border px-3 py-2 text-xs font-semibold">
                Cancelar agendamento
              </button>
            )}
            <button type="button" onClick={() => setShowPublish(true)} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
              Marcar publicado manualmente
            </button>
            <button type="button" onClick={() => setShowReject(true)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
              Descartar
            </button>
            <button type="button" onClick={() => setShowDelete(true)} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-800">
              Excluir
            </button>
          </>
        )}
        <Link href={`/admin/instagram/posts/${item.id}`} className="rounded-xl border px-3 py-2 text-xs font-semibold text-slate-600">
          Ver detalhe
        </Link>
      </div>

      {(item.status === "APPROVED" || item.status === "SCHEDULED") && (
        <div className="mt-4">
          <MetaPublishPanel
            postId={item.id}
            status={item.status}
            format={item.format}
            publicationChannel={item.publicationChannel}
            instagramMediaId={item.instagramMediaId}
            metaPublishError={item.metaPublishError}
            onPublished={onRefresh}
          />
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500">Logs e histórico</summary>
        <div className="mt-2 space-y-3">
          <ApprovalHistory approvals={item.approvals} />
          <PublicationLogList logs={item.publicationLogs} />
        </div>
      </details>

      {showEditor && (
        <FinalPostEditor
          postId={item.id}
          title={item.title}
          format={item.format}
          finalCaption={item.finalCaption}
          finalCta={item.finalCta}
          finalHashtags={item.finalHashtags}
          internalNotes={item.internalNotes}
          suggestedDate={item.suggestedDate}
          selectedCaption={item.selectedCaption}
          postImages={item.postImages}
          onSaved={onRefresh}
          onClose={() => setShowEditor(false)}
        />
      )}

      {showSchedule && (
        <SchedulePostModal
          postId={item.id}
          defaultChannel={item.publicationChannel}
          onScheduled={onRefresh}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {showReject && (
        <Modal title={discardLabel === "Descartar" ? "Descartar post" : "Reprovar post"} onClose={() => setShowReject(false)}>
          <p className="text-sm text-slate-600">
            {discardLabel === "Descartar"
              ? "O post sai da fila de aprovados e vai para Reprovados. Não será publicado automaticamente."
              : "Informe o motivo da reprovação."}
          </p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Motivo (mínimo 10 caracteres)..." />
          <button type="button" onClick={reject} disabled={loading} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm text-white">
            {discardLabel === "Descartar" ? "Confirmar descarte" : "Confirmar reprovação"}
          </button>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Excluir post" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-slate-600">
            Remove o post do sistema de forma permanente. Esta ação não despublica no Instagram se já tiver sido publicado lá.
          </p>
          <button type="button" onClick={deletePost} disabled={loading} className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm text-white">
            Excluir permanentemente
          </button>
        </Modal>
      )}

      {showAdjust && (
        <Modal title="Solicitar ajustes" onClose={() => setShowAdjust(false)}>
          <textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} rows={4} className="w-full rounded-xl border p-3 text-sm" placeholder="O que precisa mudar?" />
          <button type="button" onClick={requestAdjustments} disabled={loading} className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm text-white">Enviar para ajuste</button>
        </Modal>
      )}

      {showPublish && (
        <Modal title="Publicação manual" onClose={() => setShowPublish(false)}>
          <p className="text-sm text-slate-600">Use após publicar você mesmo no app do Instagram.</p>
          <textarea value={publishNotes} onChange={(e) => setPublishNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Ex: Publicado no feed às 18h pelo app" />
          <button type="button" onClick={manualPublish} disabled={loading} className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm text-white">Confirmar publicação manual</button>
        </Modal>
      )}
    </article>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
