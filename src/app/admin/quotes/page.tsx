import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { redirect } from "next/navigation";

export default async function AdminQuotesPage() {
  if (!(await getSession())) redirect("/admin/login");
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Orçamentos</h1>
      <div className="mt-6 space-y-4">
        {quotes.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex justify-between"><div><h3 className="font-bold">{q.name}</h3><p className="text-sm text-slate-500">{q.email} · {q.phone}</p></div><span className="text-xs text-slate-400">{format(q.createdAt, "dd/MM/yy HH:mm")}</span></div>
            <p className="mt-4 text-sm">{q.message}</p>
          </div>
        ))}
        {quotes.length === 0 && <p className="text-slate-500">Nenhum orçamento ainda.</p>}
      </div>
    </div>
  );
}
