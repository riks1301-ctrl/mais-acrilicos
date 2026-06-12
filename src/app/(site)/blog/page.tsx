import { Section } from "@/components/ui/Section";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({ title: "Blog", description: "Artigos sobre comunicação visual, displays e PDV.", url: "/blog" });
export const revalidate = 3600;

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof prisma.post.findMany<{ include: { category: true } }>>> = [];
  try { posts = await prisma.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, include: { category: true }, take: 50 }); } catch { /* no db */ }

  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">Blog</h1></div></div>
      <Section>
        {posts.length === 0 ? <p className="py-16 text-center text-slate-600">Em breve novos artigos. Execute npm run db:seed para conteúdo inicial.</p> : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-premium">
                {post.coverImage && <div className="relative aspect-[16/9]"><Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="33vw" /></div>}
                <div className="p-6">
                  {post.category && <span className="text-xs font-semibold uppercase text-brand-600">{post.category.name}</span>}
                  <h2 className="mt-2 text-xl font-bold group-hover:text-brand-600">{post.title}</h2>
                  <p className="mt-2 text-slate-600 line-clamp-3">{post.excerpt}</p>
                  {post.publishedAt && <time className="mt-4 block text-sm text-slate-500">{format(post.publishedAt, "d MMM yyyy", { locale: ptBR })}</time>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
