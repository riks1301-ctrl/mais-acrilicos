-- CreateEnum
CREATE TYPE "IgPublicationChannel" AS ENUM ('FEED', 'STORY', 'REELS', 'CAROUSEL');

-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN "suggestedDate" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "finalCaption" TEXT,
ADD COLUMN "finalCta" TEXT,
ADD COLUMN "finalHashtags" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "publicationChannel" "IgPublicationChannel",
ADD COLUMN "publicationNotes" TEXT,
ADD COLUMN "manualPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedByAdminId" TEXT;
