import { db, uid, nowIso } from "@/lib/db/client";
import { nextQuoteNumber } from "@/lib/numbering";
import { getCompanySettings } from "@/lib/repo/settings";
import { getLibraryItem } from "@/lib/repo/library";

export type QuoteStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_REVISION" | "APPROVED" | "CANCELLED";

export interface QuoteRow {
  id: string;
  number: string;
  project_id: string;
  client_id: string;
  title: string;
  intro_text: string;
  outro_text: string;
  issue_date: string;
  valid_until: string | null;
  currency: string;
  execution_duration: string;
  payment_terms: string;
  internal_notes: string;
  status: QuoteStatus;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  tax_enabled: number;
  tax_pct: number;
  min_margin_pct: number | null;
  hide_unit_price: number;
  approved_by: string | null;
  approved_at: string | null;
  revision_note: string | null;
  is_demo: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // من الـJOIN
  project_name?: string;
  client_name?: string;
  created_by_name?: string;
}

export interface SectionWithItems {
  id: string;
  quote_id: string;
  name: string;
  sort_order: number;
  items: QuoteItemRow[];
}

export interface QuoteItemRow {
  id: string;
  section_id: string;
  library_item_id: string | null;
  code: string;
  name: string;
  description: string;
  unit: string;
  qty: number;
  unit_cost: number;
  margin_pct: number;
  manual_unit_price: number | null;
  internal_note: string;
  client_note: string;
  hidden_from_client: number;
  sort_order: number;
}

export interface PaymentRow {
  id: string;
  quote_id: string;
  label: string;
  pct: number;
  sort_order: number;
}

export interface OverheadCostRow {
  id: string;
  quote_id: string;
  label: string;
  days: number;
  daily_rate: number;
  sort_order: number;
}

export interface AuditRow {
  id: string;
  quote_id: string;
  user_id: string | null;
  user_name?: string;
  action: string;
  note: string;
  created_at: string;
}

const LIST_SELECT = `
  SELECT q.*, p.name as project_name, c.name as client_name, u.name as created_by_name
  FROM quotes q
  JOIN projects p ON p.id = q.project_id
  JOIN clients c ON c.id = q.client_id
  LEFT JOIN users u ON u.id = q.created_by
`;

export interface QuoteListFilters {
  search?: string;
  status?: QuoteStatus;
  createdBy?: string;
  from?: string;
  to?: string;
}

export async function listQuotes(filters?: QuoteListFilters): Promise<QuoteRow[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filters?.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`;
    clauses.push("(q.number LIKE ? OR c.name LIKE ? OR p.name LIKE ?)");
    params.push(q, q, q);
  }
  if (filters?.status) {
    clauses.push("q.status = ?");
    params.push(filters.status);
  }
  if (filters?.createdBy) {
    clauses.push("q.created_by = ?");
    params.push(filters.createdBy);
  }
  if (filters?.from) {
    clauses.push("q.issue_date >= ?");
    params.push(filters.from);
  }
  if (filters?.to) {
    clauses.push("q.issue_date <= ?");
    params.push(filters.to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return (await db.prepare(`${LIST_SELECT} ${where} ORDER BY q.created_at DESC`).all(...params)) as unknown as QuoteRow[];
}

export async function getQuote(id: string): Promise<QuoteRow | undefined> {
  return (await db.prepare(`${LIST_SELECT} WHERE q.id = ?`).get(id)) as unknown as QuoteRow | undefined;
}

export async function getSectionsWithItems(quoteId: string): Promise<SectionWithItems[]> {
  const sections = (await db
    .prepare("SELECT * FROM quote_sections WHERE quote_id = ? ORDER BY sort_order")
    .all(quoteId)) as unknown as Omit<SectionWithItems, "items">[];
  const items = (await db
    .prepare(
      `SELECT qi.* FROM quote_items qi
       JOIN quote_sections qs ON qs.id = qi.section_id
       WHERE qs.quote_id = ? ORDER BY qi.sort_order`
    )
    .all(quoteId)) as unknown as QuoteItemRow[];
  return sections.map((s) => ({ ...s, items: items.filter((i) => i.section_id === s.id) }));
}

export async function getPayments(quoteId: string): Promise<PaymentRow[]> {
  return (await db
    .prepare("SELECT * FROM quote_payments WHERE quote_id = ? ORDER BY sort_order")
    .all(quoteId)) as unknown as PaymentRow[];
}

export async function getAuditLog(quoteId: string): Promise<AuditRow[]> {
  return (await db
    .prepare(
      `SELECT a.*, u.name as user_name FROM quote_audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.quote_id = ? ORDER BY a.created_at DESC`
    )
    .all(quoteId)) as unknown as AuditRow[];
}

export async function logAudit(quoteId: string, userId: string | null, action: string, note = ""): Promise<void> {
  await db.prepare(
    "INSERT INTO quote_audit_log (id, quote_id, user_id, action, note) VALUES (?, ?, ?, ?, ?)"
  ).run(uid("aud_"), quoteId, userId, action, note);
}

export async function createQuote(projectId: string, createdBy: string, isDemo = false): Promise<QuoteRow> {
  const company = await getCompanySettings();
  const project = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId)) as
    | { client_id: string; default_currency: string }
    | undefined;
  if (!project) throw new Error("المشروع غير موجود");

  const id = uid("qte_");
  const number = await nextQuoteNumber(company.quote_prefix);
  const issueDate = new Date().toISOString().slice(0, 10);
  const validUntil = new Date(Date.now() + company.default_validity_days * 86400000)
    .toISOString()
    .slice(0, 10);

  await db.prepare(
    `INSERT INTO quotes (
      id, number, project_id, client_id, title, intro_text, outro_text, issue_date, valid_until,
      currency, execution_duration, payment_terms, internal_notes, status,
      discount_type, discount_value, tax_enabled, tax_pct, min_margin_pct, hide_unit_price,
      is_demo, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    number,
    projectId,
    project.client_id,
    "عرض سعر",
    company.intro_text,
    company.outro_text,
    issueDate,
    validUntil,
    project.default_currency || company.default_currency,
    "",
    company.default_payment_terms,
    "",
    "DRAFT",
    "PERCENT",
    0,
    0,
    0,
    company.min_margin_pct,
    0,
    isDemo ? 1 : 0,
    createdBy
  );

  // دفعات افتراضية: دفعة واحدة بكامل المبلغ، قابلة للتعديل
  await db.prepare("INSERT INTO quote_payments (id, quote_id, label, pct, sort_order) VALUES (?, ?, ?, ?, ?)").run(
    uid("pay_"),
    id,
    "الدفعة الأولى",
    100,
    0
  );

  await logAudit(id, createdBy, "CREATED", `إنشاء عرض السعر رقم ${number}`);
  return (await getQuote(id))!;
}

export interface QuoteMetaInput {
  title?: string;
  intro_text?: string;
  outro_text?: string;
  issue_date?: string;
  valid_until?: string | null;
  currency?: string;
  execution_duration?: string;
  payment_terms?: string;
  internal_notes?: string;
  discount_type?: "PERCENT" | "FIXED";
  discount_value?: number;
  tax_enabled?: boolean;
  tax_pct?: number;
  min_margin_pct?: number | null;
  hide_unit_price?: boolean;
}

const EDITABLE_STATUSES: QuoteStatus[] = ["DRAFT", "NEEDS_REVISION"];

export function isEditable(status: QuoteStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export async function updateQuoteMeta(id: string, input: QuoteMetaInput): Promise<void> {
  const current = await getQuote(id);
  if (!current) throw new Error("عرض السعر غير موجود");

  const taxEnabled = input.tax_enabled != null ? (input.tax_enabled ? 1 : 0) : current.tax_enabled;
  const hideUnitPrice = input.hide_unit_price != null ? (input.hide_unit_price ? 1 : 0) : current.hide_unit_price;
  const merged = {
    title: input.title ?? current.title,
    intro_text: input.intro_text ?? current.intro_text,
    outro_text: input.outro_text ?? current.outro_text,
    issue_date: input.issue_date ?? current.issue_date,
    valid_until: input.valid_until !== undefined ? input.valid_until : current.valid_until,
    currency: input.currency ?? current.currency,
    execution_duration: input.execution_duration ?? current.execution_duration,
    payment_terms: input.payment_terms ?? current.payment_terms,
    internal_notes: input.internal_notes ?? current.internal_notes,
    discount_type: input.discount_type ?? current.discount_type,
    discount_value: input.discount_value ?? current.discount_value,
    tax_pct: input.tax_pct ?? current.tax_pct,
    min_margin_pct: input.min_margin_pct !== undefined ? input.min_margin_pct : current.min_margin_pct,
  };

  await db.prepare(
    `UPDATE quotes SET title=?, intro_text=?, outro_text=?, issue_date=?, valid_until=?, currency=?,
     execution_duration=?, payment_terms=?, internal_notes=?, discount_type=?, discount_value=?,
     tax_enabled=?, tax_pct=?, min_margin_pct=?, hide_unit_price=?, updated_at=?
     WHERE id=?`
  ).run(
    merged.title,
    merged.intro_text,
    merged.outro_text,
    merged.issue_date,
    merged.valid_until,
    merged.currency,
    merged.execution_duration,
    merged.payment_terms,
    merged.internal_notes,
    merged.discount_type,
    Number(merged.discount_value) || 0,
    taxEnabled,
    Number(merged.tax_pct) || 0,
    merged.min_margin_pct,
    hideUnitPrice,
    nowIso(),
    id
  );
}

/* ---------------- الأقسام ---------------- */

export async function addSection(quoteId: string, name: string): Promise<string> {
  const id = uid("sec_");
  const maxRow = (await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) m FROM quote_sections WHERE quote_id = ?")
    .get(quoteId)) as { m: number };
  await db.prepare("INSERT INTO quote_sections (id, quote_id, name, sort_order) VALUES (?, ?, ?, ?)").run(
    id,
    quoteId,
    name,
    maxRow.m + 1
  );
  return id;
}

export async function renameSection(sectionId: string, name: string): Promise<void> {
  await db.prepare("UPDATE quote_sections SET name = ? WHERE id = ?").run(name, sectionId);
}

export async function deleteSection(sectionId: string): Promise<void> {
  await db.prepare("DELETE FROM quote_sections WHERE id = ?").run(sectionId);
}

export async function reorderSections(quoteId: string, orderedIds: string[]): Promise<void> {
  const stmt = db.prepare("UPDATE quote_sections SET sort_order = ? WHERE id = ? AND quote_id = ?");
  for (let idx = 0; idx < orderedIds.length; idx++) {
    await stmt.run(idx, orderedIds[idx], quoteId);
  }
}

/* ---------------- الفقرات ---------------- */

export interface CustomItemInput {
  name: string;
  description?: string;
  unit?: string;
  qty?: number;
  unit_cost?: number;
  margin_pct?: number;
  code?: string;
}

export async function addItemFromLibrary(sectionId: string, libraryItemId: string, qty = 1): Promise<string> {
  const li = await getLibraryItem(libraryItemId);
  if (!li) throw new Error("الفقرة غير موجودة في المكتبة");
  const id = uid("itm_");
  const maxRow = (await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) m FROM quote_items WHERE section_id = ?")
    .get(sectionId)) as { m: number };
  await db.prepare(
    `INSERT INTO quote_items (id, section_id, library_item_id, code, name, description, unit, qty, unit_cost, margin_pct, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    sectionId,
    li.id,
    li.code || "",
    li.name,
    li.description,
    li.unit,
    qty,
    li.default_unit_cost,
    li.default_margin_pct,
    maxRow.m + 1
  );
  return id;
}

export async function addCustomItem(sectionId: string, input: CustomItemInput): Promise<string> {
  const id = uid("itm_");
  const maxRow = (await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) m FROM quote_items WHERE section_id = ?")
    .get(sectionId)) as { m: number };
  await db.prepare(
    `INSERT INTO quote_items (id, section_id, library_item_id, code, name, description, unit, qty, unit_cost, margin_pct, sort_order)
     VALUES (?,?,NULL,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    sectionId,
    input.code || "",
    input.name,
    input.description || "",
    input.unit || "عدد",
    input.qty || 0,
    input.unit_cost || 0,
    input.margin_pct ?? 20,
    maxRow.m + 1
  );
  return id;
}

export async function copyItem(itemId: string): Promise<string> {
  const item = (await db.prepare("SELECT * FROM quote_items WHERE id = ?").get(itemId)) as unknown as QuoteItemRow | undefined;
  if (!item) throw new Error("الفقرة غير موجودة");
  const id = uid("itm_");
  const maxRow = (await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) m FROM quote_items WHERE section_id = ?")
    .get(item.section_id)) as { m: number };
  await db.prepare(
    `INSERT INTO quote_items (id, section_id, library_item_id, code, name, description, unit, qty, unit_cost, margin_pct, manual_unit_price, internal_note, client_note, hidden_from_client, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    item.section_id,
    item.library_item_id,
    item.code,
    `${item.name} (نسخة)`,
    item.description,
    item.unit,
    item.qty,
    item.unit_cost,
    item.margin_pct,
    item.manual_unit_price,
    item.internal_note,
    item.client_note,
    item.hidden_from_client,
    maxRow.m + 1
  );
  return id;
}

export interface ItemUpdateInput {
  name?: string;
  description?: string;
  unit?: string;
  qty?: number;
  unit_cost?: number;
  margin_pct?: number;
  manual_unit_price?: number | null;
  internal_note?: string;
  client_note?: string;
  hidden_from_client?: boolean;
}

export async function updateItem(itemId: string, input: ItemUpdateInput): Promise<void> {
  const current = (await db.prepare("SELECT * FROM quote_items WHERE id = ?").get(itemId)) as
    | QuoteItemRow
    | undefined;
  if (!current) throw new Error("الفقرة غير موجودة");
  const manualPrice = input.manual_unit_price !== undefined ? input.manual_unit_price : current.manual_unit_price;
  const hiddenFromClient =
    typeof input.hidden_from_client === "boolean" ? (input.hidden_from_client ? 1 : 0) : current.hidden_from_client;
  const merged = {
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    unit: input.unit ?? current.unit,
    qty: input.qty ?? current.qty,
    unit_cost: input.unit_cost ?? current.unit_cost,
    margin_pct: input.margin_pct ?? current.margin_pct,
    internal_note: input.internal_note ?? current.internal_note,
    client_note: input.client_note ?? current.client_note,
  };
  await db.prepare(
    `UPDATE quote_items SET name=?, description=?, unit=?, qty=?, unit_cost=?, margin_pct=?, manual_unit_price=?, internal_note=?, client_note=?, hidden_from_client=?
     WHERE id=?`
  ).run(
    merged.name,
    merged.description,
    merged.unit,
    Number(merged.qty) || 0,
    Number(merged.unit_cost) || 0,
    Number(merged.margin_pct) || 0,
    manualPrice === undefined || manualPrice === null ? null : Number(manualPrice),
    merged.internal_note,
    merged.client_note,
    hiddenFromClient,
    itemId
  );
}

export async function deleteItem(itemId: string): Promise<void> {
  await db.prepare("DELETE FROM quote_items WHERE id = ?").run(itemId);
}

export async function reorderItems(sectionId: string, orderedIds: string[]): Promise<void> {
  const stmt = db.prepare("UPDATE quote_items SET sort_order = ?, section_id = ? WHERE id = ?");
  for (let idx = 0; idx < orderedIds.length; idx++) {
    await stmt.run(idx, sectionId, orderedIds[idx]);
  }
}

export async function moveItemToSection(itemId: string, targetSectionId: string): Promise<void> {
  const maxRow = (await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) m FROM quote_items WHERE section_id = ?")
    .get(targetSectionId)) as { m: number };
  await db.prepare("UPDATE quote_items SET section_id = ?, sort_order = ? WHERE id = ?").run(
    targetSectionId,
    maxRow.m + 1,
    itemId
  );
}

/* ---------------- الدفعات ---------------- */

export async function setPayments(quoteId: string, payments: { label: string; pct: number }[]): Promise<void> {
  await db.prepare("DELETE FROM quote_payments WHERE quote_id = ?").run(quoteId);
  const stmt = db.prepare(
    "INSERT INTO quote_payments (id, quote_id, label, pct, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  for (let idx = 0; idx < payments.length; idx++) {
    const p = payments[idx];
    await stmt.run(uid("pay_"), quoteId, p.label, p.pct, idx);
  }
}

/* ---------------- مصاريف ونفقات المشروع الداخلية ---------------- */

export async function getOverheadCosts(quoteId: string): Promise<OverheadCostRow[]> {
  return (await db
    .prepare("SELECT * FROM quote_overhead_costs WHERE quote_id = ? ORDER BY sort_order")
    .all(quoteId)) as unknown as OverheadCostRow[];
}

export async function setOverheadCosts(
  quoteId: string,
  items: { label: string; days: number; daily_rate: number }[]
): Promise<void> {
  await db.prepare("DELETE FROM quote_overhead_costs WHERE quote_id = ?").run(quoteId);
  const stmt = db.prepare(
    "INSERT INTO quote_overhead_costs (id, quote_id, label, days, daily_rate, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    await stmt.run(uid("ovh_"), quoteId, it.label, Number(it.days) || 0, Number(it.daily_rate) || 0, idx);
  }
}

/* ---------------- دورة المراجعة والاعتماد ---------------- */

export async function sendForReview(quoteId: string, userId: string): Promise<void> {
  await db.prepare("UPDATE quotes SET status='IN_REVIEW', revision_note=NULL, updated_at=? WHERE id=?").run(
    nowIso(),
    quoteId
  );
  await logAudit(quoteId, userId, "SENT_FOR_REVIEW", "إرسال العرض للمراجعة");
}

export async function returnForRevision(quoteId: string, userId: string, note: string): Promise<void> {
  await db.prepare("UPDATE quotes SET status='NEEDS_REVISION', revision_note=?, updated_at=? WHERE id=?").run(
    note,
    nowIso(),
    quoteId
  );
  await logAudit(quoteId, userId, "RETURNED_FOR_REVISION", note);
}

export async function approveQuote(quoteId: string, userId: string): Promise<void> {
  await db.prepare(
    "UPDATE quotes SET status='APPROVED', approved_by=?, approved_at=?, updated_at=? WHERE id=?"
  ).run(userId, nowIso(), nowIso(), quoteId);
  await logAudit(quoteId, userId, "APPROVED", "اعتماد عرض السعر");
}

export async function cancelApproval(quoteId: string, userId: string, reason: string): Promise<void> {
  await db.prepare(
    "UPDATE quotes SET status='DRAFT', approved_by=NULL, approved_at=NULL, updated_at=? WHERE id=?"
  ).run(nowIso(), quoteId);
  await logAudit(quoteId, userId, "APPROVAL_CANCELLED", reason);
}

export async function cancelQuote(quoteId: string, userId: string, reason: string): Promise<void> {
  await db.prepare("UPDATE quotes SET status='CANCELLED', updated_at=? WHERE id=?").run(nowIso(), quoteId);
  await logAudit(quoteId, userId, "CANCELLED", reason);
}

export async function recordPriceEdit(quoteId: string, userId: string, note: string): Promise<void> {
  await logAudit(quoteId, userId, "PRICE_EDITED", note);
}

export async function recordExport(quoteId: string, userId: string, note: string): Promise<void> {
  await logAudit(quoteId, userId, "EXPORTED", note);
}
