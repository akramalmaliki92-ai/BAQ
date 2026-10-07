"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guard";
import { getProject } from "@/lib/repo/projects";
import { getClient } from "@/lib/repo/clients";
import { createDesignRequest, listProjectDesignRequests } from "@/lib/repo/designRequests";
import { normalizePhone } from "@/lib/design/questions";

// ينشئ رابط استبيان خاص بالمشروع (أو يعيد استعمال مسودة قائمة) ليُرسل للزبون
export async function createProjectDesignLinkAction(projectId: string): Promise<void> {
  const user = await requireUser();
  const project = await getProject(projectId);
  if (!project) return;
  const existing = (await listProjectDesignRequests(projectId)).find((r) => r.status === "DRAFT" && r.source === "PROJECT");
  if (!existing) {
    const client = await getClient(project.client_id);
    await createDesignRequest({
      source: "PROJECT",
      name: client?.contact_person || client?.name || "",
      phone: normalizePhone(client?.phone || "") || client?.phone || "",
      governorate: "",
      project_id: projectId,
      client_id: project.client_id,
      created_by: user.id,
    });
  }
  revalidatePath(`/projects/${projectId}`);
}
