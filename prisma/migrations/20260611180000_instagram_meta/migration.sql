-- CreateEnum
CREATE TYPE "IgMetaMode" AS ENUM ('DISABLED', 'TEST', 'ACTIVE');

-- AlterTable InstagramBrandConfig
ALTER TABLE "InstagramBrandConfig" ADD COLUMN "metaMode" "IgMetaMode" NOT NULL DEFAULT 'DISABLED',
ADD COLUMN "metaAutoPublish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "metaAppId" TEXT,
ADD COLUMN "metaAccessTokenEnc" TEXT,
ADD COLUMN "metaTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "metaLastError" TEXT,
ADD COLUMN "metaLastValidatedAt" TIMESTAMP(3);

-- AlterTable InstagramPost
ALTER TABLE "InstagramPost" ADD COLUMN "metaMediaContainerId" TEXT,
ADD COLUMN "metaPublishError" TEXT,
ADD COLUMN "metaLastPublishAttempt" TIMESTAMP(3),
ADD COLUMN "metaPublishMode" TEXT;
