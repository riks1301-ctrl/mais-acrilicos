"use client";

import { resolveAdminImageSrc } from "@/lib/instagram/images/admin-url";
import { categoryLabel, IMAGE_CATEGORIES, IMAGE_STATUS_LABELS, IMAGE_TYPE_LABELS } from "@/lib/instagram/images/constants";
import type { IgImageCategory, IgImageStatus, IgImageType } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type LibraryImage = {
  id: string;
  url: string;
  localPath?: string | null;
  category: IgImageCategory | null;
  description: string | null;
  tags: string[];
  status: IgImageStatus;
  imageType: IgImageType;
  clientProject: string | null;
  service?: { name: string } | null;
};

type Props = {
  linkPostId?: string;
};

export function ImageLibrary({ linkPostId }: Props) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<LibraryImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/instagram/images?${params}`);
    const data = await res.json();
    setImages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [category, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function linkToPost(imageId: string) {
    if (!linkPostId) return;
    const res = await fetch(`/api/admin/instagram/posts/${linkPostId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, role: "cover", order: 0 }),
    });
    if (res.ok) {
      setMessage("Imagem vinculada ao post.");
    } else {
      const data = await res.json();
      setMessage(data.error || "Erro ao vincular");
    }
  }

  async function archive(id: string) {
    await fetch(`/api/admin/instagram/images/${id}/archive`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-card">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todas categorias</option>
          {IMAGE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todos status</option>
          {Object.entries(IMAGE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tags, descrição..."
          className="min-w-[200px] flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <Link href="/admin/instagram/imagens/upload" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          + Upload
        </Link>
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
          Nenhuma imagem. <Link href="/admin/instagram/imagens/upload" className="text-brand-600">Faça upload</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
              <button type="button" onClick={() => setPreview(img)} className="relative block aspect-square w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAdminImageSrc(img)} alt={img.description ?? ""} className="h-full w-full object-cover" loading="lazy" />
              </button>
              <div className="p-3 space-y-2">
                <p className="text-xs font-semibold text-brand-700">{categoryLabel(img.category)}</p>
                <p className="text-sm font-medium line-clamp-2">{img.description}</p>
                <p className="text-xs text-slate-500">{IMAGE_TYPE_LABELS[img.imageType]} · {IMAGE_STATUS_LABELS[img.status]}</p>
                <div className="flex flex-wrap gap-1">
                  {linkPostId && (
                    <button type="button" onClick={() => linkToPost(img.id)} className="text-xs font-semibold text-brand-600">
                      Vincular ao post
                    </button>
                  )}
                  <button type="button" onClick={() => archive(img.id)} className="text-xs text-red-600">
                    Arquivar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] max-w-2xl overflow-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square w-full min-w-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveAdminImageSrc(preview)} alt="" className="h-full w-full object-contain" />
            </div>
            <p className="mt-3 font-semibold">{preview.description}</p>
            <p className="text-sm text-slate-600">{preview.tags.join(", ")}</p>
            <button type="button" onClick={() => setPreview(null)} className="mt-4 text-sm text-brand-600">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
