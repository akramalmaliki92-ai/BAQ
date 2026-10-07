import { db, uid } from "@/lib/db/client";
import {
  type DesignRequestRow,
  parseAnswers,
  parseFiles,
  markSubmitted,
  linkRequest,
  setNotifyStatus,
  setDriveFolderOnce,
} from "@/lib/repo/designRequests";
import { missingQuestions, summaryLines, num } from "@/lib/design/questions";
import { createDriveFolder, notifyTelegram } from "@/lib/design/n8n";

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  return (xf.split(",")[0] || req.headers.get("x-real-ip") || "").trim().slice(0, 64);
}

export function siteOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

// يضمن وجود مجلد Drive للطلب (يُنشأ عند أول صورة)
export async function ensureFolder(r: DesignRequestRow): Promise<string> {
  if (r.drive_folder_id) return r.drive_folder_id;
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `${r.name || "زبون"} - ${r.phone || "بدون رقم"} - ${stamp}`;
  const { folderId } = await createDriveFolder(name);
  return setDriveFolderOnce(r.id, folderId);
}

async function findOrCreateClient(r: DesignRequestRow): Promise<string> {
  if (r.client_id) return r.client_id;
  const last10 = r.phone.slice(-10);
  const existing = (await db
    .prepare("SELECT id FROM clients WHERE phone = ? OR (? <> '' AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ?) ORDER BY created_at ASC LIMIT 1")
    .get(r.phone, last10, `%${last10}`)) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = uid("cli_");
  await db
    .prepare("INSERT INTO clients (id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)")
    .run(id, r.name, r.phone, r.governorate, "أُضيف تلقائياً من استبيان التصميم (الرابط العام)");
  return id;
}

async function createRequestProject(r: DesignRequestRow, clientId: string): Promise<string> {
  const a = parseAnswers(r);
  const id = uid("prj_");
  const name = `طلب تصميم: بيت ${num(a.plot_w)}×${num(a.plot_d)} — ${r.name}`;
  await db
    .prepare("INSERT INTO projects (id, name, client_id, location, description, status, internal_notes) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)")
    .run(id, name, clientId, r.governorate, summaryLines(a).join("\n"), "مصدر المشروع: استبيان التصميم (الرابط العام)");
  return id;
}

export type SubmitResult = { ok: true } | { ok: false; missing?: number[]; error?: string };

export async function submitRequest(r: DesignRequestRow, origin: string): Promise<SubmitResult> {
  if (r.status === "SUBMITTED") return { ok: true };
  const answers = parseAnswers(r);
  const missing = missingQuestions(answers);
  if (missing.length) return { ok: false, missing };
  if (!r.name || !r.phone) return { ok: false, error: "الاسم ورقم الهاتف مطلوبان" };

  // قلب الحالة أولاً بعملية ذرية، حتى لا يُنشأ مشروعان إن ضغط الزبون «إرسال» مرتين
  if (!(await markSubmitted(r.id))) return { ok: true };

  let projectId = r.project_id;
  try {
    if (r.source === "PUBLIC" && !projectId) {
      const clientId = await findOrCreateClient(r);
      projectId = await createRequestProject(r, clientId);
      await linkRequest(r.id, projectId, clientId);
    }
  } catch (e) {
    console.error("design submit: project creation failed", e);
  }

  try {
    const files = parseFiles(r);
    await notifyTelegram({
      title: r.source === "PUBLIC" ? "طلب تصميم جديد (الرابط العام)" : `استبيان تصميم مكتمل: ${r.project_name || "مشروع"}`,
      name: r.name,
      phone: r.phone,
      governorate: r.governorate,
      lines: summaryLines(answers).concat(answers.notes ? [`ملاحظة الزبون: ${answers.notes.slice(0, 300)}`] : []),
      photos: files.length ? `${files.length} صورة في Drive` : "لا توجد صور",
      url: `${origin}/design-requests/${r.id}`,
    });
    await setNotifyStatus(r.id, "sent");
  } catch (e) {
    console.error("design submit: notify failed", e);
    await setNotifyStatus(r.id, "failed");
  }
  return { ok: true };
}
