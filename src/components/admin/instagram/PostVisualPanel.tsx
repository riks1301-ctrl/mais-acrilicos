"use client";

import { PROMPT_PURPOSES, VISUAL_SOURCE_LABELS } from "@/lib/instagram/images/constants";
import { resolveAdminImageSrc } from "@/lib/instagram/images/admin-url";
import type { IgImageType, IgPostFormat, IgVisualSource } from "@prisma/client";
import { useState } from "react";

type PostImage = {
  id: string;
  order: number;
  role: string;
  image: { id: string; url: string; localPath?: string | null; description: string | null; imageType: IgImageType };
};

type Props = {
  postId: string;
  postFormat: IgPostFormat;
  visualSource: IgVisualSource | null;
  visualFormat: string | null;
  postImages: PostImage[];
  onRefresh: () => void;
};

const FORMAT_LABELS: Record<IgPostFormat, string> = {
  FEED: "Feed — 1 imagem",
  CAROUSEL: "Carrossel",
  STORY: "Story",
  REELS: "Reels",
};

export function PostVisualPanel({ postId, postFormat, visualSource, visualFormat, postImages, onRefresh }: Props) {
  const [source, setSource] = useState<IgVisualSource | "">(visualSource ?? "REAL");
  const [format, setFormat] = useState(visualFormat ?? "1080x1080");
  const [postFormatLocal, setPostFormatLocal] = useState<IgPostFormat>(postFormat);
  const [message, setMessage] = useState<string | null>(null);

  const coverId = postImages.find((pi) => pi.role === "cover")?.image.id ?? postImages[0]?.image.id;

  async function saveVisual() {
    await fetch(`/api/admin/instagram/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visualSource: source || "REAL",
        visualFormat: format,
        format: postFormatLocal,
      }),
    });
    setMessage("Configuração salva.");
    onRefresh();
  }

  async function setAsCover(imageId: string) {
    const res = await fetch(`/api/admin/instagram/posts/${postId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, role: "cover", order: 0 }),
    });
    if (res.ok) {
      setMessage("Foto definida como capa do post.");
      onRefresh();
    }
  }

  async function unlinkImage(imageId: string) {
    await fetch(`/api/admin/instagram/posts/${postId}/images?imageId=${imageId}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
        <p className="font-semibold">Publicar com sua foto</p>
        <p className="mt-1">
          Vincule a imagem na biblioteca abaixo → defina como <strong>capa</strong> → tipo <strong>Feed — 1 imagem</strong> → salve → aprove e publique.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold">Imagem do post</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de post</label>
            <select
              value={postFormatLocal}
              onChange={(e) => setPostFormatLocal(e.target.value as IgPostFormat)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fonte visual</label>
            <select value={source} onChange={(e) => setSource(e.target.value as IgVisualSource)} className="w-full rounded-xl border px-3 py-2 text-sm">
              {Object.entries(VISUAL_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Formato da imagem</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
              {PROMPT_PURPOSES.filter((p) => p.id === "FEED_SQUARE" || p.id === "FEED_PORTRAIT").map((p) => (
                <option key={p.id} value={p.format}>{p.label} ({p.format})</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={saveVisual} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
          Salvar configuração visual
        </button>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Imagens vinculadas ({postImages.length})</h3>
        {postImages.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma imagem. Use &quot;Vincular imagem da biblioteca&quot; abaixo.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {postImages.map((pi) => (
              <div key={pi.id} className={`rounded-xl border p-2 ${pi.image.id === coverId ? "border-emerald-400 ring-2 ring-emerald-200" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAdminImageSrc(pi.image)} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <p className="mt-1 text-xs line-clamp-2">{pi.image.description}</p>
                <p className="text-xs text-slate-500">{pi.role === "cover" ? "✓ Capa do post" : pi.role}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {pi.image.id !== coverId && (
                    <button type="button" onClick={() => setAsCover(pi.image.id)} className="text-xs font-semibold text-brand-600">
                      Usar como capa
                    </button>
                  )}
                  <button type="button" onClick={() => unlinkImage(pi.image.id)} className="text-xs text-red-600">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
