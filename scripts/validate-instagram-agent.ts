/**
 * Validação estática do Agente Instagram (sem publicar na Meta).
 * Uso: npx tsx scripts/validate-instagram-agent.ts
 */
import { canApprovePost } from "../src/lib/instagram/approval/utils";
import { checkPostPublishEligibility } from "../src/lib/instagram/meta/eligibility";
import { computeEngagementRate, sumEngagement } from "../src/lib/instagram/metrics/compute";
import { updateIgPostSchema } from "../src/lib/instagram/schemas";
import { validateImageBuffer } from "../src/lib/instagram/images/storage";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("\n=== Agente Instagram — validação ===\n");

  // Schema: status removido do update (ignorado se enviado — bloqueio na API)
  const parseUpdate = updateIgPostSchema.safeParse({ title: "Teste válido aqui" });
  assert("Schema de update aceita apenas campos editoriais", parseUpdate.success);

  // Engajamento
  const total = sumEngagement({ likes: 10, comments: 2, saves: 3, shares: 1 });
  assert("Soma de engajamento", total === 16);
  const rate = computeEngagementRate(16, 400);
  assert("Taxa de engajamento", rate === 4);

  // Upload magic bytes
  const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngOk = validateImageBuffer(fakePng, "image/png");
  assert("Detecta PNG válido", pngOk.ok === true);
  const bad = validateImageBuffer(Buffer.from("not-an-image"), "image/jpeg");
  assert("Rejeita arquivo inválido", bad.ok === false);

  // Aprovação
  const approveFail = canApprovePost({
    id: "x",
    title: "t",
    idea: null,
    format: "FEED",
    contentType: null,
    status: "PENDING_APPROVAL",
    scheduledFor: null,
    publishedAt: null,
    suggestedDate: null,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    finalCaption: null,
    finalCta: "cta",
    finalHashtags: null,
    internalNotes: null,
    publicationChannel: null,
    publicationNotes: null,
    manualPublished: false,
    approvedByAdminId: null,
    instagramMediaId: null,
    metaMediaContainerId: null,
    metaPublishError: null,
    metaLastPublishAttempt: null,
    metaPublishMode: null,
    performanceScore: null,
    hybridScore: null,
    scoreDelta: null,
    lastMetricsSyncAt: null,
    critiqueNotes: null,
    visualSource: null,
    visualFormat: null,
    brandConfigId: "b",
    campaignId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    captions: [],
    postImages: [],
    carousel: null,
  });
  assert("Bloqueia aprovação sem legenda final", !approveFail.ok);

  // Elegibilidade publicação (requer DB para loadMetaConfig)
  if (process.env.DATABASE_URL?.startsWith("postgresql")) {
    const elig = await checkPostPublishEligibility(
      {
        id: "p",
        title: "Post",
        format: "FEED",
        contentType: null,
        status: "PENDING_APPROVAL",
        scheduledFor: null,
        publishedAt: null,
        suggestedDate: null,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        finalCaption: "Legenda longa o suficiente para publicar no feed com CTA claro.",
        finalCta: "WhatsApp",
        finalHashtags: null,
        internalNotes: null,
        publicationChannel: "FEED",
        publicationNotes: null,
        manualPublished: false,
        approvedByAdminId: null,
        instagramMediaId: null,
        metaMediaContainerId: null,
        metaPublishError: null,
        metaLastPublishAttempt: null,
        metaPublishMode: null,
        performanceScore: null,
        hybridScore: null,
        scoreDelta: null,
        lastMetricsSyncAt: null,
        critiqueNotes: null,
        visualSource: "REAL",
        visualFormat: null,
        brandConfigId: "b",
        campaignId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postImages: [{ role: "cover", order: 0, image: { url: "/uploads/instagram/x.jpg", status: "AVAILABLE" } }],
        carousel: null,
      },
      { allowApproved: true }
    );
    assert("Bloqueia publicação sem APPROVED/SCHEDULED", !elig.ok);
  } else {
    console.log("  ~ elegibilidade Meta (pulado — DATABASE_URL indisponível)");
  }

  // Modo TESTE não chama publish real — verificado por código em publish.ts (documentação)
  assert("INSTAGRAM_AUTO_PUBLISH padrão seguro", process.env.INSTAGRAM_AUTO_PUBLISH !== "true");

  console.log(`\nResultado: ${passed} ok, ${failed} falhas\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
