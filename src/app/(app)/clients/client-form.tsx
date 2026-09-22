"use client";

import { useActionState } from "react";
import type { ClientFormState } from "./actions";

const initial: ClientFormState = {};

const FIELD_CLS =
  "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2";

export default function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaultValues?: Partial<Record<string, string>>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const v = state.values || defaultValues || {};

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اسم العميل / الشركة *</label>
          <input name="name" required defaultValue={v.name} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">الشخص المسؤول</label>
          <input name="contact_person" defaultValue={v.contact_person} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">رقم الهاتف</label>
          <input name="phone" defaultValue={v.phone} className={FIELD_CLS} dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">البريد الإلكتروني</label>
          <input name="email" type="email" defaultValue={v.email} className={FIELD_CLS} dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">الرقم الضريبي</label>
          <input name="tax_number" defaultValue={v.tax_number} className={FIELD_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">العنوان</label>
          <input name="address" defaultValue={v.address} className={FIELD_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">ملاحظات</label>
          <textarea name="notes" defaultValue={v.notes} rows={2} className={FIELD_CLS} />
        </div>
      </div>

      {state.error && (
        <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">{state.error}</div>
      )}
      {state.warning && (
        <div className="text-sm rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 flex flex-col gap-2">
          <span>⚠ {state.warning}</span>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" name="confirm_duplicate" value="1" />
            متابعة الحفظ رغم التشابه
          </label>
        </div>
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
