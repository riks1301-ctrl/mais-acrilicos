"use client";

import { IMAGE_TYPE_LABELS, PROMPT_PURPOSES, VISUAL_SOURCE_LABELS } from "@/lib/instagram/images/constants";
import type { IgImageType, IgVisualSource, InstagramImagePrompt } from "@prisma/client";
import { useState } from "react";

type PostImage = {
  id: string;
  order: number;
  role: string;
  image: { id: string; url: string; description: string | null; imageType: IgImageType };
};

type Props = {
  postId: string;
  visualSource: IgVisualSource | null;
  visualFormat: string | null;
  imagePrompts: InstagramImagePrompt[];
  postImages: PostImage[];
  onRefresh: () => void;
};

export function PostVisualPanel({ postId, visualSource, visualFormat, imagePrompts, postImages, onRefresh }: Props) {
  const [imageType, setImageType] = useState<IgImageType>("CONCEPT");
  const [source, setSource] = useState<IgVisualSource | "">(visualSource ?? "");
  const [format, setFormat] = useState(visualFormat ?? "1080x1080");
  const [generating, setGenerating] = useState(false);

  async function saveVisual() {
    await fetch(`/api/admin/instagram/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visualSource: source || undefined,
        visualFormat: format,
      }),
    });
    onRefresh();
  }

  async function generatePrompts() {
    setGenerating(true);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageType }),
    });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    onRefresh();
  }

  async function unlinkImage(imageId: string) {
    await fetch(`/api/admin/instagram/posts/${postId}/images?imageId=${imageId}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold">Imagens e visual</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Fonte visual do post</label>
            <select value={source} onChange={(e) => setSource(e.target.value as IgVisualSource)} className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {Object.entries(VISUAL_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Formato</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
              {PROMPT_PURPOSES.map((p) => (
                <option key={p.id} value={p.format}>{p.label} ({p.format})</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={saveVisual} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
          Salvar configuração visual
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Imagens vinculadas ({postImages.length})</h3>
        {postImages.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma imagem. Vincule na biblioteca abaixo ou em /admin/instagram/imagens</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {postImages.map((pi) => (
              <div key={pi.id} className="rounded-xl border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pi.image.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <p className="mt-1 text-xs line-clamp-2">{pi.image.description}</p>
                <button type="button" onClick={() => unlinkImage(pi.image.id)} className="mt-1 text-xs text-red-600">Remover</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Gerar prompts de imagem (IA)</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Tipo para o prompt</label>
            <select value={imageType} onChange={(e) => setImageType(e.target.value as IgImageType)} className="rounded-xl border px-3 py-2 text-sm">
              {Object.entries(IMAGE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={generatePrompts}
            disabled={generating}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {generating ? "Gerando..." : "Gerar prompts (todos formatos)"}
          </button>
        </div>

        {imagePrompts.length > 0 && (
          <div className="space-y-3">
            {imagePrompts.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-brand-700">{p.format} · {p.purpose} · {IMAGE_TYPE_LABELS[p.imageType]}</p>
                <p className="mt-2 text-sm text-slate-800">{p.prompt}</p>
                {p.styleNotes && <p className="mt-1 text-xs text-slate-500">{p.styleNotes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
