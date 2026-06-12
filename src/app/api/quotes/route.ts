import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional(),
  segment: z.string().optional(),
  product: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const quote = await prisma.quote.create({ data: { ...data, company: data.company || null, segment: data.segment || null, product: data.product || null } });
    return NextResponse.json({ success: true, id: quote.id }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
