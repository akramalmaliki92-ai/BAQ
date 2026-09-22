import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { listProjects } from "@/lib/repo/projects";

const STATUS_LABEL: Record<string, string> = { ACTIVE: "نشط", ON_HOLD: "متوقف مؤقتاً", CLOSED: "مغلق" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageUser();
  const { q } = await searchParams;
  const projects = await listProjects({ search: q });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">المشاريع</h1>
        <Link href="/projects/new" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
          + مشروع جديد
        </Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="ابحث باسم المشروع أو العميل..." className="w-full max-w-sm rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm" />
      </form>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="text-right font-bold px-4 py-2.5">المشروع</th>
              <th className="text-right font-bold px-4 py-2.5">العميل</th>
              <th className="text-right font-bold px-4 py-2.5">الموقع</th>
              <th className="text-right font-bold px-4 py-2.5">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[var(--foreground-muted)]">لا توجد مشاريع بعد</td></tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                <td className="px-4 py-2.5">
                  <Link href={`/projects/${p.id}`} className="font-bold" style={{ color: "var(--brand-dark)" }}>{p.name}</Link>
                </td>
                <td className="px-4 py-2.5">{p.client_name}</td>
                <td className="px-4 py-2.5">{p.location || "—"}</td>
                <td className="px-4 py-2.5">{STATUS_LABEL[p.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
