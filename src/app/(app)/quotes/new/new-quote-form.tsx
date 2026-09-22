"use client";

import { useActionState, useState } from "react";
import type { NewQuoteFormState } from "./actions";

const initial: NewQuoteFormState = {};

const FIELD_CLS =
  "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2";

const TAB_CLS = (active: boolean) =>
  `flex-1 rounded-lg text-sm font-bold px-3 py-2 transition-colors ${
    active ? "text-white" : "text-[var(--foreground-muted)] bg-[var(--surface-muted)]"
  }`;

export default function NewQuoteForm({
  action,
  projects,
  clients,
  managers,
  preselectedProjectId,
}: {
  action: (prev: NewQuoteFormState, formData: FormData) => Promise<NewQuoteFormState>;
  projects: { id: string; name: string; client_name?: string }[];
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  preselectedProjectId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const v = state.values || {};

  const [projectMode, setProjectMode] = useState<"existing" | "new">(
    projects.length === 0 ? "new" : (v.project_mode as "existing" | "new") || "existing"
  );
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    clients.length === 0 ? "new" : (v.client_mode as "existing" | "new") || "existing"
  );

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
      <input type="hidden" name="project_mode" value={projectMode} />
      {projectMode === "new" && <input type="hidden" name="client_mode" value={clientMode} />}

      <div>
        <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">المشروع</label>
        {projects.length > 0 && (
          <div className="flex gap-2 mb-3 p-1 rounded-lg bg-[var(--surface-muted)]">
            <button
              type="button"
              onClick={() => setProjectMode("existing")}
              className={TAB_CLS(projectMode === "existing")}
              style={projectMode === "existing" ? { background: "var(--brand-dark)" } : undefined}
            >
              مشروع موجود
            </button>
            <button
              type="button"
              onClick={() => setProjectMode("new")}
              className={TAB_CLS(projectMode === "new")}
              style={projectMode === "new" ? { background: "var(--brand-dark)" } : undefined}
            >
              مشروع جديد
            </button>
          </div>
        )}

        {projectMode === "existing" ? (
          <select
            name="project_id"
            required
            defaultValue={v.project_id || preselectedProjectId || ""}
            className={FIELD_CLS}
          >
            <option value="">اختر...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.client_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-[var(--border)] p-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اسم المشروع *</label>
              <input name="new_project_name" required defaultValue={v.new_project_name} className={FIELD_CLS} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">موقع المشروع</label>
                <input name="new_project_location" defaultValue={v.new_project_location} className={FIELD_CLS} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">المدير المسؤول</label>
                <select name="new_project_manager" defaultValue={v.new_project_manager || ""} className={FIELD_CLS}>
                  <option value="">بلا تحديد</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">العميل</label>
              {clients.length > 0 && (
                <div className="flex gap-2 mb-3 p-1 rounded-lg bg-[var(--surface-muted)]">
                  <button
                    type="button"
                    onClick={() => setClientMode("existing")}
                    className={TAB_CLS(clientMode === "existing")}
                    style={clientMode === "existing" ? { background: "var(--brand-dark)" } : undefined}
                  >
                    عميل موجود
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode("new")}
                    className={TAB_CLS(clientMode === "new")}
                    style={clientMode === "new" ? { background: "var(--brand-dark)" } : undefined}
                  >
                    عميل جديد
                  </button>
                </div>
              )}

              {clientMode === "existing" ? (
                <select name="client_id" required defaultValue={v.client_id || ""} className={FIELD_CLS}>
                  <option value="">اختر العميل...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اسم العميل / الشركة *</label>
                    <input name="new_client_name" required defaultValue={v.new_client_name} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">الشخص المسؤول</label>
                    <input name="new_client_contact" defaultValue={v.new_client_contact} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">رقم الهاتف</label>
                    <input name="new_client_phone" defaultValue={v.new_client_phone} className={FIELD_CLS} dir="ltr" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
        {pending ? "جارٍ الإنشاء..." : "إنشاء عرض السعر ومتابعة الإعداد"}
      </button>
    </form>
  );
}
