import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getProject } from "@/lib/repo/projects";
import { db } from "@/lib/db/client";
import { getProjectModel, listVersions, getStages } from "@/lib/repo/models";
import { STAGES } from "@/lib/model/stages";
import { toggleStageAction, restoreVersionAction } from "../model-actions";
import ShareLink from "./share-link";

const STATUS_LABEL: Record<string, string> = { ACTIVE: "نشط", ON_HOLD: "متوقف مؤقتاً", CLOSED: "مغلق" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const quotes = (await db
    .prepare("SELECT id, number, status, issue_date FROM quotes WHERE project_id = ? ORDER BY created_at DESC")
    .all(id)) as { id: string; number: string; status: string; issue_date: string }[];

  const model = await getProjectModel(id);
  const versions = model ? await listVersions(model.id) : [];
  const stages = await getStages(id);
  const doneCount = STAGES.filter((s) => stages[String(s.no)]?.done).length;
  const canRestore = user.role === "ADMIN" || user.role === "MANAGER";

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

      {(project.model_url || project.client_model_url || project.project_file_url) && (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-3">النموذج وملفات المشروع</div>
          <div className="flex flex-wrap gap-2">
            {project.model_url && (
              <a href={project.model_url} target="_blank" rel="noopener noreferrer" className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
                النموذج ثلاثي الأبعاد ↗
              </a>
            )}
            {project.client_model_url && (
              <a href={project.client_model_url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
                نسخة الزبون من النموذج ↗
              </a>
            )}
            {project.project_file_url && (
              <a href={project.project_file_url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
                ملف المشروع PDF ↗
              </a>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-[var(--foreground-muted)]">مراحل المشروع</div>
          <div className="text-xs font-bold tabular" style={{ color: "var(--brand-dark)" }}>{doneCount} / {STAGES.length}</div>
        </div>
        <div className="grid sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {STAGES.map((s) => {
            const st = stages[String(s.no)];
            const done = !!st?.done;
            return (
              <form key={s.no} action={toggleStageAction.bind(null, id, s.no, !done)}>
                <button
                  type="submit"
                  title={s.hint}
                  className="w-full h-full text-right rounded-xl border px-3 py-2 text-xs transition"
                  style={{
                    borderColor: done ? "var(--brand-dark)" : "var(--border)",
                    background: done ? "var(--brand-dark)" : "white",
                    color: done ? "white" : "inherit",
                  }}
                >
                  <div className="font-extrabold tabular">{s.no}. {s.title}</div>
                  <div className="opacity-80 mt-0.5">{done ? `أُنجزت ${st?.at ?? ""}` : "لم تُنجز"}</div>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-[var(--foreground-muted)]">النموذج ثلاثي الأبعاد</div>
          {model && (
            <div className="flex flex-wrap gap-2">
              <a href={`/api/projects/${id}/model`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
                ملء الشاشة ↗
              </a>
              <a href={`/share/${model.share_token}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
                ما يراه الزبون ↗
              </a>
              <ShareLink path={`/share/${model.share_token}`} />
            </div>
          )}
        </div>
        {model ? (
          <>
            <iframe
              src={`/api/projects/${id}/model?v=${versions[0]?.version ?? ""}`}
              sandbox="allow-scripts allow-downloads"
              title="النموذج ثلاثي الأبعاد"
              className="w-full rounded-xl border border-[var(--border)]"
              style={{ height: "75vh" }}
            />
            <p className="text-xs text-[var(--foreground-muted)]">
              التعديلات تتم مع Claude: اذكر له رقم المشروع <span className="tabular font-bold" dir="ltr">{id}</span> والتعديل المطلوب، فيحفظ نسخة جديدة تظهر هنا بعد تحديث الصفحة. كل نسخة محفوظة ويمكن الرجوع إليها.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer font-bold">سجل النسخ ({versions.length})</summary>
              <div className="mt-2 border border-[var(--border)] rounded-xl overflow-hidden">
                {versions.map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[var(--border)] last:border-0">
                    <div>
                      <span className="font-bold tabular">النسخة {v.version}</span>
                      <span className="text-[var(--foreground-muted)]"> · المرحلة {v.stage} · {v.note}</span>
                      <div className="text-[11px] text-[var(--foreground-muted)] tabular">{v.created_by} · {v.created_at.slice(0, 16).replace("T", " ")}</div>
                    </div>
                    <div className="flex gap-2 flex-none">
                      <a href={`/api/projects/${id}/model?v=${v.version}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold rounded-lg border border-[var(--border)] px-2.5 py-1.5">عرض</a>
                      {canRestore && i > 0 && (
                        <form action={restoreVersionAction.bind(null, id, v.version)}>
                          <button type="submit" className="text-xs font-bold rounded-lg border border-[var(--border)] px-2.5 py-1.5">استعادة</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
            <span className="text-[var(--foreground-muted)]">لم يُربط نموذج بهذا المشروع بعد.</span>
            <Link href={`/plans?project=${id}`} className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
              اختر مخططاً من المكتبة
            </Link>
          </div>
        )}
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
