-- CreateEnum
CREATE TYPE "IgImageCategory" AS ENUM ('OBRA_PRONTA', 'BASTIDORES', 'ACRILICO', 'DISPLAY', 'FACHADA', 'BANNER', 'ADESIVO', 'LUMINOSO', 'PDV', 'ANTES_DEPOIS');

-- CreateEnum
CREATE TYPE "IgImageStatus" AS ENUM ('AVAILABLE', 'IN_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IgImageType" AS ENUM ('REAL', 'MOCKUP', 'CONCEPT', 'COMMERCIAL_ART');

-- CreateEnum
CREATE TYPE "IgVisualSource" AS ENUM ('REAL', 'MOCKUP', 'AI', 'MIXED');

-- CreateEnum
CREATE TYPE "IgPromptPurpose" AS ENUM ('FEED_SQUARE', 'FEED_PORTRAIT', 'STORY_REELS', 'REELS_COVER', 'CAROUSEL');

-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN "visualSource" "IgVisualSource",
ADD COLUMN "visualFormat" TEXT;

-- AlterTable InstagramImagePrompt
ALTER TABLE "InstagramImagePrompt" ADD COLUMN "purpose" "IgPromptPurpose",
ADD COLUMN "imageType" "IgImageType" NOT NULL DEFAULT 'CONCEPT';

-- Drop old postId FK from InstagramImage if exists from partial migration - handle fresh
-- Recreate InstagramImage structure
ALTER TABLE "InstagramImage" DROP COLUMN IF EXISTS "postId";
ALTER TABLE "InstagramImage" DROP COLUMN IF EXISTS "order";

ALTER TABLE "InstagramImage" ADD COLUMN IF NOT EXISTS "brandConfigId" TEXT,
ADD COLUMN IF NOT EXISTS "category" "IgImageCategory",
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
ADD COLUMN IF NOT EXISTS "clientProject" TEXT,
ADD COLUMN IF NOT EXISTS "usagePermission" TEXT NOT NULL DEFAULT 'uso_interno',
ADD COLUMN IF NOT EXISTS "status" "IgImageStatus" NOT NULL DEFAULT 'IN_REVIEW',
ADD COLUMN IF NOT EXISTS "imageType" "IgImageType" NOT NULL DEFAULT 'REAL',
ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
ADD COLUMN IF NOT EXISTS "filename" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "InstagramPostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'attachment',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramPostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramCarousel" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "exportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramCarousel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramCarouselSlide" (
    "id" TEXT NOT NULL,
    "carouselId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "slideType" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "backgroundImageId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramCarouselSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPostImage_postId_imageId_key" ON "InstagramPostImage"("postId", "imageId");
CREATE INDEX "InstagramPostImage_postId_order_idx" ON "InstagramPostImage"("postId", "order");
CREATE UNIQUE INDEX "InstagramCarousel_postId_key" ON "InstagramCarousel"("postId");
CREATE INDEX "InstagramCarouselSlide_carouselId_order_idx" ON "InstagramCarouselSlide"("carouselId", "order");
CREATE INDEX "InstagramImage_brandConfigId_status_category_idx" ON "InstagramImage"("brandConfigId", "status", "category");
CREATE INDEX "InstagramImage_status_idx" ON "InstagramImage"("status");

-- AddForeignKey
ALTER TABLE "InstagramImage" ADD CONSTRAINT "InstagramImage_brandConfigId_fkey" FOREIGN KEY ("brandConfigId") REFERENCES "InstagramBrandConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstagramImage" ADD CONSTRAINT "InstagramImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "InstagramService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstagramPostImage" ADD CONSTRAINT "InstagramPostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramPostImage" ADD CONSTRAINT "InstagramPostImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "InstagramImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramCarousel" ADD CONSTRAINT "InstagramCarousel_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramCarouselSlide" ADD CONSTRAINT "InstagramCarouselSlide_carouselId_fkey" FOREIGN KEY ("carouselId") REFERENCES "InstagramCarousel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramCarouselSlide" ADD CONSTRAINT "InstagramCarouselSlide_backgroundImageId_fkey" FOREIGN KEY ("backgroundImageId") REFERENCES "InstagramImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
