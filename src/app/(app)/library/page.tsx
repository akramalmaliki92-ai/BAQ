import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listLibraryItems, listCategories } from "@/lib/repo/library";
import ToggleButton from "./toggle-button";
import { canManageLibrary } from "@/lib/auth/types";

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const user = await requirePageUser();
  const { q, cat } = await searchParams;
  const items = await listLibraryItems({ search: q, mainCategory: cat, includeInactive: canManageLibrary(user.role) });
  const categories = await listCategories();
  const isAdmin = canManageLibrary(user.role);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">مكتبة الفقرات</h1>
        {isAdmin && (
          <Link href="/library/new" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
            + فقرة جديدة
          </Link>
        )}
      </div>

      <form className="flex gap-2 flex-wrap">
        <input name="q" defaultValue={q} placeholder="ابحث بالاسم أو الرمز..." className="rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm w-full max-w-xs" />
        <select name="cat" defaultValue={cat || ""} className="rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm">
          <option value="">كل التصنيفات</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--surface-muted)]">تصفية</button>
      </form>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="text-right font-bold px-4 py-2.5">الفقرة</th>
              <th className="text-right font-bold px-4 py-2.5">التصنيف</th>
              <th className="text-right font-bold px-4 py-2.5">الوحدة</th>
              {isAdmin && <th className="text-right font-bold px-4 py-2.5">الكلفة الافتراضية</th>}
              {isAdmin && <th className="text-right font-bold px-4 py-2.5">هامش الربح</th>}
              {isAdmin && <th className="text-right font-bold px-4 py-2.5">الحالة</th>}
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--foreground-muted)]">لا توجد فقرات مطابقة</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <td className="px-4 py-2.5">
                  <div className="font-bold">{it.name}</div>
                  {it.sub_category && <div className="text-xs text-[var(--foreground-muted)]">{it.sub_category}</div>}
                </td>
                <td className="px-4 py-2.5">{it.main_category || "—"}</td>
                <td className="px-4 py-2.5">{it.unit}</td>
                {isAdmin && <td className="px-4 py-2.5 tabular">{fmt(it.default_unit_cost)}</td>}
                {isAdmin && <td className="px-4 py-2.5 tabular">{it.default_margin_pct}%</td>}
                {isAdmin && <td className="px-4 py-2.5"><ToggleButton id={it.id} active={!!it.active} /></td>}
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    <Link href={`/library/${it.id}/edit`} className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>تعديل</Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
