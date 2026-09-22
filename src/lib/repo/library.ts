import { db, uid, nowIso } from "@/lib/db/client";

export interface LibraryItemRow {
  id: string;
  code: string | null;
  name: string;
  main_category: string;
  sub_category: string;
  description: string;
  unit: string;
  default_unit_cost: number;
  default_margin_pct: number;
  currency: string;
  cost_updated_at: string;
  internal_notes: string;
  active: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryItemInput {
  code?: string;
  name: string;
  main_category?: string;
  sub_category?: string;
  description?: string;
  unit?: string;
  default_unit_cost?: number;
  default_margin_pct?: number;
  currency?: string;
  internal_notes?: string;
}

export async function listLibraryItems(opts?: {
  search?: string;
  mainCategory?: string;
  includeInactive?: boolean;
}): Promise<LibraryItemRow[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (!opts?.includeInactive) clauses.push("active = 1");
  if (opts?.search && opts.search.trim()) {
    clauses.push("(name LIKE ? OR code LIKE ?)");
    const q = `%${opts.search.trim()}%`;
    params.push(q, q);
  }
  if (opts?.mainCategory) {
    clauses.push("main_category = ?");
    params.push(opts.mainCategory);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return (await db
    .prepare(`SELECT * FROM library_items ${where} ORDER BY main_category, sub_category, name`)
    .all(...params)) as unknown as LibraryItemRow[];
}

export async function listCategories(): Promise<string[]> {
  const rows = (await db
    .prepare("SELECT DISTINCT main_category FROM library_items WHERE main_category != '' ORDER BY main_category")
    .all()) as { main_category: string }[];
  return rows.map((r) => r.main_category);
}

export async function getLibraryItem(id: string): Promise<LibraryItemRow | undefined> {
  return (await db.prepare("SELECT * FROM library_items WHERE id = ?").get(id)) as unknown as LibraryItemRow | undefined;
}

export async function createLibraryItem(input: LibraryItemInput, isDemo = false): Promise<LibraryItemRow> {
  const id = uid("lib_");
  await db.prepare(
    `INSERT INTO library_items (id, code, name, main_category, sub_category, description, unit, default_unit_cost, default_margin_pct, currency, internal_notes, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.code || null,
    input.name,
    input.main_category || "",
    input.sub_category || "",
    input.description || "",
    input.unit || "عدد",
    input.default_unit_cost || 0,
    input.default_margin_pct ?? 20,
    input.currency || "IQD",
    input.internal_notes || "",
    isDemo ? 1 : 0
  );
  return (await getLibraryItem(id))!;
}

export async function updateLibraryItem(id: string, input: LibraryItemInput): Promise<void> {
  await db.prepare(
    `UPDATE library_items SET code=?, name=?, main_category=?, sub_category=?, description=?, unit=?, default_unit_cost=?, default_margin_pct=?, currency=?, internal_notes=?, cost_updated_at=?, updated_at=?
     WHERE id=?`
  ).run(
    input.code || null,
    input.name,
    input.main_category || "",
    input.sub_category || "",
    input.description || "",
    input.unit || "عدد",
    input.default_unit_cost || 0,
    input.default_margin_pct ?? 20,
    input.currency || "IQD",
    input.internal_notes || "",
    nowIso(),
    nowIso(),
    id
  );
}

export async function setLibraryItemActive(id: string, active: boolean): Promise<void> {
  await db.prepare("UPDATE library_items SET active = ?, updated_at = ? WHERE id = ?").run(
    active ? 1 : 0,
    nowIso(),
    id
  );
}
