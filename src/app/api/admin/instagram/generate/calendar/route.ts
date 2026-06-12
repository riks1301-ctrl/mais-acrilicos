import { requireAdminSession } from "@/lib/instagram/auth";
import { generateWeekPlan, requireBrand } from "@/lib/instagram/generator";
import { getWeekStart } from "@/lib/instagram/generator/calendar";
import { saveCalendarWeek } from "@/lib/instagram/persistence";
import { generateCalendarSchema } from "@/lib/instagram/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const input = generateCalendarSchema.parse(await req.json());
    const weekStart = input.weekStart ? new Date(input.weekStart) : getWeekStart();
    const plans = await generateWeekPlan(weekStart);

    if (!input.save) {
      return NextResponse.json({
        weekStart: weekStart.toISOString(),
        plans: plans.map((p) => ({
          ...p,
          date: p.date.toISOString(),
        })),
      });
    }

    const brand = await requireBrand();
    const entries = await saveCalendarWeek(
      brand,
      plans.map((p) => ({ date: p.date, dayTheme: p.dayTheme, idea: p.idea }))
    );

    return NextResponse.json({ weekStart: weekStart.toISOString(), entries }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao gerar calendário" }, { status: 500 });
  }
}
