import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getPlan, KIND_LABEL } from "@/lib/repo/models";
import { listClients } from "@/lib/repo/clients";
import { db } from "@/lib/db/client";
import StartForm from "./start-form";

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  await requirePageUser();
  const { id } = await params;
  const { project } = await searchParams;
  const plan = await getPlan(id);
  if (!plan) notFound();

  const clients = (await listClients()).map((c) => ({ id: c.id, name: c.name }));
  // المشاريع التي لم يُربط بها نموذج بعد
  const projects = (await db
    .prepare(
      `SELECT p.id, p.name, c.name AS client_name FROM projects p JOIN clients c ON c.id = p.client_id
       WHERE NOT EXISTS (SELECT 1 FROM project_models m WHERE m.project_id = p.id) ORDER BY p.created_at DESC`
    )
    .all()) as { id: string; name: string; client_name: string }[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/plans" className="text-xs font-bold text-[var(--foreground-muted)]">← مكتبة المخططات</Link>
          <h1 className="text-xl font-extrabold mt-1">{plan.name}</h1>
          <div className="text-sm text-[var(--foreground-muted)] tabular">
            {KIND_LABEL[plan.kind]} · القطعة {plan.plot_w}×{plan.plot_d} م · {plan.floors} طابق · {Math.round(plan.built_area)} م² مبنية
            {plan.bedrooms ? ` · ${plan.bedrooms} غرف نوم` : ""}
          </div>
        </div>
        <a href={`/api/plans/${id}/view`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">
          ملء الشاشة ↗
        </a>
      </div>

      {plan.description && <div className="bg-white rounded-2xl border border-[var(--border)] p-4 text-sm whitespace-pre-line">{plan.description}</div>}

      <iframe
        src={`/api/plans/${id}/view`}
        sandbox="allow-scripts allow-downloads"
        title={plan.name}
        className="w-full rounded-2xl border border-[var(--border)] bg-white"
        style={{ height: "75vh" }}
      />

      <StartForm planId={id} clients={clients} projects={projects} preselect={project} />
    </div>
  );
}
