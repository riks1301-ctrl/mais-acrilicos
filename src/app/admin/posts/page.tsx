import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPostsPage() {
  if (!(await getSession())) redirect("/admin/login");
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } });
  return (
    <div>
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Posts</h1><Link href="/admin/posts/new" className="rounded-xl bg-brand-600 px-4 py-2 text-white">+ Novo</Link></div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left">Título</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Data</th><th className="px-6 py-3"></th></tr></thead>
          <tbody>{posts.map((p) => <tr key={p.id} className="border-t"><td className="px-6 py-4">{p.title}</td><td className="px-6 py-4 text-center">{p.published ? "Publicado" : "Rascunho"}</td><td className="px-6 py-4">{format(p.createdAt, "dd/MM/yy")}</td><td className="px-6 py-4"><Link href={`/admin/posts/${p.id}`} className="text-brand-600">Editar</Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
