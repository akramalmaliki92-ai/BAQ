import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listQuotes, type QuoteStatus } from "@/lib/repo/quotes";
import { listUsers } from "@/lib/repo/users";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة", IN_REVIEW: "قيد المراجعة", NEEDS_REVISION: "يحتاج إلى تعديل", APPROVED: "معتمد", CANCELLED: "ملغى",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#8a8a8a", IN_REVIEW: "#b8860b", NEEDS_REVISION: "#c0552f", APPROVED: "#2f7d4f", CANCELLED: "#a3402f",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; user?: string }>;
}) {
  await requirePageUser();
  const sp = await searchParams;
  const quotes = await listQuotes({
    search: sp.q,
    status: (sp.status as QuoteStatus) || undefined,
    from: sp.from,
    to: sp.to,
    createdBy: sp.user,
  });
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">عروض الأسعار</h1>
        <Link href="/quotes/new" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
          + عرض سعر جديد
        </Link>
      </div>

      <form className="flex gap-2 flex-wrap items-center bg-white border border-[var(--border)] rounded-2xl p-3">
        <input name="q" defaultValue={sp.q} placeholder="رقم العرض / العميل / المشروع" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm w-56" />
        <select name="status" defaultValue={sp.status || ""} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="user" defaultValue={sp.user || ""} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
          <option value="">كل المستخدمين</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input name="from" type="date" defaultValue={sp.from} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm tabular" />
        <span className="text-xs text-[var(--foreground-muted)]">إلى</span>
        <input name="to" type="date" defaultValue={sp.to} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm tabular" />
        <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold hover:bg-[var(--surface-muted)]">تصفية</button>
      </form>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="text-right font-bold px-4 py-2.5">الرقم</th>
              <th className="text-right font-bold px-4 py-2.5">العميل</th>
              <th className="text-right font-bold px-4 py-2.5">المشروع</th>
              <th className="text-right font-bold px-4 py-2.5">المعدّ</th>
              <th className="text-right font-bold px-4 py-2.5">التاريخ</th>
              <th className="text-right font-bold px-4 py-2.5">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--foreground-muted)]">لا توجد نتائج مطابقة</td></tr>
            )}
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <td className="px-4 py-2.5">
                  <Link href={`/quotes/${q.id}`} className="font-bold tabular" style={{ color: "var(--brand-dark)" }}>{q.number}</Link>
                </td>
                <td className="px-4 py-2.5">{q.client_name}</td>
                <td className="px-4 py-2.5">{q.project_name}</td>
                <td className="px-4 py-2.5">{q.created_by_name || "—"}</td>
                <td className="px-4 py-2.5 tabular text-[var(--foreground-muted)]">{q.issue_date}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full text-white" style={{ background: STATUS_COLOR[q.status] }}>
                    {STATUS_LABEL[q.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
