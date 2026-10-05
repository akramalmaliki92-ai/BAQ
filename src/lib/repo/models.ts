import { randomBytes } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { db, uid, nowIso } from "@/lib/db/client";
import { parseStages, type StageState } from "@/lib/model/stages";

// بيانات النموذج قد تُحفظ مضغوطة (gzip ثم base64 بالبادئة "gz:") لتقليل الحجم في قاعدة البيانات
function decodeModelJs(js: string | undefined): string | undefined {
  if (!js) return js;
  return js.startsWith("gz:") ? gunzipSync(Buffer.from(js.slice(3), "base64")).toString("utf8") : js;
}

// ===== مكتبة المخططات =====
export type PlanKind = "HOUSE" | "APARTMENT" | "BUILDING" | "VILLA" | "OTHER";
export const KIND_LABEL: Record<PlanKind, string> = {
  HOUSE: "بيت",
  APARTMENT: "شقة",
  BUILDING: "بناية",
  VILLA: "فيلا",
  OTHER: "أخرى",
};

export interface PlanRow {
  id: string;
  name: string;
  kind: PlanKind;
  plot_w: number;
  plot_d: number;
  floors: number;
  built_area: number;
  bedrooms: number;
  description: string;
  source: string;
  thumbnail: string;
  active: number;
  created_at: string;
}

const PLAN_COLS =
  "id, name, kind, plot_w, plot_d, floors, built_area, bedrooms, description, source, thumbnail, active, created_at";

export async function listPlans(f: {
  kind?: string;
  minArea?: number;
  maxArea?: number;
  maxWidth?: number;
  maxDepth?: number;
  floors?: number;
}): Promise<PlanRow[]> {
  const where: string[] = ["active = 1"];
  const p: (string | number)[] = [];
  if (f.kind) { where.push("kind = ?"); p.push(f.kind); }
  if (f.minArea) { where.push("built_area >= ?"); p.push(f.minArea); }
  if (f.maxArea) { where.push("built_area <= ?"); p.push(f.maxArea); }
  // القطعة يجب أن تتسع للمخطط: عرض المخطط وعمقه لا يتجاوزان أبعاد قطعة الزبون
  if (f.maxWidth) { where.push("plot_w <= ?"); p.push(f.maxWidth); }
  if (f.maxDepth) { where.push("plot_d <= ?"); p.push(f.maxDepth); }
  if (f.floors) { where.push("floors = ?"); p.push(f.floors); }
  return (await db
    .prepare(`SELECT ${PLAN_COLS} FROM plan_templates WHERE ${where.join(" AND ")} ORDER BY built_area ASC`)
    .all(...p)) as unknown as PlanRow[];
}

export async function getPlan(id: string): Promise<PlanRow | undefined> {
  return (await db.prepare(`SELECT ${PLAN_COLS} FROM plan_templates WHERE id = ?`).get(id)) as unknown as
    | PlanRow
    | undefined;
}

export async function getPlanModelJs(id: string): Promise<string | undefined> {
  const r = (await db.prepare("SELECT model_js FROM plan_templates WHERE id = ?").get(id)) as
    | { model_js: string }
    | undefined;
  return decodeModelJs(r?.model_js);
}

// ===== نموذج المشروع ونسخه =====
export interface ProjectModelRow {
  id: string;
  project_id: string;
  template_id: string | null;
  share_token: string;
  scene?: string; // "engine" = نموذج المحرك العام؛ غير ذلك = مشهد مخصص في public/v/s/<scene>.js
  created_at: string;
}

export interface VersionRow {
  id: string;
  version: number;
  stage: number;
  note: string;
  created_by: string;
  created_at: string;
}

export async function getProjectModel(projectId: string): Promise<ProjectModelRow | undefined> {
  return (await db.prepare("SELECT * FROM project_models WHERE project_id = ?").get(projectId)) as unknown as
    | ProjectModelRow
    | undefined;
}

export async function getModelByToken(token: string): Promise<ProjectModelRow | undefined> {
  if (!/^[a-f0-9]{32}$/.test(token)) return undefined;
  return (await db.prepare("SELECT * FROM project_models WHERE share_token = ?").get(token)) as unknown as
    | ProjectModelRow
    | undefined;
}

export async function listVersions(modelId: string): Promise<VersionRow[]> {
  return (await db
    .prepare(
      "SELECT id, version, stage, note, created_by, created_at FROM model_versions WHERE model_id = ? ORDER BY version DESC"
    )
    .all(modelId)) as unknown as VersionRow[];
}

// آخر نسخة، أو نسخة محددة برقمها
export async function getVersionJs(modelId: string, version?: number): Promise<string | undefined> {
  const r = (version
    ? await db.prepare("SELECT model_js FROM model_versions WHERE model_id = ? AND version = ?").get(modelId, version)
    : await db
        .prepare("SELECT model_js FROM model_versions WHERE model_id = ? ORDER BY version DESC LIMIT 1")
        .get(modelId)) as { model_js: string } | undefined;
  return decodeModelJs(r?.model_js);
}

async function addVersion(modelId: string, js: string, stage: number, note: string, by: string): Promise<number> {
  const last = (await db
    .prepare("SELECT COALESCE(MAX(version), 0) AS v FROM model_versions WHERE model_id = ?")
    .get(modelId)) as { v: number };
  const v = Number(last.v) + 1;
  await db
    .prepare(
      "INSERT INTO model_versions (id, model_id, version, stage, note, model_js, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(uid("ver_"), modelId, v, stage, note, js, by, nowIso());
  return v;
}

// ينسخ مخطط المكتبة إلى المشروع كنسخة أولى؛ الأصل في المكتبة لا يتغير
export async function startModelFromPlan(projectId: string, planId: string, by: string): Promise<void> {
  const raw = (await db.prepare("SELECT model_js FROM plan_templates WHERE id = ?").get(planId)) as
    | { model_js: string }
    | undefined;
  const js = raw?.model_js;
  if (!js) throw new Error("المخطط غير موجود");
  if (await getProjectModel(projectId)) throw new Error("لهذا المشروع نموذج بالفعل");
  const id = uid("mdl_");
  await db
    .prepare("INSERT INTO project_models (id, project_id, template_id, share_token, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, projectId, planId, randomBytes(16).toString("hex"), nowIso());
  const plan = await getPlan(planId);
  await addVersion(id, js, 1, `نسخة من مخطط المكتبة: ${plan?.name ?? planId}`, by);
  await setStage(projectId, 1, true);
}

// الاستعادة لا تحذف شيئاً: تُنشئ نسخة جديدة مطابقة للنسخة القديمة
export async function restoreVersion(projectId: string, version: number, by: string): Promise<void> {
  const m = await getProjectModel(projectId);
  if (!m) throw new Error("لا يوجد نموذج");
  const raw = (await db
    .prepare("SELECT model_js FROM model_versions WHERE model_id = ? AND version = ?")
    .get(m.id, version)) as { model_js: string } | undefined;
  const js = raw?.model_js;
  if (!js) throw new Error("النسخة غير موجودة");
  const old = (await db
    .prepare("SELECT stage FROM model_versions WHERE model_id = ? AND version = ?")
    .get(m.id, version)) as { stage: number };
  await addVersion(m.id, js, old.stage, `استعادة النسخة ${version}`, by);
}

// ===== مراحل المنهجية =====
export async function getStages(projectId: string): Promise<StageState> {
  const r = (await db.prepare("SELECT stages_json FROM projects WHERE id = ?").get(projectId)) as
    | { stages_json: string }
    | undefined;
  return parseStages(r?.stages_json);
}

export async function setStage(projectId: string, no: number, done: boolean): Promise<void> {
  const s = await getStages(projectId);
  s[String(no)] = done ? { done: true, at: nowIso().slice(0, 10) } : { done: false };
  await db.prepare("UPDATE projects SET stages_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(s), nowIso(), projectId);
}
