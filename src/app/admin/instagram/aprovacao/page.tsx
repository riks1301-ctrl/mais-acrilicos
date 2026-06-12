import { ApprovalQueue } from "@/components/admin/instagram/ApprovalQueue";

export default function InstagramApprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Fila de aprovação</h2>
        <p className="mt-1 text-slate-600">
          Revise legendas, imagens e score comercial. Agendamento é fila interna — publicação no Instagram só via Meta API (manual ou auto, se ativado).
        </p>
      </div>
      <ApprovalQueue />
    </div>
  );
}
