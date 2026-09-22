import { requirePageUser } from "@/lib/auth/guard";
import { listProjects } from "@/lib/repo/projects";
import { listClients } from "@/lib/repo/clients";
import { listUsers } from "@/lib/repo/users";
import NewQuoteForm from "./new-quote-form";
import { createQuoteWithEntitiesAction } from "./actions";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requirePageUser();
  const { project: preselected } = await searchParams;
  const [projects, clients, users] = await Promise.all([listProjects(), listClients(), listUsers()]);
  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <h1 className="text-xl font-extrabold">عرض سعر جديد</h1>
      <NewQuoteForm
        action={createQuoteWithEntitiesAction}
        projects={projects.map((p) => ({ id: p.id, name: p.name, client_name: p.client_name }))}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        managers={managers.map((m) => ({ id: m.id, name: m.name }))}
        preselectedProjectId={preselected}
      />
    </div>
  );
}
