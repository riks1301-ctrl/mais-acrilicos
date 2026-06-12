import { createToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(await req.json());
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    const token = await createToken({ sub: admin.id, email: admin.email, name: admin.name });
    await setSessionCookie(token);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
