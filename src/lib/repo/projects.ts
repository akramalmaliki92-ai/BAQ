import { db, uid, nowIso } from "@/lib/db/client";

export interface ProjectRow {
  id: string;
  name: string;
  client_id: string;
  client_name?: string;
  location: string;
  description: string;
  manager_user_id: string | null;
  manager_name?: string;
  default_currency: string;
  status: "ACTIVE" | "ON_HOLD" | "CLOSED";
  internal_notes: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  name: string;
  client_id: string;
  location?: string;
  description?: string;
  manager_user_id?: string | null;
  default_currency?: string;
  status?: ProjectRow["status"];
  internal_notes?: string;
}

const BASE_SELECT = `
  SELECT p.*, c.name as client_name, u.name as manager_name
  FROM projects p
  JOIN clients c ON c.id = p.client_id
  LEFT JOIN users u ON u.id = p.manager_user_id
`;

export async function listProjects(opts?: { search?: string; status?: string; clientId?: string }): Promise<ProjectRow[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (opts?.search && opts.search.trim()) {
    clauses.push("(p.name LIKE ? OR c.name LIKE ?)");
    const q = `%${opts.search.trim()}%`;
    params.push(q, q);
  }
  if (opts?.status) {
    clauses.push("p.status = ?");
    params.push(opts.status);
  }
  if (opts?.clientId) {
    clauses.push("p.client_id = ?");
    params.push(opts.clientId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return (await db.prepare(`${BASE_SELECT} ${where} ORDER BY p.created_at DESC`).all(...params)) as unknown as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | undefined> {
  return (await db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(id)) as unknown as ProjectRow | undefined;
}

export async function createProject(input: ProjectInput, createdBy: string, isDemo = false): Promise<ProjectRow> {
  const id = uid("prj_");
  await db.prepare(
    `INSERT INTO projects (id, name, client_id, location, description, manager_user_id, default_currency, status, internal_notes, is_demo, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.client_id,
    input.location || "",
    input.description || "",
    input.manager_user_id || null,
    input.default_currency || "IQD",
    input.status || "ACTIVE",
    input.internal_notes || "",
    isDemo ? 1 : 0,
    createdBy
  );
  return (await getProject(id))!;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  await db.prepare(
    `UPDATE projects SET name=?, client_id=?, location=?, description=?, manager_user_id=?, default_currency=?, status=?, internal_notes=?, updated_at=?
     WHERE id=?`
  ).run(
    input.name,
    input.client_id,
    input.location || "",
    input.description || "",
    input.manager_user_id || null,
    input.default_currency || "IQD",
    input.status || "ACTIVE",
    input.internal_notes || "",
    nowIso(),
    id
  );
}

export async function projectQuotesCount(projectId: string): Promise<number> {
  const r = (await db.prepare("SELECT COUNT(*) c FROM quotes WHERE project_id = ?").get(projectId)) as {
    c: number;
  };
  return r.c;
}
