import { requireAdminSession } from "@/lib/instagram/auth";
import { checkMetaImageUrl } from "@/lib/instagram/drive/meta-publish";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const linkSchema = z.object({
  imageId: z.string(),
  postId: z.string(),
  role: z.enum(["attachment", "cover", "slide", "background"]).default("cover"),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const input = linkSchema.parse(await req.json());
    const image = await prisma.instagramImage.findUnique({ where: { id: input.imageId } });
    if (!image) return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });

    const post = await prisma.instagramPost.findUnique({ where: { id: input.postId } });
    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    if (input.role === "cover") {
      await prisma.instagramPostImage.deleteMany({
        where: { postId: input.postId, role: "cover" },
      });
    }

    const order =
      input.order ??
      (await prisma.instagramPostImage.count({ where: { postId: input.postId } }));

    const link = await prisma.instagramPostImage.create({
      data: {
        postId: input.postId,
        imageId: input.imageId,
        role: input.role,
        order,
      },
      include: { image: true },
    });

    const metaCheck = checkMetaImageUrl(image.metaPublishUrl ?? image.url);

    return NextResponse.json({
      link,
      metaCheck,
      message: metaCheck.ok
        ? "Imagem vinculada ao post."
        : `Imagem vinculada. Aviso Meta: ${metaCheck.reason}`,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao vincular imagem" }, { status: 500 });
  }
}
