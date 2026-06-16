"use client";

import { categoryLabel } from "@/lib/instagram/images/constants";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { IgImageCategory } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type DriveImage = {
  id: string;
  url: string;
  filename: string | null;
  driveFolderPath: string | null;
  driveMainFolder: string | null;
  clientName: string | null;
  category: IgImageCategory | null;
  sourceProvider: string;
  thumbnailUrl: string | null;
  fileModifiedAt: string | null;
  metaCheck: { ok: boolean; reason: string };
};

type DriveConfig = {
  googleDriveFolderId: string | null;
  googleDriveLocalPath: string | null;
  googleDriveLastSyncAt: string | null;
  googleDriveLastSyncError: string | null;
  googleDriveSyncCount: number;
};

type EnvInfo = {
  apiConfigured: boolean;
  localConfigured: boolean;
  localAvailable: boolean;
  showLocalUi: boolean;
  localDriveRoot: string | null;
  readOnly: boolean;
};

type SyncStats = {
  categories: Record<string, number>;
  clients: Record<string, number>;
  errors?: string[];
};

export function DrivePageClient() {
  const [config, setConfig] = useState<DriveConfig | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [images, setImages] = useState<DriveImage[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [folderFilter, setFolderFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSyncStats, setLastSyncStats] = useState<SyncStats | null>(null);
  const [linkPostId, setLinkPostId] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "48");
    if (folderFilter) params.set("folder", folderFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (clientFilter) params.set("client", clientFilter);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/instagram/drive?${params}`);
    const data = await res.json();
    if (res.ok) {
      setConfig(data.brand);
      setEnvInfo(data.env);
      setImages(data.images ?? []);
      setStats(data.stats ?? null);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      setFolderId(data.brand?.googleDriveFolderId ?? data.env?.localDriveRoot ?? "");
      setLocalPath(data.brand?.googleDriveLocalPath ?? data.env?.localDriveRoot ?? "");
    }
    setLoading(false);
  }, [folderFilter, categoryFilter, clientFilter, q, page]);

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
        timeoutMs: 300_000,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setLastSyncStats({ categories: data.categories ?? {}, clients: data.clients ?? {}, errors: data.errors });
      } else {
        setMessage(data.error);
      }
      if (res.ok) load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha na sincronização");
    } finally {
      setSyncing(false);
    }
  }

  async function linkToPost(imageId: string, role: "cover" | "attachment" = "cover") {
    if (!linkPostId.trim()) {
      setMessage("Informe o ID do post para vincular.");
      return;
    }
    setLinkingId(imageId);
    const res = await fetch("/api/admin/instagram/drive/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, postId: linkPostId.trim(), role }),
    });
    const data = await res.json();
    setLinkingId(null);
    setMessage(data.message || data.error);
  }

  const folders = Object.keys(stats?.clients ?? {}).length
    ? Array.from(new Set(images.map((i) => i.driveMainFolder).filter(Boolean))) as string[]
    : [];
  const categories = Object.keys(stats?.categories ?? {});
  const clients = Object.keys(stats?.clients ?? {}).filter((c) => c !== "SEM_CLIENTE");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biblioteca — Meu Drive</h2>
        <p className="mt-1 text-slate-600">
          Modo <strong>somente leitura</strong>: o agente cataloga e usa suas fotos sem apagar, renomear ou mover arquivos.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Configuração</h3>

        {envInfo?.showLocalUi ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <p className="font-semibold">Modo local (Windows)</p>
            <p className="mt-1 font-mono text-xs">{envInfo.localDriveRoot ?? localPath ?? "LOCAL_DRIVE_ROOT não definido"}</p>
            <p className="mt-1 text-xs">
              Status: {envInfo.localAvailable ? "pasta acessível" : "pasta não encontrada neste servidor"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Modo local oculto — em produção use a API do Google Drive abaixo.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {envInfo?.showLocalUi && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">LOCAL_DRIVE_ROOT</label>
              <input
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="G:\Meu Drive"
                className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Google Drive Folder ID (produção)</label>
            <input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="1DDqB_Np06gbUVLcRay0OCpxK4ZZN0aiF"
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveConfig} disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {envInfo?.showLocalUi && (
            <button
              type="button"
              onClick={() => syncDrive("local_dev")}
              disabled={syncing}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
            >
              {syncing ? "Sincronizando..." : "Sincronizar Meu Drive"}
            </button>
          )}
          {envInfo?.apiConfigured && (
            <button type="button" onClick={() => syncDrive("google_drive")} disabled={syncing} className="rounded-xl border px-4 py-2 text-sm font-semibold">
              {syncing ? "Sincronizando..." : "Sincronizar via API"}
            </button>
          )}
          <button type="button" onClick={testConnection} disabled={testing} className="rounded-xl border px-4 py-2 text-sm font-semibold">
            {testing ? "Testando..." : "Testar API Drive"}
          </button>
        </div>

        {config && (
          <p className="text-xs text-slate-500">
            Última sync: {config.googleDriveLastSyncAt ? new Date(config.googleDriveLastSyncAt).toLocaleString("pt-BR") : "nunca"} ·{" "}
            {config.googleDriveSyncCount} imagens indexadas
            {config.googleDriveLastSyncError && (
              <span className="block text-red-600">Erro: {config.googleDriveLastSyncError}</span>
            )}
          </p>
        )}

        {lastSyncStats && (
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold">Última sincronização</p>
            <p className="mt-1">Categorias: {Object.entries(lastSyncStats.categories).map(([k, v]) => `${k} (${v})`).join(", ") || "—"}</p>
            <p className="mt-1">Clientes: {Object.entries(lastSyncStats.clients).map(([k, v]) => `${k} (${v})`).join(", ") || "—"}</p>
            {lastSyncStats.errors && lastSyncStats.errors.length > 0 && (
              <p className="mt-1 text-red-600">Erros: {lastSyncStats.errors.slice(0, 3).join("; ")}</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-3">
        <h3 className="font-bold">Usar no post</h3>
        <input
          value={linkPostId}
          onChange={(e) => setLinkPostId(e.target.value)}
          placeholder="ID do post (cole do detalhe do post)"
          className="w-full max-w-lg rounded-xl border px-3 py-2 text-sm font-mono"
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{categoryLabel(c as IgImageCategory)} ({stats?.categories[c]})</option>
          ))}
        </select>
        <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todos clientes</option>
          {clients.map((c) => (
            <option key={c} value={c}>{c} ({stats?.clients[c]})</option>
          ))}
        </select>
        <select value={folderFilter} onChange={(e) => { setFolderFilter(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Todas pastas</option>
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar arquivo, pasta ou cliente..."
          className="rounded-xl border px-3 py-2 text-sm min-w-[200px]"
        />
      </div>

      {message && <p className={`text-sm ${message.includes("Erro") || message.includes("Falha") ? "text-red-600" : "text-emerald-800"}`}>{message}</p>}

      {loading ? (
        <p className="text-slate-500">Carregando catálogo...</p>
      ) : images.length === 0 ? (
        <p className="text-slate-500">Nenhuma imagem indexada. Clique em Sincronizar Meu Drive.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {pagination.total} imagens · página {pagination.page}/{pagination.totalPages}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="rounded-xl border bg-white p-2 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumbnailUrl ?? img.url} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
                <p className="mt-2 text-xs font-semibold line-clamp-1">{img.filename}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{img.driveFolderPath}</p>
                <p className="text-xs text-brand-700">
                  {img.category ? categoryLabel(img.category) : "Sem categoria"}
                  {img.clientName ? ` · ${img.clientName}` : ""}
                </p>
                {img.fileModifiedAt && (
                  <p className="text-xs text-slate-400">{new Date(img.fileModifiedAt).toLocaleDateString("pt-BR")}</p>
                )}
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => linkToPost(img.id, "cover")}
                    disabled={linkingId === img.id}
                    className="w-full rounded-lg border px-2 py-1.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    {linkingId === img.id ? "Vinculando..." : "Usar como capa"}
                  </button>
                  <button
                    type="button"
                    onClick={() => linkToPost(img.id, "attachment")}
                    disabled={linkingId === img.id}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50"
                  >
                    Adicionar ao carrossel
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex gap-2 justify-center">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40">
                Anterior
              </button>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40">
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
