"use client";

import { useTransition } from "react";
import { toggleUserActiveAction, changeUserRoleAction, resetPasswordAction } from "./actions";
import type { Role } from "@/lib/auth/types";

export default function UserRowControls({ id, active, role, isSelf }: { id: string; active: boolean; role: Role; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <select
        defaultValue={role}
        disabled={isSelf || pending}
        onChange={(e) => startTransition(() => changeUserRoleAction(id, e.target.value as Role))}
        className="text-xs rounded-lg border border-[var(--border)] px-2 py-1.5 disabled:opacity-50"
      >
        <option value="ADMIN">مسؤول النظام</option>
        <option value="MANAGER">مدير</option>
        <option value="PREPARER">معدّ تندر</option>
      </select>
      <button
        disabled={isSelf || pending}
        onClick={() => startTransition(() => toggleUserActiveAction(id, !active))}
        className="text-xs font-bold px-2.5 py-1 rounded-full border disabled:opacity-50"
        style={active ? { color: "#2f7d4f", borderColor: "#2f7d4f", background: "#e3efe7" } : { color: "#8a8a8a", borderColor: "#d0d0d0", background: "#f2f2f2" }}
      >
        {active ? "مفعّل" : "معطّل"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          const pw = prompt("كلمة المرور الجديدة (6 أحرف على الأقل):");
          if (pw) startTransition(() => resetPasswordAction(id, pw).then(() => alert("تم تغيير كلمة المرور")).catch((e) => alert(e.message)));
        }}
        className="text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        إعادة تعيين كلمة المرور
      </button>
    </div>
  );
}
