let productionChecked = false;

const WEAK_JWT_MARKERS = ["dev-secret", "sua-chave-secreta", "altere-esta"];

function isWeakSecret(value: string | undefined): boolean {
  if (!value || value.length < 32) return true;
  const lower = value.toLowerCase();
  return WEAK_JWT_MARKERS.some((m) => lower.includes(m));
}

function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

/** Falha em runtime de produção se segredos críticos estiverem ausentes ou fracos. */
export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (isNextBuildPhase()) return;
  if (productionChecked) return;
  productionChecked = true;

  const errors: string[] = [];
  if (isWeakSecret(process.env.JWT_SECRET)) {
    errors.push("JWT_SECRET ausente ou fraco (mín. 32 caracteres aleatórios).");
  }
  if (process.env.INSTAGRAM_AUTO_PUBLISH === "true" && !process.env.META_PUBLISH_CRON_SECRET) {
    errors.push("INSTAGRAM_AUTO_PUBLISH=true exige META_PUBLISH_CRON_SECRET definido.");
  }
  if (errors.length > 0) {
    throw new Error(`Configuração insegura para produção: ${errors.join(" ")}`);
  }
}
