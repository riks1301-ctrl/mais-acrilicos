"use client";

type Approval = {
  id: string;
  status: string;
  notes: string | null;
  reviewedAt: string;
  adminId: string | null;
};

const LABELS: Record<string, string> = {
  approved: "Aprovado",
  rejected: "Reprovado",
  adjustments_requested: "Ajustes solicitados",
};

export function ApprovalHistory({ approvals }: { approvals: Approval[] }) {
  if (!approvals.length) return null;

  return (
    <div className="rounded-xl border p-4">
      <h4 className="text-sm font-bold text-slate-700">Histórico de aprovação</h4>
      <ul className="mt-2 space-y-2">
        {approvals.map((a) => (
          <li key={a.id} className="text-xs text-slate-600">
            <span className="font-semibold">{LABELS[a.status] ?? a.status}</span>
            {" — "}
            {new Date(a.reviewedAt).toLocaleString("pt-BR")}
            {a.notes && <p className="mt-0.5 text-slate-500">{a.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
