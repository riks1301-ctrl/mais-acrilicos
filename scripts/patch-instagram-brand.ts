/**
 * Atualiza WhatsApp e handle da marca no banco (produção ou local).
 * Uso: npx tsx scripts/patch-instagram-brand.ts
 */
import { PrismaClient } from "@prisma/client";

const WHATSAPP = "5541987675762";
const INSTAGRAM_HANDLE = "maisacrilico";

function isValidLogoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const v = url.trim();
  return v.startsWith("/") || /^https?:\/\//i.test(v);
}

const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) {
    console.error("Nenhuma marca Instagram no banco. Rode: npm run db:seed");
    process.exit(1);
  }

  const logoUrl = isValidLogoUrl(brand.logoUrl) ? brand.logoUrl : null;

  const updated = await prisma.instagramBrandConfig.update({
    where: { id: brand.id },
    data: {
      whatsappNumber: WHATSAPP,
      instagramHandle: INSTAGRAM_HANDLE,
      ...(logoUrl !== brand.logoUrl ? { logoUrl } : {}),
    },
  });

  console.log("Marca atualizada:", {
    id: updated.id,
    whatsappNumber: updated.whatsappNumber,
    instagramHandle: updated.instagramHandle,
    logoUrl: updated.logoUrl ?? "(vazio)",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
