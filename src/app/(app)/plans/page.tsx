import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listPlans, KIND_LABEL, type PlanKind } from "@/lib/repo/models";

const FIELD = "rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-white";
const num = (v?: string) => (v && !isNaN(Number(v)) && Number(v) > 0 ? Number(v) : undefined);

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; w?: string; d?: string; amin?: string; amax?: string; fl?: string; project?: string }>;
}) {
  await requirePageUser();
  const sp = await searchParams;
  const plans = await listPlans({
    kind: sp.kind && sp.kind in KIND_LABEL ? sp.kind : undefined,
    maxWidth: num(sp.w),
    maxDepth: num(sp.d),
    minArea: num(sp.amin),
    maxArea: num(sp.amax),
    floors: num(sp.fl),
  });
  const q = sp.project ? `?project=${encodeURIComponent(sp.project)}` : "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold">مكتبة المخططات</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          اختر مع الزبون المخطط المناسب لقطعته، ثم «ابدأ مشروعاً من هذا المخطط». التعديلات تتم مع Claude على نسخة المشروع، ويبقى الأصل هنا كما هو.
        </p>
      </div>

      <form className="bg-white rounded-2xl border border-[var(--border)] p-4 flex flex-wrap gap-3 items-end">
        {sp.project && <input type="hidden" name="project" value={sp.project} />}
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          النوع
          <select name="kind" defaultValue={sp.kind || ""} className={FIELD}>
            <option value="">الكل</option>
            {(Object.keys(KIND_LABEL) as PlanKind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          عرض قطعة الزبون (م)
          <input name="w" type="number" step="0.5" min="0" defaultValue={sp.w} className={FIELD + " w-28"} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          عمق القطعة (م)
          <input name="d" type="number" step="0.5" min="0" defaultValue={sp.d} className={FIELD + " w-28"} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          المساحة المبنية من (م²)
          <input name="amin" type="number" min="0" defaultValue={sp.amin} className={FIELD + " w-28"} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          إلى (م²)
          <input name="amax" type="number" min="0" defaultValue={sp.amax} className={FIELD + " w-28"} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--foreground-muted)]">
          الطوابق
          <input name="fl" type="number" min="0" defaultValue={sp.fl} className={FIELD + " w-20"} />
        </label>
        <button type="submit" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
          بحث
        </button>
        <Link href={`/plans${q}`} className="text-sm font-bold text-[var(--foreground-muted)] py-2.5">مسح</Link>
      </form>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--foreground-muted)]">
          لا توجد مخططات مطابقة. لإضافة مخطط إلى المكتبة أرسل صوره إلى Claude مع عبارة «أضف هذا المخطط إلى مكتبة المخططات».
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Link key={p.id} href={`/plans/${p.id}${q}`} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md transition">
              <div className="aspect-[16/10] bg-[var(--surface-muted)] flex items-center justify-center">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-[var(--foreground-muted)]">بلا صورة</span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold">{p.name}</span>
                  <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[var(--surface-muted)]">{KIND_LABEL[p.kind]}</span>
                </div>
                <div className="text-xs text-[var(--foreground-muted)] tabular">
                  القطعة {p.plot_w}×{p.plot_d} م · {p.floors} طابق · {Math.round(p.built_area)} م² مبنية
                  {p.bedrooms ? ` · ${p.bedrooms} غرف نوم` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
