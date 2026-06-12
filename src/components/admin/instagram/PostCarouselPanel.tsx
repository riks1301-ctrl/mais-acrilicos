"use client";

import { useEffect, useState } from "react";

type Slide = {
  id: string;
  order: number;
  slideType: string;
  headline: string;
  body: string;
  backgroundImageId: string | null;
  backgroundImage?: { url: string } | null;
  notes: string | null;
};

type Carousel = {
  id: string;
  exportJson: unknown;
  slides: Slide[];
};

type LibraryImage = { id: string; url: string; description: string | null };

type Props = {
  postId: string;
  initialCarousel: Carousel | null;
  onRefresh: () => void;
};

export function PostCarouselPanel({ postId, initialCarousel, onRefresh }: Props) {
  const [carousel, setCarousel] = useState<Carousel | null>(initialCarousel);
  const [slides, setSlides] = useState<Slide[]>(initialCarousel?.slides ?? []);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCarousel(initialCarousel);
    setSlides(initialCarousel?.slides ?? []);
  }, [initialCarousel]);

  useEffect(() => {
    fetch("/api/admin/instagram/images?status=AVAILABLE")
      .then((r) => r.json())
      .then((data) => setImages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function generate() {
    setGenerating(true);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/carousel`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    const data = await res.json();
    setCarousel(data);
    setSlides(data.slides ?? []);
    onRefresh();
  }

  function updateSlide(id: string, field: "headline" | "body", value: string) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function updateBackground(id: string, backgroundImageId: string) {
    setSlides((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              backgroundImageId: backgroundImageId || null,
              backgroundImage: images.find((i) => i.id === backgroundImageId) ?? null,
            }
          : s
      )
    );
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/carousel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slides: slides.map((s) => ({
          id: s.id,
          order: s.order,
          slideType: s.slideType,
          headline: s.headline,
          body: s.body,
          backgroundImageId: s.backgroundImageId,
          notes: s.notes,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    onRefresh();
  }

  function downloadJson() {
    const json = carousel?.exportJson ?? { slides };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `carrossel-${postId}.json`;
    a.click();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Carrossel (6 slides)</h2>
        <div className="flex gap-2">
          <button type="button" onClick={generate} disabled={generating} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {generating ? "Gerando..." : carousel ? "Regenerar" : "Gerar carrossel"}
          </button>
          {carousel && (
            <>
              <button type="button" onClick={save} disabled={saving} className="rounded-xl border px-4 py-2 text-sm font-semibold">
                {saving ? "Salvando..." : "Salvar slides"}
              </button>
              <button type="button" onClick={downloadJson} className="rounded-xl border px-4 py-2 text-sm font-semibold">
                Exportar JSON
              </button>
            </>
          )}
        </div>
      </div>

      {slides.length === 0 ? (
        <p className="text-sm text-slate-500">Gere a estrutura do carrossel com gancho, problema, solução, exemplo, benefício e CTA WhatsApp.</p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <div key={slide.id} className="rounded-xl border p-4">
              <p className="text-xs font-bold text-brand-700">{slide.notes ?? `Slide ${slide.order}`}</p>
              <input
                value={slide.headline}
                onChange={(e) => updateSlide(slide.id, "headline", e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2 font-semibold text-sm"
              />
              <textarea
                value={slide.body}
                onChange={(e) => updateSlide(slide.id, "body", e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-500">Fundo:</label>
                <select
                  value={slide.backgroundImageId ?? ""}
                  onChange={(e) => updateBackground(slide.id, e.target.value)}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  <option value="">Sem imagem</option>
                  {images.map((img) => (
                    <option key={img.id} value={img.id}>{img.description?.slice(0, 40) ?? img.id}</option>
                  ))}
                </select>
                {slide.backgroundImage?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.backgroundImage.url} alt="" className="h-12 w-12 rounded object-cover" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
