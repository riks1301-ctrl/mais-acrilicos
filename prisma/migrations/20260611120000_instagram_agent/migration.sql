-- CreateEnum
CREATE TYPE "IgPostFormat" AS ENUM ('FEED', 'CAROUSEL', 'STORY', 'REELS');

-- CreateEnum
CREATE TYPE "IgPostStatus" AS ENUM ('IDEA', 'CREATING', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "IgContentType" AS ENUM ('BEFORE_AFTER', 'BEHIND_SCENES', 'PRODUCT_SHOWCASE', 'EDUCATIONAL_CAROUSEL', 'DIRECT_OFFER', 'SEASONAL', 'REELS_PRODUCTION', 'RETAIL_TIPS', 'MATERIAL_COMPARISON', 'PDV_IDEAS', 'SOCIAL_PROOF', 'TESTIMONIAL', 'PRODUCT_CATALOG');

-- CreateEnum
CREATE TYPE "IgPublicationMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateTable
CREATE TABLE "InstagramBrandConfig" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "instagramHandle" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "mainCta" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "targetAudience" TEXT[],
    "differentials" TEXT[],
    "primaryHashtags" TEXT[],
    "localHashtags" TEXT[],
    "logoUrl" TEXT,
    "brandColors" JSONB,
    "visualGuidelines" TEXT,
    "publicationMode" "IgPublicationMode" NOT NULL DEFAULT 'MANUAL',
    "metaConnected" BOOLEAN NOT NULL DEFAULT false,
    "metaPageId" TEXT,
    "metaIgUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramBrandConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPersona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "painPoints" TEXT[],
    "goals" TEXT[],
    "segments" TEXT[],
    "brandConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "goal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "brandConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "idea" TEXT,
    "format" "IgPostFormat" NOT NULL DEFAULT 'FEED',
    "contentType" "IgContentType",
    "status" "IgPostStatus" NOT NULL DEFAULT 'IDEA',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "instagramMediaId" TEXT,
    "critiqueNotes" TEXT,
    "brandConfigId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramCaption" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'A',
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "critique" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramCaption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramImagePrompt" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "isConcept" BOOLEAN NOT NULL DEFAULT true,
    "styleNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramImagePrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "isRealPhoto" BOOLEAN NOT NULL DEFAULT false,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isConcept" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialCalendarEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayTheme" TEXT NOT NULL,
    "notes" TEXT,
    "brandConfigId" TEXT NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialCalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reach" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "shares" INTEGER,
    "whatsappClicks" INTEGER,
    "leads" INTEGER,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramApproval" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "adminId" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationLog" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "keywords" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramPost_status_scheduledFor_idx" ON "InstagramPost"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "InstagramPost_brandConfigId_createdAt_idx" ON "InstagramPost"("brandConfigId", "createdAt");

-- CreateIndex
CREATE INDEX "EditorialCalendarEntry_brandConfigId_date_idx" ON "EditorialCalendarEntry"("brandConfigId", "date");

-- CreateIndex
CREATE INDEX "PublicationLog_postId_createdAt_idx" ON "PublicationLog"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "InstagramPersona" ADD CONSTRAINT "InstagramPersona_brandConfigId_fkey" FOREIGN KEY ("brandConfigId") REFERENCES "InstagramBrandConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramCampaign" ADD CONSTRAINT "InstagramCampaign_brandConfigId_fkey" FOREIGN KEY ("brandConfigId") REFERENCES "InstagramBrandConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_brandConfigId_fkey" FOREIGN KEY ("brandConfigId") REFERENCES "InstagramBrandConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "InstagramCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramCaption" ADD CONSTRAINT "InstagramCaption_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramImagePrompt" ADD CONSTRAINT "InstagramImagePrompt_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramImage" ADD CONSTRAINT "InstagramImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialCalendarEntry" ADD CONSTRAINT "EditorialCalendarEntry_brandConfigId_fkey" FOREIGN KEY ("brandConfigId") REFERENCES "InstagramBrandConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialCalendarEntry" ADD CONSTRAINT "EditorialCalendarEntry_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramMetric" ADD CONSTRAINT "InstagramMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramApproval" ADD CONSTRAINT "InstagramApproval_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
