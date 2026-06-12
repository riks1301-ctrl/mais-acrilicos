import { getSession } from "@/lib/auth";
import Link from "next/link";

export const metadata = { title: "Admin | Mais Acrílicos", robots: { index: false, follow: false } };

const nav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Instagram", href: "/admin/instagram" },
  { label: "Posts", href: "/admin/posts" },
  { label: "SEO", href: "/admin/seo" },
  { label: "Orçamentos", href: "/admin/quotes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-slate-100">
      {session && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-brand-700">CMS Mais Acrílicos</Link>
              <nav className="hidden gap-1 md:flex">{nav.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">{n.label}</Link>)}</nav>
            </div>
            <form action="/api/admin/logout" method="POST"><button type="submit" className="text-sm text-red-600">Sair</button></form>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
