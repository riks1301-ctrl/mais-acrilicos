import { requireAdminSession } from "@/lib/instagram/auth";
import { getMetaPublicStatus, saveMetaSettings } from "@/lib/instagram/meta/config";
import { metaSettingsSchema } from "@/lib/instagram/meta/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  return NextResponse.json(await getMetaPublicStatus());
}

export async function PUT(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const data = metaSettingsSchema.parse(await req.json());
    await saveMetaSettings({
      metaPageId: data.metaPageId,
      metaIgUserId: data.metaIgUserId,
      metaAppId: data.metaAppId,
      metaMode: data.metaMode,
      metaAutoPublish: data.metaAutoPublish,
      metaTokenExpiresAt: data.metaTokenExpiresAt === null ? null : data.metaTokenExpiresAt ? new Date(data.metaTokenExpiresAt) : undefined,
      accessToken: data.accessToken,
      clearStoredToken: data.clearStoredToken,
    });
    return NextResponse.json(await getMetaPublicStatus());
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao salvar" }, { status: 500 });
  }
}
