"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { createProject, updateProject, type ProjectInput } from "@/lib/repo/projects";

export interface ProjectFormState {
  error?: string;
  values?: Record<string, string>;
}

function readInput(formData: FormData): ProjectInput {
  return {
    name: String(formData.get("name") || "").trim(),
    client_id: String(formData.get("client_id") || ""),
    location: String(formData.get("location") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    manager_user_id: String(formData.get("manager_user_id") || "") || null,
    default_currency: String(formData.get("default_currency") || "IQD"),
    status: (String(formData.get("status") || "ACTIVE") as ProjectInput["status"]),
    internal_notes: String(formData.get("internal_notes") || "").trim(),
  };
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await requireUser();
  const input = readInput(formData);
  if (!input.name || !input.client_id) {
    return { error: "اسم المشروع والعميل مطلوبان", values: Object.fromEntries(formData) as Record<string, string> };
  }
  const project = await createProject(input, user.id);
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  id: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireUser();
  const input = readInput(formData);
  if (!input.name || !input.client_id) {
    return { error: "اسم المشروع والعميل مطلوبان", values: Object.fromEntries(formData) as Record<string, string> };
  }
  await updateProject(id, input);
  redirect(`/projects/${id}`);
}
