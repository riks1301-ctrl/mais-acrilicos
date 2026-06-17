"use client";

import type { IgPostStatus } from "@prisma/client";
import { useState } from "react";

type Props = {
  postId: string;
  status: IgPostStatus;
  onDone: () => void;
  className?: string;
};

export function PostDiscardActions({ postId, status, onDone, className = "" }: Props) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status !== "APPROVED" && status !== "SCHEDULED") return null;

  async function discard() {
    if (rejectReason.length < 10) {
      setMessage("Motivo deve ter pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error ?? "Não foi possível descartar.");
      return;
    }
    setShowReject(false);
    setRejectReason("");
    onDone();
  }

  async function remove() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/admin/instagram/posts/${postId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).error ?? "Não foi possível excluir.");
      return;
    }
    setShowDelete(false);
    onDone();
  }

  return (
    <div className={`rounded-xl border border-red-100 bg-red-50/50 p-3 ${className}`}>
      <p className="text-xs font-semibold text-red-900">Não vai publicar este post?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-800"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white"
        >
          Excluir
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-red-700">{message}</p>}

      {showReject && (
        <Modal title="Descartar post" onClose={() => setShowReject(false)}>
          <p className="text-sm text-slate-600">
            Sai da fila de aprovados e vai para <strong>Reprovados</strong>. Não publica no Instagram.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border p-3 text-sm"
            placeholder="Motivo (mín. 10 caracteres)..."
          />
          <button type="button" onClick={discard} disabled={loading} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm text-white">
            Confirmar descarte
          </button>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Excluir post" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-slate-600">Remove o post do sistema. Não despublica no Instagram se já estiver lá.</p>
          <button type="button" onClick={remove} disabled={loading} className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm text-white">
            Excluir permanentemente
          </button>
        </Modal>
      )}
    </div>
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
