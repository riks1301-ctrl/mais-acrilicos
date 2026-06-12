import { siteConfig } from "@/lib/config";
import { products } from "@/lib/content/products";
import { segments } from "@/lib/content/segments";
import { portfolioItems } from "@/lib/content/portfolio";
import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticPages = ["/", "/produtos", "/segmentos", "/portfolio", "/blog", "/contato"].map((p) => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.8 }));
  const dynamic = [
    ...products.map((p) => ({ url: `${base}/produtos/${p.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...segments.map((s) => ({ url: `${base}/segmentos/${s.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...portfolioItems.map((i) => ({ url: `${base}/portfolio/${i.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
  let blog: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
    blog = posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 }));
  } catch { /* */ }
  return [...staticPages, ...dynamic, ...blog];
}
