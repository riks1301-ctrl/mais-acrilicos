-- Etapa 8: biblioteca local Google Drive (somente leitura)
ALTER TYPE "IgImageCategory" ADD VALUE IF NOT EXISTS 'LETRAS_CAIXA';
ALTER TYPE "IgImageCategory" ADD VALUE IF NOT EXISTS 'TOTEM';

ALTER TABLE "InstagramImage"
  ADD COLUMN IF NOT EXISTS "driveRelativePath" TEXT,
  ADD COLUMN IF NOT EXISTS "driveMainFolder" TEXT,
  ADD COLUMN IF NOT EXISTS "driveSubfolder" TEXT,
  ADD COLUMN IF NOT EXISTS "clientName" TEXT,
  ADD COLUMN IF NOT EXISTS "fileHash" TEXT,
  ADD COLUMN IF NOT EXISTS "fileCreatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fileModifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "imageWidth" INTEGER,
  ADD COLUMN IF NOT EXISTS "imageHeight" INTEGER;

CREATE INDEX IF NOT EXISTS "InstagramImage_clientName_idx" ON "InstagramImage"("clientName");
CREATE INDEX IF NOT EXISTS "InstagramImage_fileHash_idx" ON "InstagramImage"("fileHash");
CREATE INDEX IF NOT EXISTS "InstagramImage_driveMainFolder_idx" ON "InstagramImage"("driveMainFolder");
