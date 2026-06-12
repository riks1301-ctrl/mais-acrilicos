import type { AgentRecommendation } from "@/lib/instagram/metrics/types";
import Link from "next/link";

const PRIORITY_CLS: Record<AgentRecommendation["priority"], string> = {
  high: "ring-2 ring-brand-400",
  medium: "ring-1 ring-slate-200",
  low: "ring-1 ring-slate-100 opacity-90",
};

export function RecommendationCard({ rec }: { rec: AgentRecommendation }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-card ${PRIORITY_CLS[rec.priority]}`}>
      <p className="text-xs font-semibold uppercase text-brand-600">{rec.type.replace("_", " ")}</p>
      <p className="mt-1 font-bold text-slate-900">{rec.message}</p>
      <p className="mt-2 text-sm text-slate-600">{rec.rationale}</p>
      {rec.postId && (
        <Link href={`/admin/instagram/posts/${rec.postId}`} className="mt-2 inline-block text-xs font-semibold text-brand-600">
          Ver post relacionado →
        </Link>
      )}
    </div>
  );
}
