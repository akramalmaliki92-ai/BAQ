import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { db } from "@/lib/db/client";
import { listQuotes } from "@/lib/repo/quotes";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة",
  IN_REVIEW: "قيد المراجعة",
  NEEDS_REVISION: "يحتاج إلى تعديل",
  APPROVED: "معتمد",
  CANCELLED: "ملغى",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#8a8a8a",
  IN_REVIEW: "#b8860b",
  NEEDS_REVISION: "#c0552f",
  APPROVED: "#2f7d4f",
  CANCELLED: "#a3402f",
};

function fmt(n: number, currency = "IQD") {
  return Math.round(n).toLocaleString("en-US") + " " + (currency === "IQD" ? "د.ع" : currency);
}

export default async function DashboardPage() {
  await requirePageUser();

  const counts = (await db
    .prepare(
      `SELECT status, COUNT(*) c FROM quotes GROUP BY status`
    )
    .all()) as { status: string; c: number }[];
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c.c]));

  const approvedSum = await db
    .prepare(`SELECT COALESCE(SUM(1),0) FROM quotes WHERE status='APPROVED'`)
    .get();

  const recentQuotes = (await listQuotes()).slice(0, 8);

  const stats = [
    { label: "مسودات", value: countMap.DRAFT || 0, color: STATUS_COLOR.DRAFT },
    { label: "قيد المراجعة", value: countMap.IN_REVIEW || 0, color: STATUS_COLOR.IN_REVIEW },
    { label: "معتمدة", value: countMap.APPROVED || 0, color: STATUS_COLOR.APPROVED },
    { label: "تحتاج تعديل", value: countMap.NEEDS_REVISION || 0, color: STATUS_COLOR.NEEDS_REVISION },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">لوحة التحكم</h1>
        <Link
          href="/quotes/new"
          className="rounded-xl text-white font-bold text-sm px-4 py-2.5 shadow"
          style={{ background: "var(--brand-dark)" }}
        >
          + عرض سعر جديد
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[var(--border)] p-4">
            <div className="text-xs font-bold text-[var(--foreground-muted)]">{s.label}</div>
            <div className="text-2xl font-extrabold mt-1 tabular" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-bold text-sm flex items-center justify-between">
          <span>أحدث عروض الأسعار</span>
          <Link href="/quotes" className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
                <th className="text-right font-bold px-4 py-2">الرقم</th>
                <th className="text-right font-bold px-4 py-2">العميل</th>
                <th className="text-right font-bold px-4 py-2">المشروع</th>
                <th className="text-right font-bold px-4 py-2">الحالة</th>
                <th className="text-right font-bold px-4 py-2">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                    لا توجد عروض أسعار بعد
                  </td>
                </tr>
              )}
              {recentQuotes.map((q) => (
                <tr key={q.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                  <td className="px-4 py-2.5">
                    <Link href={`/quotes/${q.id}`} className="font-bold tabular" style={{ color: "var(--brand-dark)" }}>
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{q.client_name}</td>
                  <td className="px-4 py-2.5">{q.project_name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-[11px] font-bold px-2 py-1 rounded-full text-white"
                      style={{ background: STATUS_COLOR[q.status] }}
                    >
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular text-[var(--foreground-muted)]">{q.issue_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
