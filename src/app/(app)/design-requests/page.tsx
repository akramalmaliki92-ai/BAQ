import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listDesignRequests, parseFiles } from "@/lib/repo/designRequests";
import ShareLink from "../projects/[id]/share-link";

export default async function DesignRequestsPage() {
  await requirePageUser();
  const rows = await listDesignRequests();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold">طلبات التصميم</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-0.5">أجوبة استبيان التصميم المعماري من الرابط العام وروابط المشاريع</div>
        </div>
        <div className="flex gap-2">
          <a href="/design" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
            معاينة الفورمة ↗
          </a>
          <ShareLink path="/design" label="نسخ الرابط العام" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--foreground-muted)]">لا توجد طلبات بعد</div>
        ) : (
          rows.map((r) => (
            <Link key={r.id} href={`/design-requests/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
              <div>
                <div className="font-bold">{r.name || "—"} <span className="tabular font-normal text-[var(--foreground-muted)]" dir="ltr">{r.phone}</span></div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {r.source === "PUBLIC" ? "الرابط العام" : "رابط مشروع"}
                  {r.governorate && ` · ${r.governorate}`}
                  {r.project_name && ` · ${r.project_name}`}
                  {` · ${parseFiles(r).length} صورة`}
                </div>
              </div>
              <div className="text-left flex-none">
                <span className="text-xs font-bold rounded-full px-2.5 py-1" style={r.status === "SUBMITTED" ? { background: "#e3f0e7", color: "#2f7d4f" } : { background: "#f4efe4", color: "#8a6d3b" }}>
                  {r.status === "SUBMITTED" ? "مكتمل" : "لم يكتمل"}
                </span>
                <div className="text-[11px] tabular text-[var(--foreground-muted)] mt-1">{(r.submitted_at || r.updated_at).slice(0, 16).replace("T", " ")}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
