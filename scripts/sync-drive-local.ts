/**
 * Indexa pasta local do Google Drive (somente leitura) no catálogo do banco.
 * Uso: LOCAL_DRIVE_ROOT="G:\\Meu Drive" npm run drive:sync
 */
import { PrismaClient } from "@prisma/client";
import { getLocalDriveRoot } from "../src/lib/instagram/drive/config";
import { syncLocalDriveCatalog } from "../src/lib/instagram/drive/sync";

const prisma = new PrismaClient();

async function main() {
  const localPath = getLocalDriveRoot();
  if (!localPath) {
    console.error("Defina LOCAL_DRIVE_ROOT ou GOOGLE_DRIVE_LOCAL_PATH no ambiente.");
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
  console.log("Categorias:", result.categories);
  console.log("Clientes:", result.clients);
  if (result.errors.length) console.warn("Erros:", result.errors.slice(0, 5));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
