-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN "performanceScore" DOUBLE PRECISION,
ADD COLUMN "hybridScore" DOUBLE PRECISION,
ADD COLUMN "scoreDelta" DOUBLE PRECISION,
ADD COLUMN "lastMetricsSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InstagramMetric" ADD COLUMN "impressions" INTEGER,
ADD COLUMN "profileVisits" INTEGER,
ADD COLUMN "linkClicks" INTEGER,
ADD COLUMN "totalEngagement" INTEGER,
ADD COLUMN "engagementRate" DOUBLE PRECISION,
ADD COLUMN "unavailableMetrics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "rawInsights" JSONB,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'meta';

-- CreateIndex
CREATE INDEX "InstagramMetric_postId_collectedAt_idx" ON "InstagramMetric"("postId", "collectedAt");
