"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostEditorProps {
  post?: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    keywords?: string | null;
    published: boolean;
    featured: boolean;
    categoryId?: string | null;
  };
  categories: { id: string; name: string }[];
}

export function PostEditor({ post, categories }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      excerpt: form.get("excerpt") as string,
      content: form.get("content") as string,
      coverImage: (form.get("coverImage") as string) || undefined,
      metaTitle: (form.get("metaTitle") as string) || undefined,
      metaDescription: (form.get("metaDescription") as string) || undefined,
      keywords: (form.get("keywords") as string) || undefined,
      published: form.get("published") === "on",
      featured: form.get("featured") === "on",
      categoryId: (form.get("categoryId") as string) || undefined,
    };

    try {
      const url = post ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
      const method = post ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao salvar");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Título *
          </label>
          <input
            name="title"
            required
            defaultValue={post?.title}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Resumo *
          </label>
          <textarea
            name="excerpt"
            required
            rows={2}
            defaultValue={post?.excerpt}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Conteúdo (HTML) *
          </label>
          <textarea
            name="content"
            required
            rows={15}
            defaultValue={post?.content}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Imagem de capa (URL)
          </label>
          <input
            name="coverImage"
            defaultValue={post?.coverImage || ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Categoria
          </label>
          <select
            name="categoryId"
            defaultValue={post?.categoryId || ""}
            className={inputClass}
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={post?.published}
              className="rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Publicado</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={post?.featured}
              className="rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Destaque</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">SEO</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Meta Title
          </label>
          <input
            name="metaTitle"
            defaultValue={post?.metaTitle || ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Meta Description
          </label>
          <textarea
            name="metaDescription"
            rows={2}
            defaultValue={post?.metaDescription || ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Keywords
          </label>
          <input
            name="keywords"
            defaultValue={post?.keywords || ""}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Post"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
