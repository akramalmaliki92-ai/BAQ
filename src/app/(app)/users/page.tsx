import { requirePageRole } from "@/lib/auth/guard";
import { listUsers } from "@/lib/repo/users";
import { roleLabel } from "@/lib/auth/types";
import UserRowControls from "./row-controls";
import NewUserForm from "./new-user-form";

export default async function UsersPage() {
  const current = await requirePageRole(["ADMIN"]);
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">المستخدمون والصلاحيات</h1>

      <NewUserForm />

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="text-right font-bold px-4 py-2.5">الاسم</th>
              <th className="text-right font-bold px-4 py-2.5">البريد الإلكتروني</th>
              <th className="text-right font-bold px-4 py-2.5">الدور</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2.5 font-bold">{u.name} {u.is_demo === 1 && <span className="text-[10px] font-normal text-[var(--foreground-muted)]">(تجريبي)</span>}</td>
                <td className="px-4 py-2.5 tabular" dir="ltr">{u.email}</td>
                <td className="px-4 py-2.5">{roleLabel(u.role)}</td>
                <td className="px-4 py-2.5">
                  <UserRowControls id={u.id} active={!!u.active} role={u.role} isSelf={u.id === current.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
