import { db, uid, nowIso } from "@/lib/db/client";

export interface ClientRow {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  notes: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  notes?: string;
}

export async function listClients(search?: string): Promise<ClientRow[]> {
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    return (await db
      .prepare(
        `SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? OR contact_person LIKE ?
         ORDER BY created_at DESC`
      )
      .all(q, q, q)) as unknown as ClientRow[];
  }
  return (await db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all()) as unknown as ClientRow[];
}

export async function getClient(id: string): Promise<ClientRow | undefined> {
  return (await db.prepare("SELECT * FROM clients WHERE id = ?").get(id)) as unknown as ClientRow | undefined;
}

export async function findSimilarClients(name: string, phone?: string): Promise<ClientRow[]> {
  const namePart = name.trim().slice(0, 6);
  if (!namePart && !phone) return [];
  const rows = (await db
    .prepare(
      `SELECT * FROM clients WHERE (? != '' AND name LIKE ?) OR (? != '' AND phone = ?) LIMIT 5`
    )
    .all(namePart, `%${namePart}%`, phone || "", phone || "")) as unknown as ClientRow[];
  return rows;
}

export async function createClient(input: ClientInput, createdBy: string, isDemo = false): Promise<ClientRow> {
  const id = uid("cli_");
  await db.prepare(
    `INSERT INTO clients (id, name, contact_person, phone, email, address, tax_number, notes, is_demo, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.contact_person || "",
    input.phone || "",
    input.email || "",
    input.address || "",
    input.tax_number || "",
    input.notes || "",
    isDemo ? 1 : 0,
    createdBy
  );
  return (await getClient(id))!;
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  await db.prepare(
    `UPDATE clients SET name=?, contact_person=?, phone=?, email=?, address=?, tax_number=?, notes=?, updated_at=?
     WHERE id=?`
  ).run(
    input.name,
    input.contact_person || "",
    input.phone || "",
    input.email || "",
    input.address || "",
    input.tax_number || "",
    input.notes || "",
    nowIso(),
    id
  );
}

export async function clientProjectsAndQuotesCount(clientId: string): Promise<{ projects: number; quotes: number }> {
  const p = (await db.prepare("SELECT COUNT(*) c FROM projects WHERE client_id = ?").get(clientId)) as {
    c: number;
  };
  const q = (await db.prepare("SELECT COUNT(*) c FROM quotes WHERE client_id = ?").get(clientId)) as {
    c: number;
  };
  return { projects: p.c, quotes: q.c };
}
