"use client";

import { ImageLibrary } from "@/components/admin/instagram/ImageLibrary";
import { MetaPublishPanel } from "@/components/admin/instagram/MetaPublishPanel";
import { PostPerformancePanel } from "@/components/admin/instagram/PostPerformancePanel";
import { PostCarouselPanel } from "@/components/admin/instagram/PostCarouselPanel";
import { PostVisualPanel } from "@/components/admin/instagram/PostVisualPanel";
import { ContentTypeBadge, FormatBadge, ScoreBadge, StatusBadge } from "@/components/admin/instagram/StatusBadge";
import type { IgContentType, IgImageType, IgPostFormat, IgPostStatus, IgVisualSource, InstagramCaption, InstagramImagePrompt } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PostImage = {
  id: string;
  order: number;
  role: string;
  image: { id: string; url: string; description: string | null; imageType: IgImageType };
};

type Carousel = {
  id: string;
  exportJson: unknown;
  slides: {
    id: string;
    order: number;
    slideType: string;
    headline: string;
    body: string;
    backgroundImageId: string | null;
    backgroundImage?: { url: string } | null;
    notes: string | null;
  }[];
};

type Post = {
  id: string;
  title: string;
  idea: string | null;
  format: IgPostFormat;
  contentType: IgContentType | null;
  status: IgPostStatus;
  critiqueNotes: string | null;
  visualSource: IgVisualSource | null;
  visualFormat: string | null;
  captions: InstagramCaption[];
  imagePrompts: InstagramImagePrompt[];
  postImages: PostImage[];
  carousel: Carousel | null;
  publicationChannel: string | null;
  instagramMediaId: string | null;
  metaPublishError: string | null;
  publicationLogs: { action: string; createdAt: string; details: unknown }[];
};

function parseScore(notes: string | null): number | null {
  if (!notes) return null;
  const m = notes.match(/Score comercial: (\d+)/);
  return m ? Number(m[1]) : null;
}

export function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editIdea, setEditIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/instagram/posts/${id}`);
    const data = await res.json();
    if (res.ok) {
      setPost(data);
      setEditTitle(data.title);
      setEditIdea(data.idea || "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    const res = await fetch(`/api/admin/instagram/posts/${id}/generate`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    load();
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/instagram/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, idea: editIdea }),
    });
    setSaving(false);
    load();
  }

  async function selectCaption(captionId: string) {
    await fetch(`/api/admin/instagram/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedCaptionId: captionId }),
    });
    load();
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!post) return <p className="text-red-600">Post não encontrado.</p>;

  const score = parseScore(post.critiqueNotes);

  return (
    <div className="space-y-6">
      <Link href="/admin/instagram/posts" className="text-sm text-slate-500 hover:text-brand-600">
        ← Voltar aos posts
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <FormatBadge format={post.format} />
          <ContentTypeBadge type={post.contentType} />
          {score !== null && <ScoreBadge score={score} />}
        </div>

        <div className="space-y-3">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl border px-4 py-2 text-lg font-bold" />
          <textarea
            value={editIdea}
            onChange={(e) => setEditIdea(e.target.value)}
            rows={4}
            placeholder="Briefing / ideia do post..."
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              {saving ? "Salvando..." : "Salvar edição"}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {generating ? "Gerando..." : "Gerar / regenerar legendas + crítica"}
            </button>
          </div>
        </div>
      </div>

      <PostVisualPanel
        postId={id}
        visualSource={post.visualSource}
        visualFormat={post.visualFormat}
        imagePrompts={post.imagePrompts}
        postImages={post.postImages}
        onRefresh={load}
      />

      <div>
        <button type="button" onClick={() => setShowLibrary(!showLibrary)} className="text-sm font-semibold text-brand-600">
          {showLibrary ? "Ocultar biblioteca" : "Vincular imagem da biblioteca →"}
        </button>
        {showLibrary && (
          <div className="mt-4">
            <ImageLibrary linkPostId={id} />
          </div>
        )}
      </div>

      <PostCarouselPanel postId={id} initialCarousel={post.carousel} onRefresh={load} />

      {post.status === "PUBLISHED" && <PostPerformancePanel postId={id} status={post.status} />}

      {["APPROVED", "SCHEDULED", "PUBLISHED", "ERROR"].includes(post.status) && (
        <MetaPublishPanel
          postId={id}
          status={post.status}
          format={post.format}
          publicationChannel={post.publicationChannel}
          instagramMediaId={post.instagramMediaId}
          metaPublishError={post.metaPublishError}
          onPublished={load}
        />
      )}

      {post.critiqueNotes && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">Módulo crítico — Este post vende?</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-amber-900">{post.critiqueNotes}</pre>
        </section>
      )}

      {post.captions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Legendas (variações A/B)</h2>
          {post.captions.map((cap) => (
            <div
              key={cap.id}
              className={`rounded-2xl border p-5 ${cap.isSelected ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">Versão {cap.version}</span>
                {cap.isSelected ? (
                  <span className="text-xs font-semibold text-brand-700">Selecionada</span>
                ) : (
                  <button type="button" onClick={() => selectCaption(cap.id)} className="text-xs font-semibold text-brand-600 hover:underline">
                    Usar esta versão
                  </button>
                )}
              </div>
              <p className="mt-3 font-semibold text-slate-900">{cap.hook}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{cap.body}</p>
              <p className="mt-3 text-sm font-semibold text-brand-700 whitespace-pre-wrap">{cap.cta}</p>
              <p className="mt-2 text-xs text-slate-500">{cap.hashtags}</p>
            </div>
          ))}
        </section>
      )}

      {post.publicationLogs?.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-sm font-bold text-slate-500">Histórico</h2>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {post.publicationLogs.map((log, i) => (
              <li key={i}>
                {new Date(log.createdAt).toLocaleString("pt-BR")} — {log.action}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
