-- CreateIndex
CREATE INDEX "InstagramPost_instagramMediaId_idx" ON "InstagramPost"("instagramMediaId");
CREATE INDEX "InstagramPost_status_publishedAt_idx" ON "InstagramPost"("status", "publishedAt");
CREATE INDEX "InstagramCaption_postId_idx" ON "InstagramCaption"("postId");
CREATE INDEX "InstagramApproval_postId_idx" ON "InstagramApproval"("postId");
