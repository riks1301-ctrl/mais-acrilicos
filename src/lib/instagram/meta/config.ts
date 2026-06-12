import { prisma } from "@/lib/prisma";
import type { IgMetaMode } from "@prisma/client";
import { decryptToken, encryptToken, maskToken } from "./crypto";
import type { MetaConfig, MetaValidationResult } from "./types";
import { graphFetch } from "./client";

export function envAutoPublishEnabled(): boolean {
  return process.env.INSTAGRAM_AUTO_PUBLISH === "true";
}

export async function loadMetaConfig(): Promise<MetaConfig> {
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

  let accessToken = process.env.META_ACCESS_TOKEN || null;
  if (brand?.metaAccessTokenEnc) {
    try {
      accessToken = decryptToken(brand.metaAccessTokenEnc);
    } catch {
      accessToken = process.env.META_ACCESS_TOKEN || null;
    }
  }

  return {
    apiVersion: process.env.META_GRAPH_API_VERSION || "v23.0",
    appId: brand?.metaAppId || process.env.META_APP_ID || null,
    appSecret: process.env.META_APP_SECRET || null,
    pageId: brand?.metaPageId || process.env.META_PAGE_ID || null,
    igBusinessAccountId: brand?.metaIgUserId || process.env.META_IG_BUSINESS_ACCOUNT_ID || null,
    accessToken,
    mode: brand?.metaMode ?? "DISABLED",
    autoPublish: brand?.metaAutoPublish ?? false,
    tokenExpiresAt: brand?.metaTokenExpiresAt ?? null,
  };
}

export function validateMetaConfig(config: MetaConfig): MetaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.mode === "DISABLED") errors.push("Modo Meta está DESATIVADO.");
  if (!config.accessToken) errors.push("Access token ausente (configure .env ou painel Meta).");
  if (!config.igBusinessAccountId) errors.push("Instagram Business Account ID ausente.");
  if (!config.pageId) warnings.push("Facebook Page ID não configurado (recomendado).");
  if (config.tokenExpiresAt && config.tokenExpiresAt < new Date()) {
    errors.push("Token Meta expirado — renove o access token.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export async function getInstagramAccount(config: MetaConfig) {
  if (!config.igBusinessAccountId) throw new Error("Instagram Business Account ID não configurado");
  return graphFetch<{ id: string; username?: string; name?: string }>(
    config,
    `/${config.igBusinessAccountId}`,
    { params: { fields: "id,username,name" } }
  );
}

export async function validateAndSaveMetaConnection(): Promise<MetaValidationResult> {
  const config = await loadMetaConfig();
  const base = validateMetaConfig(config);
  if (!base.ok) return base;

  try {
    const account = await getInstagramAccount(config);
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (brand) {
      await prisma.instagramBrandConfig.update({
        where: { id: brand.id },
        data: {
          metaConnected: true,
          metaLastValidatedAt: new Date(),
          metaLastError: null,
          instagramHandle: account.username ?? brand.instagramHandle,
        },
      });
    }
    return { ...base, account };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha na validação Meta";
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (brand) {
      await prisma.instagramBrandConfig.update({
        where: { id: brand.id },
        data: { metaConnected: false, metaLastError: message, metaLastValidatedAt: new Date() },
      });
    }
    return { ok: false, errors: [message], warnings: base.warnings };
  }
}

export async function saveMetaSettings(input: {
  metaPageId?: string;
  metaIgUserId?: string;
  metaAppId?: string;
  metaMode?: IgMetaMode;
  metaAutoPublish?: boolean;
  metaTokenExpiresAt?: Date | null;
  accessToken?: string;
}) {
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) throw new Error("Configure a marca antes da integração Meta.");

  const data: Record<string, unknown> = {
    metaPageId: input.metaPageId ?? brand.metaPageId,
    metaIgUserId: input.metaIgUserId ?? brand.metaIgUserId,
    metaAppId: input.metaAppId ?? brand.metaAppId,
    metaMode: input.metaMode ?? brand.metaMode,
    metaAutoPublish: input.metaAutoPublish ?? brand.metaAutoPublish,
    metaTokenExpiresAt: input.metaTokenExpiresAt ?? brand.metaTokenExpiresAt,
  };

  if (input.accessToken?.trim()) {
    data.metaAccessTokenEnc = encryptToken(input.accessToken.trim());
  }

  return prisma.instagramBrandConfig.update({ where: { id: brand.id }, data: data as never });
}

export async function getMetaPublicStatus() {
  const config = await loadMetaConfig();
  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  const validation = validateMetaConfig(config);

  return {
    mode: config.mode,
    autoPublish: config.autoPublish,
    envAutoPublish: envAutoPublishEnabled(),
    metaConnected: brand?.metaConnected ?? false,
    metaPageId: config.pageId,
    metaIgUserId: config.igBusinessAccountId,
    metaAppId: config.appId,
    tokenMasked: maskToken(config.accessToken),
    tokenExpiresAt: config.tokenExpiresAt,
    metaLastError: brand?.metaLastError ?? null,
    metaLastValidatedAt: brand?.metaLastValidatedAt ?? null,
    validation,
    apiVersion: config.apiVersion,
  };
}
