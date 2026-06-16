"use client";

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useCallback, useEffect, useState } from "react";

type DriveImage = {
  id: string;
  url: string;
  filename: string | null;
  driveFolderPath: string | null;
  sourceProvider: string;
  thumbnailUrl: string | null;
  metaCheck: { ok: boolean; reason: string };
};

type DriveConfig = {
  googleDriveFolderId: string | null;
  googleDriveLocalPath: string | null;
  googleDriveLastSyncAt: string | null;
  googleDriveLastSyncError: string | null;
  googleDriveSyncCount: number;
};

export function DrivePageClient() {
  const [config, setConfig] = useState<DriveConfig | null>(null);
  const [envInfo, setEnvInfo] = useState<{ apiConfigured: boolean; localConfigured: boolean } | null>(null);
  const [images, setImages] = useState<DriveImage[]>([]);
  const [folderFilter, setFolderFilter] = useState("");
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [linkPostId, setLinkPostId] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (folderFilter) params.set("folder", folderFilter);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/instagram/drive?${params}`);
    const data = await res.json();
    if (res.ok) {
      setConfig(data.brand);
      setEnvInfo(data.env);
      setImages(data.images ?? []);
      setFolderId(data.brand?.googleDriveFolderId ?? "");
      setLocalPath(data.brand?.googleDriveLocalPath ?? "");
    }
    setLoading(false);
  }, [folderFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/drive", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleDriveFolderId: folderId || null,
        googleDriveLocalPath: localPath || null,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "Configuração salva." : (await res.json()).error);
    if (res.ok) load();
  }

  async function testConnection() {
    if (!folderId) {
      setMessage("Informe o Folder ID antes de testar.");
      return;
    }
    setTesting(true);
    const res = await fetch("/api/admin/instagram/drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    const data = await res.json();
    setTesting(false);
    setMessage(data.message || data.error);
  }

  async function syncDrive(mode: "auto" | "google_drive" | "local_dev" = "auto") {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetchWithTimeout("/api/admin/instagram/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        timeoutMs: 120_000,
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : data.error);
      if (res.ok) load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha na sincronização");
    } finally {
      setSyncing(false);
    }
  }

  async function linkToPost(imageId: string) {
    if (!linkPostId.trim()) {
      setMessage("Informe o ID do post para vincular.");
      return;
    }
    setLinkingId(imageId);
    const res = await fetch("/api/admin/instagram/drive/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, postId: linkPostId.trim(), role: "cover" }),
    });
    const data = await res.json();
    setLinkingId(null);
    setMessage(data.message || data.error);
  }

  const folders = Array.from(new Set(images.map((i) => i.driveFolderPath).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Google Drive — biblioteca de imagens</h2>
        <p className="mt-1 text-slate-600">
          Indexa fotos do Drive sem upload. Em dev, use a pasta sincronizada no Windows. Em produção, use a API oficial.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Conectar e configurar</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Google Drive Folder ID (produção)</label>
            <input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="1DDqB_Np06gbUVLcRay0OCpxK4ZZN0aiF"
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Pasta local (dev / Windows)</label>
            <input
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="G:\...\Fotos"
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveConfig} disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {saving ? "Salvando..." : "Salvar configuração"}
          </button>
          <button type="button" onClick={testConnection} disabled={testing} className="rounded-xl border px-4 py-2 text-sm font-semibold">
            {testing ? "Testando..." : "Testar conexão Drive"}
          </button>
          <button type="button" onClick={() => syncDrive("auto")} disabled={syncing} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            {syncing ? "Sincronizando..." : "Sincronizar Google Drive"}
          </button>
        </div>

        {config && (
          <p className="text-xs text-slate-500">
            Última sync: {config.googleDriveLastSyncAt ? new Date(config.googleDriveLastSyncAt).toLocaleString("pt-BR") : "nunca"} ·{" "}
            {config.googleDriveSyncCount} imagens · API: {envInfo?.apiConfigured ? "ok" : "pendente"} · Local:{" "}
            {envInfo?.localConfigured ? "ok" : "pendente"}
            {config.googleDriveLastSyncError && (
              <span className="block text-red-600">Erro: {config.googleDriveLastSyncError}</span>
            )}
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Vincular ao post</h3>
        <input
          value={linkPostId}
          onChange={(e) => setLinkPostId(e.target.value)}
          placeholder="Cole o ID do post (ex: clxyz...)"
          className="w-full max-w-lg rounded-xl border px-3 py-2 text-sm font-mono"
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todas as pastas</option>
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar arquivo..."
          className="rounded-xl border px-3 py-2 text-sm"
        />
      </div>

      {message && <p className={`text-sm ${message.includes("Erro") || message.includes("Falha") ? "text-red-600" : "text-emerald-800"}`}>{message}</p>}

      {loading ? (
        <p className="text-slate-500">Carregando catálogo...</p>
      ) : images.length === 0 ? (
        <p className="text-slate-500">Nenhuma imagem indexada. Clique em Sincronizar Google Drive.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="rounded-xl border bg-white p-2 shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnailUrl ?? img.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <p className="mt-2 text-xs font-semibold line-clamp-1">{img.filename}</p>
              <p className="text-xs text-slate-500">{img.driveFolderPath}</p>
              <p className={`mt-1 text-xs ${img.metaCheck.ok ? "text-emerald-700" : "text-amber-700"}`}>
                Meta: {img.metaCheck.ok ? "HTTPS ok" : img.metaCheck.reason}
              </p>
              <button
                type="button"
                onClick={() => linkToPost(img.id)}
                disabled={linkingId === img.id}
                className="mt-2 w-full rounded-lg border px-2 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                {linkingId === img.id ? "Vinculando..." : "Usar esta imagem no post"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
