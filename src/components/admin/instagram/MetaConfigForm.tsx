"use client";

import { MetaSetupGuide } from "@/components/admin/instagram/MetaSetupGuide";
import { useEffect, useState } from "react";

const DEFAULT_IG_ID = "27079826968347998";
const DEFAULT_APP_ID = "3200368863497226";
const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm";

type MetaStatus = {
  mode: string;
  autoPublish: boolean;
  envAutoPublish: boolean;
  metaConnected: boolean;
  metaPageId: string | null;
  metaIgUserId: string | null;
  metaAppId: string | null;
  tokenMasked: string | null;
  tokenExpiresAt: string | null;
  metaLastError: string | null;
  metaLastValidatedAt: string | null;
  apiVersion: string;
  graphHost?: string;
  tokenDiagnostics?: {
    tokenSource: string;
    envTokenSet: boolean;
    graphHost: string;
    tokenLength: number;
    tokenPrefix: string | null;
    looksLikeInstagram: boolean;
    looksLikeStripe: boolean;
  };
  validation: { ok: boolean; errors: string[]; warnings: string[] };
};

export function MetaConfigForm() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [pageId, setPageId] = useState("");
  const [igId, setIgId] = useState("");
  const [appId, setAppId] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("DISABLED");
  const [autoPublish, setAutoPublish] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/instagram/meta");
    const data = await res.json();
    setStatus(data);
    setPageId(data.metaPageId ?? "");
    setIgId(data.metaIgUserId ?? "");
    setAppId(data.metaAppId ?? "");
    setMode(data.mode ?? "DISABLED");
    setAutoPublish(data.autoPublish ?? false);
    setExpiresAt(data.tokenExpiresAt ? data.tokenExpiresAt.slice(0, 16) : "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaPageId: pageId,
        metaIgUserId: igId,
        metaAppId: appId || undefined,
        metaMode: mode,
        metaAutoPublish: mode === "ACTIVE" ? autoPublish : false,
        metaTokenExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        ...(token ? { accessToken: token } : {}),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage((await res.json()).error);
      return;
    }
    setToken("");
    setMessage(
      token
        ? "Salvo! Token guardado no servidor (o campo fica vazio por segurança). Agora clique Testar conexão Meta."
        : `Salvo! Modo: ${mode}. IDs e configuração gravados no banco.`
    );
    load();
  }

  async function clearStoredToken() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearStoredToken: true, metaMode: mode }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage((await res.json()).error);
      return;
    }
    setMessage("Token do painel removido. O servidor usará META_ACCESS_TOKEN da Vercel.");
    load();
  }

  async function validate() {
    setValidating(true);
    setMessage(null);
    const res = await fetch("/api/admin/instagram/meta/validate", { method: "POST" });
    const data = await res.json();
    setValidating(false);
    setMessage(res.ok ? `Conexão OK${data.account?.username ? ` (@${data.account.username})` : ""}` : data.errors?.join(", ") || "Falha");
    load();
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      <MetaSetupGuide />

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Importante:</strong> tokens ficam no servidor (.env e/ou banco criptografado). O painel nunca mostra o token completo.
        Modo <strong>TESTE</strong> valida sem publicar. Modo <strong>ATIVO</strong> publica de verdade via Graph API.
      </div>

      {status && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Meta conectado" value={status.metaConnected ? "Sim" : "Não"} />
          <Stat label="Modo" value={status.mode} />
          <Stat label="Auto publish (painel)" value={status.autoPublish ? "Ligado" : "Desligado"} />
          <Stat label="Auto publish (.env)" value={status.envAutoPublish ? "Ligado" : "Desligado"} />
        </div>
      )}

      {status?.metaLastError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">Último erro: {status.metaLastError}</div>
      )}

      {status?.tokenDiagnostics && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 space-y-1">
          <p><strong>Diagnóstico do token (sem expor o valor):</strong></p>
          <p>Origem: <strong>{status.tokenDiagnostics.tokenSource}</strong> · API: <strong>{status.tokenDiagnostics.graphHost}</strong></p>
          <p>
            Tamanho: <strong>{status.tokenDiagnostics.tokenLength}</strong> · Início: <strong>{status.tokenDiagnostics.tokenPrefix ?? "—"}</strong>
            {status.tokenDiagnostics.looksLikeStripe && " · ⚠️ Parece Stripe (sk_) — troque na Vercel"}
            {status.tokenDiagnostics.tokenLength > 0 && !status.tokenDiagnostics.looksLikeInstagram && !status.tokenDiagnostics.looksLikeStripe && " · ⚠️ Deveria começar com IG"}
            {status.tokenDiagnostics.looksLikeInstagram && " · ✓ Formato IG ok"}
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-card grid gap-4 md:grid-cols-2">
        <Field label="Facebook Page ID">
          <input value={pageId} onChange={(e) => setPageId(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Instagram Business Account ID">
          <input value={igId} onChange={(e) => setIgId(e.target.value)} className={inputCls} />
        </Field>
        <Field label="App ID (opcional)">
          <input value={appId} onChange={(e) => setAppId(e.target.value)} className={inputCls} />
        </Field>
        <Field label={`Access Token ${status?.tokenMasked ? `(atual: ${status.tokenMasked})` : ""}`}>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className={inputCls} placeholder="Cole novo token para atualizar" />
        </Field>
        <Field label="Expiração do token">
          <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Modo">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
            <option value="DISABLED">DESATIVADO</option>
            <option value="TEST">TESTE (não publica)</option>
            <option value="ACTIVE">ATIVO (publica via API)</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoPublish}
              disabled={mode !== "ACTIVE"}
              onChange={(e) => setAutoPublish(e.target.checked)}
            />
            Publicação automática no job run-due (exige INSTAGRAM_AUTO_PUBLISH=true no .env e modo ATIVO)
          </label>
          {mode !== "ACTIVE" && autoPublish && (
            <p className="mt-1 text-xs text-amber-700">Auto publish só funciona em modo ATIVO.</p>
          )}
        </div>
        <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-2">
          <p>
            <strong>Access Token:</strong> depois de salvar, o campo fica vazio de propósito. Se aparecer{" "}
            <code className="rounded bg-white px-1">•••••••• (configurado no servidor)</code>, o token foi gravado.
          </p>
          <p>
            <strong>Vercel:</strong> variáveis &quot;Sensitive&quot; não mostram o valor ao reabrir — isso é normal. Só confirme a mensagem &quot;Updated successfully&quot; e faça Redeploy.
          </p>
        </div>
      </div>

      {message && <p className={`text-sm ${message.includes("OK") || message.includes("salva") ? "text-green-700" : "text-red-600"}`}>{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white">
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
        <button type="button" onClick={validate} disabled={validating} className="rounded-xl border px-6 py-2.5 text-sm font-semibold">
          {validating ? "Validando..." : "Testar conexão Meta"}
        </button>
        <button type="button" onClick={clearStoredToken} disabled={saving} className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-900">
          Usar token da Vercel (limpar painel)
        </button>
        <button
          type="button"
          onClick={async () => {
            setIgId(DEFAULT_IG_ID);
            setAppId(DEFAULT_APP_ID);
            setMode("TEST");
            setSaving(true);
            const res = await fetch("/api/admin/instagram/meta", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                metaIgUserId: DEFAULT_IG_ID,
                metaAppId: DEFAULT_APP_ID,
                metaMode: "TEST",
              }),
            });
            setSaving(false);
            setMessage(
              res.ok
                ? "IDs e modo TESTE salvos no banco. Agora cole o token IG e clique Salvar."
                : (await res.json()).error || "Erro ao salvar"
            );
            if (res.ok) load();
          }}
          className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-2.5 text-sm font-semibold text-brand-800"
        >
          Preencher IDs padrão
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("DISABLED");
            setAutoPublish(false);
            setMessage("Modo emergência: defina DESATIVADO + auto publish off e clique Salvar.");
          }}
          className="rounded-xl border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-700"
        >
          Desligar tudo (emergência)
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}
