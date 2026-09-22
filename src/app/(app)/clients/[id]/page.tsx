import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getClient, clientProjectsAndQuotesCount } from "@/lib/repo/clients";
import { db } from "@/lib/db/client";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const counts = await clientProjectsAndQuotesCount(id);
  const projects = (await db
    .prepare("SELECT id, name, status FROM projects WHERE client_id = ? ORDER BY created_at DESC")
    .all(id)) as { id: string; name: string; status: string }[];
  const quotes = (await db
    .prepare("SELECT id, number, status, issue_date FROM quotes WHERE client_id = ? ORDER BY created_at DESC")
    .all(id)) as { id: string; number: string; status: string; issue_date: string }[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold">{client.name}</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-0.5">
            {client.contact_person} {client.phone && `· ${client.phone}`}
          </div>
        </div>
        <Link
          href={`/clients/${id}/edit`}
          className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]"
        >
          تعديل بيانات العميل
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-2">بيانات التواصل</div>
          <div className="text-sm flex flex-col gap-1">
            <div>البريد: {client.email || "—"}</div>
            <div>العنوان: {client.address || "—"}</div>
            <div>الرقم الضريبي: {client.tax_number || "—"}</div>
            {client.notes && <div className="text-[var(--foreground-muted)] mt-1">ملاحظات: {client.notes}</div>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4 flex gap-6">
          <div>
            <div className="text-2xl font-extrabold tabular">{counts.projects}</div>
            <div className="text-xs text-[var(--foreground-muted)]">مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold tabular">{counts.quotes}</div>
            <div className="text-xs text-[var(--foreground-muted)]">عرض سعر</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] font-bold text-sm">المشاريع</div>
          {projects.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--foreground-muted)]">لا توجد مشاريع بعد</div>
          ) : (
            projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block px-4 py-2.5 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                {p.name}
              </Link>
            ))
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] font-bold text-sm">عروض الأسعار</div>
          {quotes.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--foreground-muted)]">لا توجد عروض أسعار بعد</div>
          ) : (
            quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex justify-between px-4 py-2.5 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <span className="tabular font-bold" style={{ color: "var(--brand-dark)" }}>{q.number}</span>
                <span className="tabular text-[var(--foreground-muted)]">{q.issue_date}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
