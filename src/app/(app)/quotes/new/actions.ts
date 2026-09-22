"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { createClient } from "@/lib/repo/clients";
import { createProject } from "@/lib/repo/projects";
import { createQuote } from "@/lib/repo/quotes";

export interface NewQuoteFormState {
  error?: string;
  values?: Record<string, string>;
}

export async function createQuoteWithEntitiesAction(
  _prev: NewQuoteFormState,
  formData: FormData
): Promise<NewQuoteFormState> {
  const user = await requireUser();
  const values = Object.fromEntries(formData) as Record<string, string>;

  const projectMode = String(formData.get("project_mode") || "existing");
  const clientMode = String(formData.get("client_mode") || "existing");

  let projectId = String(formData.get("project_id") || "");

  if (projectMode === "new") {
    const projectName = String(formData.get("new_project_name") || "").trim();
    if (!projectName) {
      return { error: "اسم المشروع مطلوب", values };
    }

    let clientId = String(formData.get("client_id") || "");

    if (clientMode === "new") {
      const clientName = String(formData.get("new_client_name") || "").trim();
      if (!clientName) {
        return { error: "اسم العميل مطلوب", values };
      }
      const client = await createClient(
        {
          name: clientName,
          contact_person: String(formData.get("new_client_contact") || "").trim(),
          phone: String(formData.get("new_client_phone") || "").trim(),
        },
        user.id
      );
      clientId = client.id;
    }

    if (!clientId) {
      return { error: "العميل مطلوب", values };
    }

    const project = await createProject(
      {
        name: projectName,
        client_id: clientId,
        location: String(formData.get("new_project_location") || "").trim(),
        manager_user_id: String(formData.get("new_project_manager") || "") || null,
      },
      user.id
    );
    projectId = project.id;
  }

  if (!projectId) {
    return { error: "يجب اختيار مشروع أو إنشاء مشروع جديد", values };
  }

  let quoteId: string;
  try {
    const quote = await createQuote(projectId, user.id);
    quoteId = quote.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر إنشاء عرض السعر";
    return { error: message, values };
  }

  redirect(`/quotes/${quoteId}`);
}
