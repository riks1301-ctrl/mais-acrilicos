import { CalendarView } from "@/components/admin/instagram/CalendarView";

export default function InstagramCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Calendário editorial</h2>
        <p className="mt-1 text-slate-600">Planejamento semanal automático com ideias, legendas e crítica.</p>
      </div>
      <CalendarView />
    </div>
  );
}
