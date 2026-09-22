"use client";

import { useActionState } from "react";
import { createUserAction, type UserFormState } from "./actions";

const initial: UserFormState = {};
const cls = "rounded-xl border border-[var(--border)] px-3 py-2 text-sm";

export default function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initial);
  return (
    <form action={formAction} className="bg-white rounded-2xl border border-[var(--border)] p-4 flex gap-2 flex-wrap items-end">
      <div>
        <label className="block text-[11px] font-bold mb-1 text-[var(--foreground-muted)]">الاسم</label>
        <input name="name" required className={cls} />
      </div>
      <div>
        <label className="block text-[11px] font-bold mb-1 text-[var(--foreground-muted)]">البريد الإلكتروني</label>
        <input name="email" type="email" required className={cls} dir="ltr" />
      </div>
      <div>
        <label className="block text-[11px] font-bold mb-1 text-[var(--foreground-muted)]">كلمة المرور</label>
        <input name="password" type="password" required minLength={6} className={cls} />
      </div>
      <div>
        <label className="block text-[11px] font-bold mb-1 text-[var(--foreground-muted)]">الدور</label>
        <select name="role" className={cls}>
          <option value="PREPARER">معدّ تندر</option>
          <option value="MANAGER">مدير</option>
          <option value="ADMIN">مسؤول النظام</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded-xl text-white font-bold text-sm px-4 py-2 disabled:opacity-60" style={{ background: "var(--brand-dark)" }}>
        {pending ? "..." : "+ إضافة مستخدم"}
      </button>
      {state.error && <div className="text-xs text-red-700 font-bold w-full">{state.error}</div>}
    </form>
  );
}
