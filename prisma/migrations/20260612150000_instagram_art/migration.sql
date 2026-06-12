-- AlterTable
ALTER TABLE "InstagramBrandConfig" ADD COLUMN "brandFonts" JSONB;
ALTER TABLE "InstagramBrandConfig" ADD COLUMN "artTemplateSet" TEXT NOT NULL DEFAULT 'carousel';
