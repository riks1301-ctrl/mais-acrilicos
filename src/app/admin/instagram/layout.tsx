import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Instagram Agent | Mais Acrílicos", robots: { index: false, follow: false } };

const nav = [
  { label: "Dashboard", href: "/admin/instagram" },
  { label: "Marca", href: "/admin/instagram/marca" },
  { label: "Posts", href: "/admin/instagram/posts" },
  { label: "Aprovação", href: "/admin/instagram/aprovacao" },
  { label: "Imagens", href: "/admin/instagram/imagens" },
  { label: "Google Drive", href: "/admin/instagram/drive" },
  { label: "Calendário", href: "/admin/instagram/calendario" },
  { label: "Meta API", href: "/admin/instagram/meta" },
  { label: "Performance", href: "/admin/instagram/performance" },
];

export default async function InstagramAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">Agente Instagram</p>
          <h1 className="text-2xl font-bold text-slate-900">@maisacrilicos</h1>
        </div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar ao CMS
        </Link>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-card"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
