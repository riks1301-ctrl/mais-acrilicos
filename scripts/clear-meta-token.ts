/**
 * Remove token criptografado do banco para usar META_ACCESS_TOKEN da Vercel.
 * Uso: npx tsx scripts/clear-meta-token.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) {
    console.error("Nenhuma marca Instagram no banco.");
    process.exit(1);
  }

  await prisma.instagramBrandConfig.update({
    where: { id: brand.id },
    data: {
      metaAccessTokenEnc: null,
      metaConnected: false,
      metaLastError: null,
    },
  });

  console.log("Token do painel removido. O servidor usará META_ACCESS_TOKEN da Vercel.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
