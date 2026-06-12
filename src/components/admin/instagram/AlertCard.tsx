import type { PerformanceAlert } from "@/lib/instagram/metrics/types";
import Link from "next/link";

const SEV_CLS: Record<PerformanceAlert["severity"], string> = {
  critical: "border-red-300 bg-red-50 text-red-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-300 bg-green-50 text-green-900",
};

export function AlertCard({ alert }: { alert: PerformanceAlert }) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${SEV_CLS[alert.severity]}`}>
      <p className="font-bold">{alert.title}</p>
      <p className="mt-1">{alert.message}</p>
      {alert.postId && (
        <Link href={`/admin/instagram/posts/${alert.postId}`} className="mt-2 inline-block text-xs font-semibold underline">
          Ver post →
        </Link>
      )}
    </div>
  );
}
