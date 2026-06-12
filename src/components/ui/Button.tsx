import { cn } from "@/lib/utils";
import Link from "next/link";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25",
  secondary: "bg-accent text-white hover:bg-accent-dark",
  outline: "border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white",
};
const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg" };

export function Button({ variant = "primary", size = "md", href, className, children, ...props }: {
  variant?: keyof typeof variants; size?: keyof typeof sizes; href?: string; className?: string;
  children: React.ReactNode; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void;
}) {
  const cls = cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all", variants[variant], sizes[size], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...props}>{children}</button>;
}
