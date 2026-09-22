import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getProject } from "@/lib/repo/projects";
import { listClients } from "@/lib/repo/clients";
import { listUsers } from "@/lib/repo/users";
import ProjectForm from "../../project-form";
import { updateProjectAction } from "../../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const clients = await listClients();
  const managers = (await listUsers()).filter((u) => u.role === "MANAGER" || u.role === "ADMIN");
  const boundAction = updateProjectAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">تعديل المشروع</h1>
      <ProjectForm
        action={boundAction}
        clients={clients}
        managers={managers}
        submitLabel="حفظ التعديلات"
        defaultValues={{
          name: project.name,
          client_id: project.client_id,
          location: project.location,
          description: project.description,
          manager_user_id: project.manager_user_id || "",
          status: project.status,
          internal_notes: project.internal_notes,
        }}
      />
    </div>
  );
}
