"use client";

import type { IgPostFormat } from "@prisma/client";
import { useState } from "react";

type Caption = { hook: string; body: string; cta: string; hashtags: string; isSelected: boolean };

type ImageLink = { image: { id: string; url: string; description: string | null } };

type Props = {
  postId: string;
  title: string;
  format: IgPostFormat;
  finalCaption: string | null;
  finalCta: string | null;
  finalHashtags: string | null;
  internalNotes: string | null;
  suggestedDate: string | null;
  selectedCaption: Caption | null;
  postImages: ImageLink[];
  onSaved: () => void;
  onClose: () => void;
};

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function FinalPostEditor(props: Props) {
  const [title, setTitle] = useState(props.title);
  const [finalCaption, setFinalCaption] = useState(props.finalCaption ?? "");
  const [finalCta, setFinalCta] = useState(props.finalCta ?? props.selectedCaption?.cta ?? "");
  const [finalHashtags, setFinalHashtags] = useState(props.finalHashtags ?? props.selectedCaption?.hashtags ?? "");
  const [format, setFormat] = useState(props.format);
  const [internalNotes, setInternalNotes] = useState(props.internalNotes ?? "");
  const [primaryImageId, setPrimaryImageId] = useState(props.postImages[0]?.image.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useSelectedCaption() {
    if (!props.selectedCaption) return;
    setFinalCaption(
      `${props.selectedCaption.hook}\n\n${props.selectedCaption.body}\n\n${props.selectedCaption.cta}\n\n${props.selectedCaption.hashtags}`
    );
    setFinalCta(props.selectedCaption.cta);
    setFinalHashtags(props.selectedCaption.hashtags);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/instagram/posts/${props.postId}/final`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        finalCaption,
        finalCta,
        finalHashtags,
        format,
        internalNotes: internalNotes || null,
        primaryImageId: primaryImageId || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }
    props.onSaved();
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={props.onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Edição final antes da aprovação</h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={useSelectedCaption} className="text-xs font-semibold text-brand-600">
              Usar legenda selecionada (A/B)
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Legenda final *</label>
            <textarea value={finalCaption} onChange={(e) => setFinalCaption(e.target.value)} rows={8} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">CTA final *</label>
            <input value={finalCta} onChange={(e) => setFinalCta(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Hashtags finais *</label>
            <textarea value={finalHashtags} onChange={(e) => setFinalHashtags(e.target.value)} rows={2} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Formato</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as IgPostFormat)} className={inputCls}>
              <option value="FEED">Feed</option>
              <option value="CAROUSEL">Carrossel</option>
              <option value="STORY">Story</option>
              <option value="REELS">Reels</option>
            </select>
          </div>
          {props.postImages.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500">Imagem principal</label>
              <select value={primaryImageId} onChange={(e) => setPrimaryImageId(e.target.value)} className={inputCls}>
                {props.postImages.map((pi) => (
                  <option key={pi.image.id} value={pi.image.id}>{pi.image.description ?? pi.image.id}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500">Observações internas</label>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {saving ? "Salvando..." : "Salvar edição final"}
          </button>
          <button type="button" onClick={props.onClose} className="rounded-xl border px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
