"use client";

import { useActionState } from "react";
import type { LibraryFormState } from "./actions";

const initial: LibraryFormState = {};
const FIELD_CLS =
  "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2";

const UNITS = ["متر طولي", "متر مربع", "متر مكعب", "عدد", "قطعي", "مقطوعية", "يوم", "ساعة", "طن", "كيلوغرام"];

export default function LibraryItemForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prev: LibraryFormState, formData: FormData) => Promise<LibraryFormState>;
  defaultValues?: Partial<Record<string, string>>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const v = defaultValues || {};

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اسم الفقرة *</label>
          <input name="name" required defaultValue={v.name} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">رمز الفقرة</label>
          <input name="code" defaultValue={v.code} className={FIELD_CLS} dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">وحدة القياس</label>
          <select name="unit" defaultValue={v.unit || "عدد"} className={FIELD_CLS}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">التصنيف الرئيسي</label>
          <input name="main_category" defaultValue={v.main_category} className={FIELD_CLS} placeholder="مثال: أعمال التبليط" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">التصنيف الفرعي</label>
          <input name="sub_category" defaultValue={v.sub_category} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">كلفة الوحدة الافتراضية</label>
          <input name="default_unit_cost" type="number" step="any" defaultValue={v.default_unit_cost || "0"} className={`${FIELD_CLS} tabular`} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">نسبة الربح الافتراضية %</label>
          <input name="default_margin_pct" type="number" step="any" defaultValue={v.default_margin_pct || "20"} className={`${FIELD_CLS} tabular`} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">الوصف الفني التفصيلي</label>
          <textarea name="description" defaultValue={v.description} rows={3} className={FIELD_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">ملاحظات داخلية</label>
          <textarea name="internal_notes" defaultValue={v.internal_notes} rows={2} className={FIELD_CLS} />
        </div>
      </div>

      {state.error && (
        <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl text-white font-bold text-sm px-5 py-2.5 disabled:opacity-60"
        style={{ background: "var(--brand-dark)" }}
      >
        {pending ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </form>
  );
}
