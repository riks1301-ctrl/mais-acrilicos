"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MetaStatus = {
  mode: string;
  metaConnected: boolean;
  autoPublish: boolean;
  envAutoPublish: boolean;
  metaLastError: string | null;
  validation: { ok: boolean; errors: string[] };
};

export function MetaStatusBanner() {
  const [meta, setMeta] = useState<MetaStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/instagram/meta")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  if (!meta) return null;

  const autoOn = meta.envAutoPublish && meta.autoPublish && meta.mode === "ACTIVE";

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
      <p>
        <strong>Meta Graph API:</strong>{" "}
        {meta.metaConnected ? "conectado" : "não conectado"} · modo <strong>{meta.mode}</strong> · auto publish{" "}
        <strong>{autoOn ? "LIGADO" : "DESLIGADO"}</strong>
        {!autoOn && " (padrão seguro — nada publica sozinho)"}
      </p>
      {meta.metaLastError && <p className="text-red-800">Último erro Meta: {meta.metaLastError}</p>}
      {!meta.validation.ok && meta.mode !== "DISABLED" && (
        <p className="text-amber-900">{meta.validation.errors.join(" · ")}</p>
      )}
      <p>
        Agendamento interno <strong>não publica</strong> no Instagram até você usar &quot;Publicar agora via Meta API&quot; ou ativar auto publish com dupla confirmação (.env + painel).{" "}
        <Link href="/admin/instagram/meta" className="font-semibold underline">
          Configurar Meta →
        </Link>
      </p>
    </div>
  );
}
