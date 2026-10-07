import { randomBytes } from "node:crypto";
import { db, uid, nowIso } from "@/lib/db/client";
import type { Answers, StoredFile } from "@/lib/design/questions";

export interface DesignRequestRow {
  id: string;
  token: string;
  source: "PUBLIC" | "PROJECT";
  status: "DRAFT" | "SUBMITTED";
  project_id: string | null;
  client_id: string | null;
  name: string;
  phone: string;
  governorate: string;
  answers_json: string;
  files_json: string;
  drive_folder_id: string;
  notify_status: string;
  ip: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  project_name?: string | null;
}

export function parseAnswers(r: Pick<DesignRequestRow, "answers_json">): Answers {
  try {
    const o = JSON.parse(r.answers_json || "{}");
    return o && typeof o === "object" ? (o as Answers) : {};
  } catch {
    return {};
  }
}

export function parseFiles(r: Pick<DesignRequestRow, "files_json">): StoredFile[] {
  try {
    const a = JSON.parse(r.files_json || "[]");
    return Array.isArray(a) ? (a as StoredFile[]) : [];
  } catch {
    return [];
  }
}

const SELECT = `SELECT d.*, p.name AS project_name FROM design_requests d LEFT JOIN projects p ON p.id = d.project_id`;

export async function getDesignRequestByToken(token: string): Promise<DesignRequestRow | undefined> {
  if (!/^[a-f0-9]{32}$/.test(token)) return undefined;
  return (await db.prepare(`${SELECT} WHERE d.token = ?`).get(token)) as unknown as DesignRequestRow | undefined;
}

export async function getDesignRequest(id: string): Promise<DesignRequestRow | undefined> {
  return (await db.prepare(`${SELECT} WHERE d.id = ?`).get(id)) as unknown as DesignRequestRow | undefined;
}

export async function listDesignRequests(): Promise<DesignRequestRow[]> {
  return (await db.prepare(`${SELECT} ORDER BY COALESCE(d.submitted_at, d.updated_at) DESC LIMIT 300`).all()) as unknown as DesignRequestRow[];
}

export async function listProjectDesignRequests(projectId: string): Promise<DesignRequestRow[]> {
  return (await db.prepare(`${SELECT} WHERE d.project_id = ? ORDER BY d.created_at DESC`).all(projectId)) as unknown as DesignRequestRow[];
}

// عدد الطلبات العامة التي أُنشئت من نفس العنوان خلال الساعة الأخيرة (حماية من العبث)
export async function recentPublicCountByIp(ip: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const r = (await db
    .prepare("SELECT COUNT(*) c FROM design_requests WHERE source = 'PUBLIC' AND ip = ? AND created_at > ?")
    .get(ip, since)) as { c: number | string };
  return Number(r.c);
}

export async function createDesignRequest(input: {
  source: "PUBLIC" | "PROJECT";
  name: string;
  phone: string;
  governorate: string;
  project_id?: string | null;
  client_id?: string | null;
  ip?: string;
  created_by?: string | null;
}): Promise<DesignRequestRow> {
  const id = uid("dsn_");
  const token = randomBytes(16).toString("hex");
  await db
    .prepare(
      `INSERT INTO design_requests (id, token, source, name, phone, governorate, project_id, client_id, ip, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, token, input.source, input.name, input.phone, input.governorate, input.project_id || null, input.client_id || null, input.ip || "", input.created_by || null);
  return (await getDesignRequest(id))!;
}

export async function saveDraft(id: string, data: { answers: Answers; name?: string; phone?: string; governorate?: string }): Promise<void> {
  await db
    .prepare(
      `UPDATE design_requests SET answers_json = ?, name = COALESCE(?, name), phone = COALESCE(?, phone), governorate = COALESCE(?, governorate), updated_at = ?
       WHERE id = ? AND status = 'DRAFT'`
    )
    .run(JSON.stringify(data.answers), data.name ?? null, data.phone ?? null, data.governorate ?? null, nowIso(), id);
}

// يثبّت مجلد Drive للطلب مرة واحدة فقط؛ إن سبقه طلب آخر يعيد المجلد المثبّت أولاً
export async function setDriveFolderOnce(id: string, folderId: string): Promise<string> {
  await db.prepare("UPDATE design_requests SET drive_folder_id = ? WHERE id = ? AND drive_folder_id = ''").run(folderId, id);
  const r = (await db.prepare("SELECT drive_folder_id FROM design_requests WHERE id = ?").get(id)) as { drive_folder_id: string };
  return r.drive_folder_id;
}

// إضافة ملف للقائمة بعملية ذرية واحدة (بلا قراءة ثم كتابة)
export async function appendFile(id: string, f: StoredFile): Promise<void> {
  await db
    .prepare("UPDATE design_requests SET files_json = (files_json::jsonb || ?::jsonb)::text, updated_at = ? WHERE id = ? AND status = 'DRAFT'")
    .run(JSON.stringify([f]), nowIso(), id);
}

export async function removeFile(id: string, fileId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE design_requests SET files_json = COALESCE((SELECT jsonb_agg(e) FROM jsonb_array_elements(files_json::jsonb) e WHERE e->>'fileId' <> ?), '[]'::jsonb)::text, updated_at = ?
       WHERE id = ? AND status = 'DRAFT'`
    )
    .run(fileId, nowIso(), id);
}

export async function markSubmitted(id: string): Promise<boolean> {
  const now = nowIso();
  const r = (await db
    .prepare("UPDATE design_requests SET status = 'SUBMITTED', submitted_at = ?, updated_at = ? WHERE id = ? AND status = 'DRAFT' RETURNING id")
    .get(now, now, id)) as { id: string } | undefined;
  return !!r;
}

export async function linkRequest(id: string, projectId: string, clientId: string): Promise<void> {
  await db.prepare("UPDATE design_requests SET project_id = ?, client_id = ? WHERE id = ?").run(projectId, clientId, id);
}

export async function setNotifyStatus(id: string, s: string): Promise<void> {
  await db.prepare("UPDATE design_requests SET notify_status = ? WHERE id = ?").run(s, id);
}

export async function getSetting(key: string): Promise<string> {
  const r = (await db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key)) as { value: string } | undefined;
  return r?.value || "";
}
