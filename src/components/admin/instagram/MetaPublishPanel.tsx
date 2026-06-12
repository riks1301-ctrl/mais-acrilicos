"use client";

import { useCallback, useEffect, useState } from "react";

type Eligibility = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  unsupportedFormat?: boolean;
  imageUrl?: string;
};

type Props = {
  postId: string;
  status: string;
  format: string;
  publicationChannel: string | null;
  instagramMediaId: string | null;
  metaPublishError: string | null;
  onPublished: () => void;
};

export function MetaPublishPanel({
  postId,
  status,
  format,
  publicationChannel,
  instagramMediaId,
  metaPublishError,
  onPublished,
}: Props) {
  const [meta, setMeta] = useState<{ mode: string; metaConnected: boolean; envAutoPublish: boolean; autoPublish: boolean } | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/admin/instagram/meta").then((r) => r.json()).then(setMeta).catch(() => {});
    fetch(`/api/admin/instagram/posts/${postId}/publish-meta`)
      .then((r) => r.json())
      .then(setEligibility)
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function publishNow() {
    const isTest = meta?.mode === "TEST";
    const confirmText = isTest
      ? "Modo TESTE: simular publicação sem enviar ao Instagram?"
      : "Tenho certeza que quero publicar este post agora no Instagram.";
    if (!confirm(confirmText)) return;

    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/admin/instagram/posts/${postId}/publish-meta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.ok) {
      setMessage(data.error || data.sanitizedError || "Falha na publicação");
      refresh();
      return;
    }
    if (data.testMode) setMessage("Modo TESTE: simulação registrada — nada foi publicado no Instagram.");
    else setMessage(`Publicado no Instagram. Media ID: ${data.mediaId}`);
    refresh();
    onPublished();
  }

  const unsupported =
    eligibility?.unsupportedFormat ||
    publicationChannel === "STORY" ||
    publicationChannel === "REELS" ||
    format === "REELS" ||
    format === "STORY";

  const carouselPrep = publicationChannel === "CAROUSEL" || format === "CAROUSEL";
  const canAttemptPublish =
    ["APPROVED", "SCHEDULED", "ERROR"].includes(status) &&
    !unsupported &&
    !carouselPrep &&
    eligibility?.ok;

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Publicação via Meta Graph API</h2>
      <p className="text-sm text-slate-600">
        API oficial — sem automação de navegador. Só publica posts aprovados, com legenda final e imagem HTTPS pública.
      </p>

      {meta && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge>Modo: {meta.mode}</Badge>
          <Badge>{meta.metaConnected ? "Conectado" : "Não conectado"}</Badge>
          <Badge>Auto: {meta.envAutoPublish && meta.autoPublish && meta.mode === "ACTIVE" ? "ON" : "OFF"}</Badge>
        </div>
      )}

      {instagramMediaId && <p className="text-sm text-green-700">Media ID no Instagram: {instagramMediaId}</p>}
      {metaPublishError && <p className="text-sm text-red-700">Último erro: {metaPublishError}</p>}

      {unsupported && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Stories e Reels não são publicados automaticamente nesta versão.
        </p>
      )}

      {carouselPrep && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Carrossel via Meta API ainda não está habilitado. Use Feed com 1 imagem (role &quot;cover&quot;) ou publique manualmente no app.
        </p>
      )}

      {eligibility && !eligibility.ok && (
        <ul className="text-sm text-red-700 list-disc pl-5">
          {eligibility.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {eligibility?.warnings?.map((w) => (
        <p key={w} className="text-xs text-amber-800">⚠️ {w}</p>
      ))}

      <button
        type="button"
        onClick={publishNow}
        disabled={loading || !canAttemptPublish}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Publicando..." : "Publicar agora no Instagram"}
      </button>

      {!canAttemptPublish && !loading && (
        <p className="text-xs text-slate-500">
          Para publicar: aprove o post, vincule imagem cover (HTTPS), configure Meta em modo TESTE ou ATIVO, e use formato Feed.
        </p>
      )}

      {message && <p className="text-sm font-medium text-slate-800">{message}</p>}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">{children}</span>;
}
