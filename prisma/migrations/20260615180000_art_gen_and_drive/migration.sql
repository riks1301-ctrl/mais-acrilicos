-- Art generation status on posts
CREATE TYPE "IgArtGenStatus" AS ENUM ('IDLE', 'GENERATING', 'READY', 'FAILED');

ALTER TABLE "InstagramPost"
  ADD COLUMN IF NOT EXISTS "artGenStatus" "IgArtGenStatus" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN IF NOT EXISTS "artGenError" TEXT,
  ADD COLUMN IF NOT EXISTS "artGenStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "artGenFinishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "artGenProgress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "artGenTotal" INTEGER NOT NULL DEFAULT 0;

-- Google Drive config on brand
ALTER TABLE "InstagramBrandConfig"
  ADD COLUMN IF NOT EXISTS "googleDriveFolderId" TEXT,
  ADD COLUMN IF NOT EXISTS "googleDriveLocalPath" TEXT,
  ADD COLUMN IF NOT EXISTS "googleDriveLastSyncAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "googleDriveLastSyncError" TEXT,
  ADD COLUMN IF NOT EXISTS "googleDriveSyncCount" INTEGER NOT NULL DEFAULT 0;

-- Drive catalog fields on images
ALTER TABLE "InstagramImage"
  ADD COLUMN IF NOT EXISTS "sourceProvider" TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS "driveFileId" TEXT,
  ADD COLUMN IF NOT EXISTS "driveFolderPath" TEXT,
  ADD COLUMN IF NOT EXISTS "localPath" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "webViewLink" TEXT,
  ADD COLUMN IF NOT EXISTS "webContentLink" TEXT,
  ADD COLUMN IF NOT EXISTS "metaPublishUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "metaPublishReady" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "InstagramImage_driveFileId_idx" ON "InstagramImage"("driveFileId");
CREATE INDEX IF NOT EXISTS "InstagramImage_sourceProvider_idx" ON "InstagramImage"("sourceProvider");
