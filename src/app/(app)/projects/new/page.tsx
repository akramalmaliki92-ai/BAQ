import { requirePageUser } from "@/lib/auth/guard";
import { listClients } from "@/lib/repo/clients";
import { listUsers } from "@/lib/repo/users";
import ProjectForm from "../project-form";
import { createProjectAction } from "../actions";

export default async function NewProjectPage() {
  await requirePageUser();
  const clients = await listClients();
  const managers = (await listUsers()).filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">مشروع جديد</h1>
      {clients.length === 0 ? (
        <div className="text-sm text-[var(--foreground-muted)]">
          أضف عميلاً أولاً قبل إنشاء مشروع. <a href="/clients/new" className="font-bold" style={{ color: "var(--brand-dark)" }}>إضافة عميل</a>
        </div>
      ) : (
        <ProjectForm action={createProjectAction} submitLabel="حفظ المشروع" clients={clients} managers={managers} />
      )}
    </div>
  );
}
