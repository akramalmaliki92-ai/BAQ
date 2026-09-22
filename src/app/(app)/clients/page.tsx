import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listClients } from "@/lib/repo/clients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageUser();
  const { q } = await searchParams;
  const clients = await listClients(q);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">العملاء</h1>
        <Link href="/clients/new" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
          + عميل جديد
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full max-w-sm rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm"
        />
      </form>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="text-right font-bold px-4 py-2.5">الاسم</th>
              <th className="text-right font-bold px-4 py-2.5">المسؤول</th>
              <th className="text-right font-bold px-4 py-2.5">الهاتف</th>
              <th className="text-right font-bold px-4 py-2.5">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--foreground-muted)]">
                  لا يوجد عملاء بعد
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <td className="px-4 py-2.5">
                  <Link href={`/clients/${c.id}`} className="font-bold" style={{ color: "var(--brand-dark)" }}>
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{c.contact_person || "—"}</td>
                <td className="px-4 py-2.5 tabular" dir="ltr">{c.phone || "—"}</td>
                <td className="px-4 py-2.5 tabular text-[var(--foreground-muted)]">{c.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
