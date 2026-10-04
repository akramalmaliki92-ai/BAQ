"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/auth/guard";
import { createProject } from "@/lib/repo/projects";
import { startModelFromPlan, restoreVersion, setStage } from "@/lib/repo/models";

export interface StartState {
  error?: string;
}

// بدء مشروع من مخطط المكتبة: إما لمشروع قائم بلا نموذج، أو لمشروع جديد يُنشأ هنا
export async function startFromPlanAction(_prev: StartState, formData: FormData): Promise<StartState> {
  const user = await requireUser();
  const planId = String(formData.get("plan_id") || "");
  const mode = String(formData.get("mode") || "existing");
  let projectId = String(formData.get("project_id") || "");
  try {
    if (mode === "new") {
      const name = String(formData.get("name") || "").trim();
      const clientId = String(formData.get("client_id") || "");
      if (!name || !clientId) return { error: "اسم المشروع والعميل مطلوبان" };
      const p = await createProject(
        { name, client_id: clientId, location: String(formData.get("location") || "").trim() },
        user.id
      );
      projectId = p.id;
    }
    if (!projectId) return { error: "اختر المشروع" };
    await startModelFromPlan(projectId, planId, user.name);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر بدء المشروع" };
  }
  redirect(`/projects/${projectId}`);
}

export async function restoreVersionAction(projectId: string, version: number): Promise<void> {
  const user = await requireRole(["ADMIN", "MANAGER"]);
  await restoreVersion(projectId, version, user.name);
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleStageAction(projectId: string, no: number, done: boolean): Promise<void> {
  await requireUser();
  await setStage(projectId, no, done);
  revalidatePath(`/projects/${projectId}`);
}
