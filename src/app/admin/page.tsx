import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let stats = { posts: 0, quotes: 0, pendingSeo: 0, published: 0 };
  try {
    const [posts, quotes, pendingSeo, published] = await Promise.all([
      prisma.post.count(), prisma.quote.count({ where: { status: "novo" } }),
      prisma.seoArticleQueue.count({ where: { status: "pending" } }),
      prisma.post.count({ where: { published: true } }),
    ]);
    stats = { posts, quotes, pendingSeo, published };
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-600">Bem-vindo, {session.name}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[{ l: "Publicados", v: stats.published }, { l: "Total Posts", v: stats.posts }, { l: "Orçamentos", v: stats.quotes }, { l: "SEO Fila", v: stats.pendingSeo }].map((c) => (
          <div key={c.l} className="rounded-2xl bg-white p-6 shadow-card"><p className="text-sm text-slate-500">{c.l}</p><p className="text-3xl font-bold">{c.v}</p></div>
        ))}
      </div>
      <div className="mt-8 space-y-2">
        <Link href="/admin/posts/new" className="block rounded-lg bg-brand-50 px-4 py-3 text-brand-700">+ Novo post</Link>
        <Link href="/admin/seo" className="block rounded-lg bg-amber-50 px-4 py-3 text-amber-700">Gerar artigos SEO</Link>
      </div>
    </div>
  );
}
