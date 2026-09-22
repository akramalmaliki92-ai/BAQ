"use client";

import { useActionState } from "react";
import type { ProjectFormState } from "./actions";

const initial: ProjectFormState = {};
const FIELD_CLS =
  "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2";

export default function ProjectForm({
  action,
  defaultValues,
  submitLabel,
  clients,
  managers,
}: {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  defaultValues?: Partial<Record<string, string>>;
  submitLabel: string;
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const v = state.values || defaultValues || {};

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اسم المشروع *</label>
          <input name="name" required defaultValue={v.name} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">العميل *</label>
          <select name="client_id" required defaultValue={v.client_id} className={FIELD_CLS}>
            <option value="">اختر العميل...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">المدير المسؤول</label>
          <select name="manager_user_id" defaultValue={v.manager_user_id || ""} className={FIELD_CLS}>
            <option value="">بلا تحديد</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">موقع المشروع</label>
          <input name="location" defaultValue={v.location} className={FIELD_CLS} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">الحالة</label>
          <select name="status" defaultValue={v.status || "ACTIVE"} className={FIELD_CLS}>
            <option value="ACTIVE">نشط</option>
            <option value="ON_HOLD">متوقف مؤقتاً</option>
            <option value="CLOSED">مغلق</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">وصف مختصر</label>
          <textarea name="description" defaultValue={v.description} rows={2} className={FIELD_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">ملاحظات داخلية</label>
          <textarea name="internal_notes" defaultValue={v.internal_notes} rows={2} className={FIELD_CLS} />
        </div>
        <input type="hidden" name="default_currency" value="IQD" />
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
