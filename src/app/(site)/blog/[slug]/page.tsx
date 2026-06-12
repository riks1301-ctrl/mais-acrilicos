import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
import { articleSchema, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 3600;

async function getPost(slug: string) {
  try { return await prisma.post.findUnique({ where: { slug, published: true }, include: { category: true } }); } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return post ? buildMetadata({ title: post.metaTitle || post.title, description: post.metaDescription || post.excerpt, url: `/blog/${post.slug}`, type: "article", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString() }) : {};
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={[articleSchema(post), breadcrumbSchema([{ name: "Início", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }])]} />
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-4xl px-4"><h1 className="text-3xl font-bold text-white md:text-5xl">{post.title}</h1>{post.publishedAt && <time className="mt-4 block text-slate-300">{format(post.publishedAt, "d MMMM yyyy", { locale: ptBR })}</time>}</div></div>
      {post.coverImage && <div className="relative -mt-8 mx-auto max-w-4xl px-4"><div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-premium"><Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="896px" /></div></div>}
      <Section>
        <div className="prose prose-lg mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-brand-50 p-8 text-center"><h3 className="text-xl font-bold">Precisa de um orçamento?</h3><Button href="/contato" className="mt-4">Solicitar Orçamento</Button></div>
      </Section>
    </>
  );
}
