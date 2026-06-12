import { IG_CONTENT_TYPE_LABELS, IG_FORMAT_LABELS, IG_STATUS_LABELS } from "@/lib/instagram/constants";
import type { IgContentType, IgPostFormat, IgPostStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<IgPostStatus, string> = {
  IDEA: "bg-slate-100 text-slate-700",
  CREATING: "bg-blue-100 text-blue-800",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  SCHEDULED: "bg-purple-100 text-purple-800",
  PUBLISHED: "bg-brand-100 text-brand-800",
  REJECTED: "bg-red-100 text-red-800",
  ERROR: "bg-red-200 text-red-900",
};

export function StatusBadge({ status }: { status: IgPostStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status])}>
      {IG_STATUS_LABELS[status]}
    </span>
  );
}

export function FormatBadge({ format }: { format: IgPostFormat }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{IG_FORMAT_LABELS[format]}</span>;
}

export function ContentTypeBadge({ type }: { type: IgContentType | null }) {
  if (!type) return null;
  return <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{IG_CONTENT_TYPE_LABELS[type]}</span>;
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-100 text-green-800" : score >= 65 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", color)}>{score}/100</span>;
}
