/**
 * Indexa pasta local do Google Drive (Windows) no catálogo do banco.
 * Uso: GOOGLE_DRIVE_LOCAL_PATH="G:\...\Fotos" npm run db:sync-drive-local
 */
import { PrismaClient } from "@prisma/client";
import { syncLocalDriveCatalog } from "../src/lib/instagram/drive/sync";

const prisma = new PrismaClient();

async function main() {
  const localPath = process.env.GOOGLE_DRIVE_LOCAL_PATH;
  if (!localPath) {
    console.error("Defina GOOGLE_DRIVE_LOCAL_PATH no ambiente.");
    process.exit(1);
  }

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) {
    console.error("Nenhuma marca Instagram no banco.");
    process.exit(1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const result = await syncLocalDriveCatalog(brand.id, localPath, siteUrl);
  console.log(result.message);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
