import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listQuotes, getSectionsWithItems } from "@/lib/repo/quotes";
import { listUsers } from "@/lib/repo/users";
import { computeQuoteTotals } from "@/lib/pricing/engine";
import { buildContractNumber } from "@/lib/pdf/buildContractHtml";

function fmt(n: number, currency = "IQD") {
  return Math.round(n || 0).toLocaleString("en-US") + " " + (currency === "IQD" ? "د.ع" : currency);
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; user?: string }>;
}) {
  await requirePageUser();
  const sp = await searchParams;

  const approvedQuotes = await listQuotes({
    search: sp.q,
    status: "APPROVED",
    from: sp.from,
    to: sp.to,
    createdBy: sp.user,
  });
  const users = await listUsers();
  const usersById = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const contracts = await Promise.all(
    approvedQuotes.map(async (q) => {
      const sections = await getSectionsWithItems(q.id);
      const items = sections.flatMap((s) => s.items);
      const totals = computeQuoteTotals(
        items.map((it) => ({
          id: it.id,
          qty: it.qty,
          unitCost: it.unit_cost,
          marginPct: it.margin_pct,
          manualUnitPrice: it.manual_unit_price,
        })),
        { type: q.discount_type, value: q.discount_value },
        !!q.tax_enabled,
        q.tax_pct,
        q.min_margin_pct ?? 0
      );
      return {
        quote: q,
        contractNumber: buildContractNumber(q.number),
        finalTotal: totals.finalTotal,
        approvedByName: q.approved_by ? usersById[q.approved_by] || "—" : "—",
      };
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">العقود المعتمدة</h1>
        <div className="text-sm text-[var(--foreground-muted)]">
          تُنشأ العقود تلقائياً من عروض الأسعار بعد اعتمادها — من صفحة العرض نفسه، زر &quot;تحويل إلى عقد عمل&quot;.
        </div>
      </div>

      <form className="flex gap-2 flex-wrap items-center bg-white border border-[var(--border)] rounded-2xl p-3">
        <input name="q" defaultValue={sp.q} placeholder="رقم العرض / العميل / المشروع" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm w-56" />
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
              <th className="text-right font-bold px-4 py-2.5">رقم العقد</th>
              <th className="text-right font-bold px-4 py-2.5">عرض السعر المرجعي</th>
              <th className="text-right font-bold px-4 py-2.5">العميل</th>
              <th className="text-right font-bold px-4 py-2.5">المشروع</th>
              <th className="text-right font-bold px-4 py-2.5">تاريخ الاعتماد</th>
              <th className="text-right font-bold px-4 py-2.5">اعتمده</th>
              <th className="text-right font-bold px-4 py-2.5">القيمة الإجمالية</th>
              <th className="text-right font-bold px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--foreground-muted)]">لا توجد عقود بعد — تظهر هنا فور اعتماد أي عرض سعر وتحويله إلى عقد</td></tr>
            )}
            {contracts.map(({ quote: q, contractNumber, finalTotal, approvedByName }) => (
              <tr key={q.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <td className="px-4 py-2.5 font-bold tabular" style={{ color: "var(--brand-dark)" }}>{contractNumber}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/quotes/${q.id}`} className="tabular underline decoration-dotted">{q.number}</Link>
                </td>
                <td className="px-4 py-2.5">{q.client_name}</td>
                <td className="px-4 py-2.5">{q.project_name}</td>
                <td className="px-4 py-2.5 tabular text-[var(--foreground-muted)]">{q.approved_at ? q.approved_at.slice(0, 10) : "—"}</td>
                <td className="px-4 py-2.5">{approvedByName}</td>
                <td className="px-4 py-2.5 tabular font-bold">{fmt(finalTotal, q.currency)}</td>
                <td className="px-4 py-2.5">
                  <a
                    href={`/api/quotes/${q.id}/contract`}
                    target="_blank"
                    className="rounded-lg text-white font-bold text-xs px-3 py-1.5 whitespace-nowrap"
                    style={{ background: "var(--brand-dark)" }}
                  >
                    🖋️ فتح العقد
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
