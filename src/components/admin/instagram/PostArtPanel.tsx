"use client";

import { ART_TEMPLATE_LABELS } from "@/lib/instagram/art/brand-library";
import { PROMPT_PURPOSES } from "@/lib/instagram/images/constants";
import type { ArtTemplateId } from "@/lib/instagram/art/types";
import { useState } from "react";

type ArtFile = {
  imageId: string;
  url: string;
  role: string;
  order: number;
  format: string;
  source: "real_photo" | "brand_template";
};

type Props = {
  postId: string;
  visualFormat: string | null;
  artFiles: ArtFile[];
  onRefresh: () => void;
};

export function PostArtPanel({ postId, visualFormat, artFiles, onRefresh }: Props) {
  const [templateId, setTemplateId] = useState<ArtTemplateId>("carousel");
  const [format, setFormat] = useState(visualFormat ?? "1080x1080");
  const [generating, setGenerating] = useState(false);
  const [lastStats, setLastStats] = useState<{ usedRealPhotos: number; usedTemplates: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const files = artFiles.length
    ? artFiles
    : [];

  async function generateArt() {
    setGenerating(true);
    setMessage(null);
    let totalReal = 0;
    let totalTemplates = 0;

    try {
      const prepRes = await fetch(`/api/admin/instagram/posts/${postId}/art/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, format, prepareOnly: true }),
      });
      const prep = await prepRes.json();
      if (!prepRes.ok) {
        setMessage(prep.error || "Erro ao preparar carrossel");
        return;
      }

      const slideCount = prep.slideCount ?? 6;
      for (let order = 1; order <= slideCount; order++) {
        setMessage(`Gerando slide ${order}/${slideCount}...`);
        const res = await fetch(`/api/admin/instagram/posts/${postId}/art/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            format,
            slideOrder: order,
            finalize: order === slideCount,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || `Erro no slide ${order}`);
          return;
        }
        totalReal += data.usedRealPhotos ?? 0;
        totalTemplates += data.usedTemplates ?? 0;
      }

      setLastStats({ usedRealPhotos: totalReal, usedTemplates: totalTemplates });
      setMessage(
        `Arte gerada: ${slideCount} slides · ${totalReal} fotos reais · ${totalTemplates} templates`
      );
      onRefresh();
    } catch {
      setMessage("Falha de rede ou tempo esgotado. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  function downloadExport(fmt: "png" | "jpg" | "pdf" | "zip") {
    window.open(`/api/admin/instagram/posts/${postId}/art/export?format=${fmt}`, "_blank");
  }

  return (
    <section className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-900">Gerador automático de artes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Prioridade: fotos reais → templates da marca → IA só quando necessário (não usada automaticamente).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Template da marca</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as ArtTemplateId)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {(Object.entries(ART_TEMPLATE_LABELS) as [ArtTemplateId, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Dimensão</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
            {PROMPT_PURPOSES.map((p) => (
              <option key={p.id} value={p.format}>
                {p.label} ({p.format})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={generateArt}
        disabled={generating}
        className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {generating ? "Gerando arte completa..." : "Gerar arte completa"}
      </button>

      {message && <p className="text-sm text-brand-800">{message}</p>}
      {lastStats && (
        <p className="text-xs text-slate-500">
          Motor visual: {lastStats.usedRealPhotos} foto(s) real(is), {lastStats.usedTemplates} template(s) de marca.
        </p>
      )}

      {files.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {files
              .sort((a, b) => a.order - b.order)
              .map((f) => (
                <div key={f.imageId} className="rounded-xl border bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <p className="mt-1 text-xs font-semibold">
                    Slide {f.order} · {f.role === "cover" ? "Capa" : "Slide"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {f.source === "real_photo" ? "Foto real" : "Template marca"} · {f.format}
                  </p>
                </div>
              ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadExport("zip")} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Exportar PNG (ZIP)
            </button>
            <button type="button" onClick={() => downloadExport("jpg")} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Exportar JPG (ZIP)
            </button>
            <button type="button" onClick={() => downloadExport("pdf")} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Exportar PDF
            </button>
          </div>
        </>
      )}
    </section>
  );
}
