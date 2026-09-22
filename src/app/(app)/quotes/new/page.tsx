import { requirePageUser } from "@/lib/auth/guard";
import { listProjects } from "@/lib/repo/projects";
import { createQuoteAndRedirect } from "../actions";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requirePageUser();
  const { project: preselected } = await searchParams;
  const projects = await listProjects();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-extrabold">عرض سعر جديد</h1>
        <div className="text-sm text-[var(--foreground-muted)]">
          أنشئ مشروعاً أولاً قبل إعداد عرض سعر. <a href="/projects/new" className="font-bold" style={{ color: "var(--brand-dark)" }}>إنشاء مشروع</a>
        </div>
      </div>
    );
  }

  async function submit(formData: FormData) {
    "use server";
    const projectId = String(formData.get("project_id") || "");
    await createQuoteAndRedirect(projectId);
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <h1 className="text-xl font-extrabold">عرض سعر جديد</h1>
      <form action={submit} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">اختر المشروع</label>
          <select
            name="project_id"
            required
            defaultValue={preselected || ""}
            className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm"
          >
            <option value="">اختر...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="self-start rounded-xl text-white font-bold text-sm px-5 py-2.5" style={{ background: "var(--brand-dark)" }}>
          إنشاء عرض السعر ومتابعة الإعداد
        </button>
      </form>
    </div>
  );
}
