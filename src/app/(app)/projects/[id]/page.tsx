import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getProject } from "@/lib/repo/projects";
import { db } from "@/lib/db/client";

const STATUS_LABEL: Record<string, string> = { ACTIVE: "نشط", ON_HOLD: "متوقف مؤقتاً", CLOSED: "مغلق" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const quotes = (await db
    .prepare("SELECT id, number, status, issue_date FROM quotes WHERE project_id = ? ORDER BY created_at DESC")
    .all(id)) as { id: string; number: string; status: string; issue_date: string }[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold">{project.name}</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-0.5">
            <Link href={`/clients/${project.client_id}`} className="font-bold" style={{ color: "var(--brand-dark)" }}>
              {project.client_name}
            </Link>
            {project.location && ` · ${project.location}`}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`} className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
            تعديل
          </Link>
          <Link href={`/quotes/new?project=${id}`} className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
            + عرض سعر جديد
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-1">الحالة</div>
          {STATUS_LABEL[project.status]}
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-1">المدير المسؤول</div>
          {project.manager_name || "—"}
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-1">العملة</div>
          {project.default_currency}
        </div>
      </div>

      {project.description && (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4 text-sm">{project.description}</div>
      )}

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] font-bold text-sm">عروض الأسعار</div>
        {quotes.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--foreground-muted)]">لا توجد عروض أسعار بعد</div>
        ) : (
          quotes.map((q) => (
            <Link key={q.id} href={`/quotes/${q.id}`} className="flex justify-between px-4 py-2.5 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
              <span className="tabular font-bold" style={{ color: "var(--brand-dark)" }}>{q.number}</span>
              <span className="tabular text-[var(--foreground-muted)]">{q.issue_date}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
