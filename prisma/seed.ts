import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_BRAND_CONFIG, DEFAULT_PERSONAS } from "../src/lib/instagram/brand-defaults";
import { generateArticleFromKeyword, templateToPostData, generateSeoQueue } from "../src/lib/seo-generator";

const prisma = new PrismaClient();

const categories = [
  { name: "Displays de Acrílico", slug: "displays-acrilico" },
  { name: "Supermercados", slug: "supermercados" },
  { name: "Farmácias", slug: "farmacias" },
  { name: "Luminosos", slug: "luminosos" },
  { name: "Fachadas", slug: "fachadas" },
  { name: "Letras Caixa", slug: "letras-caixa" },
];

const articles = [
  { kw: "display de acrílico para balcão", cat: "displays-acrilico", img: "https://images.unsplash.com/photo-1607083206869-4c6672a72fae?w=1200&q=80" },
  { kw: "comunicação visual para supermercados", cat: "supermercados", img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80" },
  { kw: "comunicação visual para farmácias", cat: "farmacias", img: "https://images.unsplash.com/photo-1576602973669-2b34cbcb8172?w=1200&q=80" },
  { kw: "luminoso para fachada", cat: "luminosos", img: "https://images.unsplash.com/photo-1517048676732-65d794618b66?w=1200&q=80" },
  { kw: "fachada comercial personalizada", cat: "fachadas", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" },
  { kw: "letras caixa acrílico LED", cat: "letras-caixa", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" },
];

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@maisacrilicos.com.br";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  await prisma.admin.upsert({ where: { email }, update: {}, create: { email, name: "Admin", passwordHash: await bcrypt.hash(password, 12) } });

  for (const c of categories) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  const catMap = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const a of articles) {
    const t = generateArticleFromKeyword(a.kw, a.cat);
    const d = templateToPostData(t);
    await prisma.post.upsert({
      where: { slug: d.slug }, update: {},
      create: { ...d, coverImage: a.img, published: true, publishedAt: new Date(), categoryId: catMap[a.cat], seoScore: 90 },
    });
  }

  const queue = generateSeoQueue(200);
  for (const item of queue) {
    const exists = await prisma.seoArticleQueue.findFirst({ where: { title: item.title } });
    if (!exists) await prisma.seoArticleQueue.create({ data: item });
  }

  const existingBrand = await prisma.instagramBrandConfig.findFirst();
  if (!existingBrand) {
    await prisma.instagramBrandConfig.create({
      data: {
        ...DEFAULT_BRAND_CONFIG,
        personas: { create: DEFAULT_PERSONAS },
      },
    });
  }

  const services = [
    { name: "Displays de acrílico", description: "Expositores sob medida para balcão, gôndola e PDV.", category: "PDV", keywords: ["display", "acrílico", "expositor"], order: 1, featured: true },
    { name: "Luminosos", description: "Letreiros luminosos para fachada e fachada comercial.", category: "Fachada", keywords: ["luminoso", "led", "fachada"], order: 2, featured: true },
    { name: "Fachadas", description: "Comunicação visual completa para fachada de loja.", category: "Fachada", keywords: ["fachada", "placa", "adesivo"], order: 3, featured: true },
    { name: "Adesivos e banners", description: "Sinalização, vitrine e campanhas promocionais.", category: "Sinalização", keywords: ["adesivo", "banner", "vitrine"], order: 4 },
    { name: "Letras caixa", description: "Letras em acrílico, PVC e metal para fachada.", category: "Fachada", keywords: ["letras caixa", "acrílico"], order: 5 },
  ];
  for (const s of services) {
    const exists = await prisma.instagramService.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.instagramService.create({ data: s });
  }

  console.log("Seed OK. Admin:", email, "/", password);
}

main().finally(() => prisma.$disconnect());
