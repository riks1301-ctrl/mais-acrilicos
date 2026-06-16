export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    panelVersion: "2026.01.21-meta",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    metaGraphHost: process.env.META_GRAPH_HOST ?? "instagram",
    hasMetaAccessTokenEnv: !!process.env.META_ACCESS_TOKEN,
    metaTokenLooksLikeIg: process.env.META_ACCESS_TOKEN?.trim().startsWith("IG") ?? false,
    metaTokenLooksLikeStripe: process.env.META_ACCESS_TOKEN?.trim().startsWith("sk_") ?? false,
    blobStoreId: process.env.BLOB_STORE_ID ?? null,
    blobReady: !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID),
  });
}
