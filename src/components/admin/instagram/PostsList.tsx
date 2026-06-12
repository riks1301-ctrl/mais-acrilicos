"use client";

import { ContentTypeBadge, FormatBadge, StatusBadge } from "@/components/admin/instagram/StatusBadge";
import { IG_CONTENT_TYPE_LABELS } from "@/lib/instagram/constants";
import type { IgContentType, IgPostFormat, IgPostStatus, InstagramCaption } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Post = {
  id: string;
  title: string;
  idea: string | null;
  format: IgPostFormat;
  contentType: IgContentType | null;
  status: IgPostStatus;
  critiqueNotes: string | null;
  createdAt: string;
  captions: InstagramCaption[];
};

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter ? `/api/admin/instagram/posts?status=${filter}` : "/api/admin/instagram/posts";
    const res = await fetch(url);
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateContent(id: string) {
    const res = await fetch(`/api/admin/instagram/posts/${id}/generate`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao gerar");
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Filtrar:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="IDEA">Ideias</option>
          <option value="CREATING">Em criação</option>
          <option value="PENDING_APPROVAL">Aguardando aprovação</option>
          <option value="APPROVED">Aprovados</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando posts...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Nenhum post ainda. Gere ideias acima ou crie um calendário semanal.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={post.status} />
                    <FormatBadge format={post.format} />
                    <ContentTypeBadge type={post.contentType} />
                  </div>
                  <Link href={`/admin/instagram/posts/${post.id}`} className="mt-2 block font-semibold text-slate-900 hover:text-brand-600">
                    {post.title}
                  </Link>
                  {post.idea && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{post.idea}</p>}
                  {post.contentType && (
                    <p className="mt-1 text-xs text-slate-400">{IG_CONTENT_TYPE_LABELS[post.contentType]}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {(post.status === "IDEA" || post.status === "CREATING") && (
                    <button
                      type="button"
                      onClick={() => generateContent(post.id)}
                      className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Gerar legendas
                    </button>
                  )}
                  <Link
                    href={`/admin/instagram/posts/${post.id}`}
                    className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Ver detalhe
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
