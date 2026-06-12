import { cn } from "@/lib/utils";

export function Section({ children, className, id, dark }: { children: React.ReactNode; className?: string; id?: string; dark?: boolean }) {
  return <section id={id} className={cn("py-16 md:py-24", dark ? "bg-surface-dark text-white" : "bg-white", className)}><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div></section>;
}

export function SectionHeader({ badge, title, subtitle, light }: { badge?: string; title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="mb-12 text-center">
      {badge && <span className={cn("mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold", light ? "bg-white/10 text-brand-300" : "bg-brand-50 text-brand-700")}>{badge}</span>}
      <h2 className={cn("text-3xl font-bold md:text-4xl lg:text-5xl", light ? "text-white" : "text-slate-900")}>{title}</h2>
      {subtitle && <p className={cn("mx-auto mt-4 max-w-2xl text-lg", light ? "text-slate-300" : "text-slate-600")}>{subtitle}</p>}
    </div>
  );
}
