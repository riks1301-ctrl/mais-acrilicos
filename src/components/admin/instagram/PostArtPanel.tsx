"use client";

import { ART_TEMPLATE_LABELS } from "@/lib/instagram/art/brand-library";
import { ART_GEN_SLIDE_TIMEOUT_MS } from "@/lib/instagram/art/status";
import { PROMPT_PURPOSES } from "@/lib/instagram/images/constants";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { ArtTemplateId } from "@/lib/instagram/art/types";
import type { IgArtGenStatus } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

const STATUS_LABEL: Record<IgArtGenStatus, string> = {
  IDLE: "Pronto para gerar",
  GENERATING: "Gerando imagens...",
  READY: "Artes prontas",
  FAILED: "Falha na geração",
};

type ArtFile = {
  imageId: string;
  url: string;
  role: string;
  order: number;
  format: string;
  source: "real_photo" | "brand_template";
};

type ArtGenState = {
  artGenStatus: IgArtGenStatus;
  artGenError: string | null;
  artGenProgress: number;
  artGenTotal: number;
};

type Props = {
  postId: string;
  visualFormat: string | null;
  artFiles: ArtFile[];
  artGen: ArtGenState;
  onRefresh: () => void;
};

export function PostArtPanel({ postId, visualFormat, artFiles, artGen: initialArtGen, onRefresh }: Props) {
  const [templateId, setTemplateId] = useState<ArtTemplateId>("carousel");
  const [format, setFormat] = useState(visualFormat ?? "1080x1080");
  const [artGen, setArtGen] = useState<ArtGenState>(initialArtGen);
  const [generating, setGenerating] = useState(initialArtGen.artGenStatus === "GENERATING");
  const [lastStats, setLastStats] = useState<{ usedRealPhotos: number; usedTemplates: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setArtGen(initialArtGen);
    setGenerating(initialArtGen.artGenStatus === "GENERATING");
  }, [initialArtGen]);

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/admin/instagram/posts/${postId}/art/generate`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.artGen) {
      setArtGen(data.artGen);
      if (data.artGen.artGenStatus !== "GENERATING") {
        setGenerating(false);
        onRefresh();
      }
    }
  }, [postId, onRefresh]);

  useEffect(() => {
    if (artGen.artGenStatus !== "GENERATING") return;
    const id = setInterval(pollStatus, 2500);
    return () => clearInterval(id);
  }, [artGen.artGenStatus, pollStatus]);

  async function resetGeneration() {
    await fetch(`/api/admin/instagram/posts/${postId}/art/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    setArtGen({
      artGenStatus: "IDLE",
      artGenError: null,
      artGenProgress: 0,
      artGenTotal: 0,
    });
    setMessage(null);
    setGenerating(false);
    onRefresh();
  }

  async function generateArt() {
    setGenerating(true);
    setMessage(null);

    let totalReal = 0;
    let totalTemplates = 0;

    try {
      const prepRes = await fetchWithTimeout(`/api/admin/instagram/posts/${postId}/art/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, format, prepareOnly: true }),
        timeoutMs: 30_000,
      });
      const prep = await prepRes.json();
      if (!prepRes.ok) throw new Error(prep.error || "Erro ao preparar carrossel");

      const slideCount = prep.slideCount ?? 6;
      setArtGen({
        artGenStatus: "GENERATING",
        artGenError: null,
        artGenProgress: 0,
        artGenTotal: slideCount,
      });

      for (let order = 1; order <= slideCount; order++) {
        setMessage(`Gerando slide ${order}/${slideCount}...`);
        setArtGen((s) => ({ ...s, artGenProgress: order - 1 }));

        const res = await fetchWithTimeout(`/api/admin/instagram/posts/${postId}/art/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            format,
            slideOrder: order,
            finalize: order === slideCount,
          }),
          timeoutMs: ART_GEN_SLIDE_TIMEOUT_MS,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Erro no slide ${order}`);

        totalReal += data.usedRealPhotos ?? 0;
        totalTemplates += data.usedTemplates ?? 0;
        if (data.artGen) setArtGen(data.artGen);
      }

      setLastStats({ usedRealPhotos: totalReal, usedTemplates: totalTemplates });
      setMessage(`Arte gerada: ${slideCount} slides · ${totalReal} fotos reais · ${totalTemplates} templates`);
      onRefresh();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Erro desconhecido";
      setMessage(err);
      setArtGen((s) => ({ ...s, artGenStatus: "FAILED", artGenError: err }));
      await pollStatus();
    } finally {
      setGenerating(false);
    }
  }

  function downloadExport(fmt: "png" | "jpg" | "pdf" | "zip") {
    window.open(`/api/admin/instagram/posts/${postId}/art/export?format=${fmt}`, "_blank");
  }

  const files = artFiles.length ? artFiles : [];
  const isGenerating = generating || artGen.artGenStatus === "GENERATING";
  const statusColor =
    artGen.artGenStatus === "FAILED"
      ? "border-red-200 bg-red-50 text-red-900"
      : artGen.artGenStatus === "READY"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : artGen.artGenStatus === "GENERATING"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <section className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-900">Gerador automático de artes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Prioridade: fotos reais → templates da marca → IA só quando necessário (não usada automaticamente).
        </p>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${statusColor}`}>
        <p className="font-semibold">{STATUS_LABEL[artGen.artGenStatus]}</p>
        {artGen.artGenStatus === "GENERATING" && artGen.artGenTotal > 0 && (
          <p className="mt-1 text-xs">
            Progresso: {artGen.artGenProgress}/{artGen.artGenTotal} slides
          </p>
        )}
        {artGen.artGenError && <p className="mt-1 text-xs">Erro: {artGen.artGenError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Template da marca</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as ArtTemplateId)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            disabled={isGenerating}
          >
            {(Object.entries(ART_TEMPLATE_LABELS) as [ArtTemplateId, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Dimensão</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" disabled={isGenerating}>
            {PROMPT_PURPOSES.map((p) => (
              <option key={p.id} value={p.format}>{p.label} ({p.format})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateArt}
          disabled={isGenerating}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isGenerating ? "Gerando arte completa..." : "Gerar arte completa"}
        </button>
        {(artGen.artGenStatus === "FAILED" || artGen.artGenStatus === "GENERATING") && (
          <button type="button" onClick={resetGeneration} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            Tentar novamente
          </button>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.includes("Erro") || message.includes("Falha") || message.includes("esgotado") ? "text-red-600" : "text-brand-800"}`}>
          {message}
        </p>
      )}
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
