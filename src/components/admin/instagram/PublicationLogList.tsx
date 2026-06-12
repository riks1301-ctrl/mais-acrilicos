"use client";

type Log = { id: string; action: string; createdAt: string; details: unknown; errorMessage: string | null };

export function PublicationLogList({ logs }: { logs: Log[] }) {
  if (!logs.length) return <p className="text-sm text-slate-500">Nenhum log ainda.</p>;

  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <li key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-800">{log.action}</span>
          <span className="text-slate-500"> — {new Date(log.createdAt).toLocaleString("pt-BR")}</span>
          {log.errorMessage && <p className="text-red-600">{log.errorMessage}</p>}
        </li>
      ))}
    </ul>
  );
}
