"use client";

type Log = { id: string; action: string; createdAt: string; details: unknown; errorMessage: string | null };

function safeDetail(details: unknown, key: string): string | null {
  if (!details || typeof details !== "object") return null;
  const v = (details as Record<string, unknown>)[key];
  if (v === undefined || v === null) return null;
  return String(v);
}

export function PublicationLogList({ logs }: { logs: Log[] }) {
  if (!logs.length) return <p className="text-sm text-slate-500">Nenhum log ainda.</p>;

  return (
    <ul className="space-y-2">
      {logs.map((log) => {
        const mode = safeDetail(log.details, "mode");
        const mediaId = safeDetail(log.details, "mediaId");
        const containerId = safeDetail(log.details, "mediaContainerId");
        const previousStatus = safeDetail(log.details, "previousStatus");
        const simulated = safeDetail(log.details, "simulated");

        return (
          <li key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-semibold text-slate-800">{log.action}</span>
            <span className="text-slate-500"> — {new Date(log.createdAt).toLocaleString("pt-BR")}</span>
            <div className="mt-1 space-y-0.5 text-slate-600">
              {mode && <p>Modo Meta: {mode}</p>}
              {previousStatus && <p>Status anterior: {previousStatus}</p>}
              {mediaId && <p>Media ID: {mediaId}</p>}
              {containerId && <p>Container ID: {containerId}</p>}
              {simulated === "true" && <p className="text-amber-700">Simulação (modo TESTE)</p>}
            </div>
            {log.errorMessage && <p className="mt-1 text-red-600">{log.errorMessage}</p>}
          </li>
        );
      })}
    </ul>
  );
}
