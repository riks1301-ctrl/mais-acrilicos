import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WEEKLY_THEMES } from "@/lib/instagram/constants";
import type { BrandContext, CalendarDayPlan } from "@/lib/instagram/types";
import { generateIdeaForDay } from "./ideas";

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function generateWeeklyCalendar(brand: BrandContext, weekStart?: Date): CalendarDayPlan[] {
  const start = weekStart ?? getWeekStart();
  const plans: CalendarDayPlan[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const dayOfWeek = date.getDay();
    const theme = WEEKLY_THEMES.find((d) => d.day === dayOfWeek)!;

    let idea = generateIdeaForDay(brand, dayOfWeek);
    let attempts = 0;
    while (usedTitles.has(idea.title) && attempts < 15) {
      idea = generateIdeaForDay(brand, dayOfWeek);
      attempts++;
    }
    usedTitles.add(idea.title);

    plans.push({
      date,
      dayLabel: format(date, "EEEE", { locale: ptBR }),
      dayTheme: theme.theme,
      contentType: theme.contentType,
      format: idea.format,
      idea,
    });
  }

  return plans;
}
