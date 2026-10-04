"use client";

import { useActionState, useState } from "react";
import { startFromPlanAction, type StartState } from "../../projects/model-actions";

const FIELD = "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2";

export default function StartForm({
  planId,
  clients,
  projects,
  preselect,
}: {
  planId: string;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; client_name: string }[];
  preselect?: string;
}) {
  const [state, action, pending] = useActionState<StartState, FormData>(startFromPlanAction, {});
  const [mode, setMode] = useState(preselect || projects.length ? "existing" : "new");

  return (
    <form action={action} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4 max-w-2xl">
      <div className="font-extrabold">ابدأ مشروعاً من هذا المخطط</div>
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="mode" value={mode} />
      <div className="flex gap-2 text-sm font-bold">
        <button type="button" onClick={() => setMode("existing")} className="rounded-lg px-3 py-1.5 border" style={{ borderColor: mode === "existing" ? "var(--brand-dark)" : "var(--border)" }}>
          مشروع موجود
        </button>
        <button type="button" onClick={() => setMode("new")} className="rounded-lg px-3 py-1.5 border" style={{ borderColor: mode === "new" ? "var(--brand-dark)" : "var(--border)" }}>
          مشروع جديد
        </button>
      </div>

      {mode === "existing" ? (
        <select name="project_id" defaultValue={preselect || ""} className={FIELD} required>
          <option value="">اختر المشروع (المشاريع التي ليس لها نموذج)...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
          ))}
        </select>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="name" placeholder="اسم المشروع" className={FIELD + " sm:col-span-2"} required />
          <select name="client_id" className={FIELD} required defaultValue="">
            <option value="">العميل...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="location" placeholder="الموقع" className={FIELD} />
        </div>
      )}

      {state.error && <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">{state.error}</div>}

      <button type="submit" disabled={pending} className="self-start rounded-xl text-white font-bold text-sm px-5 py-2.5 disabled:opacity-60" style={{ background: "var(--brand-dark)" }}>
        {pending ? "جارٍ الإنشاء..." : "ابدأ المشروع"}
      </button>
    </form>
  );
}
