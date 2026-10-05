// طبقة الوصول لبيانات المخططات التفاعلية لكل مشروع: صور مخططات الطوابق، والمناطق القابلة
// للنقر فوقها مع قياساتها الفعلية، ورمز رابط المشاركة العلني مع الزبون (بلا تسجيل دخول).
import { randomBytes } from "node:crypto";
import { db, uid } from "@/lib/db/client";

export interface FloorPlanRow {
  id: string;
  project_id: string;
  label: string;
  image_data_url: string;
  sort_order: number;
  created_at: string;
}

export interface PlanZoneRow {
  id: string;
  floor_plan_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  width_m: number;
  length_m: number;
  height_m: number;
  area_sqm: number;
  notes: string;
  sort_order: number;
}

export interface ZoneInput {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  width_m: number;
  length_m: number;
  height_m?: number;
  notes?: string;
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

export async function listFloorPlans(projectId: string): Promise<FloorPlanRow[]> {
  return (await db
    .prepare("SELECT * FROM project_floor_plans WHERE project_id = ? ORDER BY sort_order, created_at")
    .all(projectId)) as unknown as FloorPlanRow[];
}

export async function createFloorPlan(projectId: string, label: string, imageDataUrl: string): Promise<FloorPlanRow> {
  const id = uid("fp_");
  const countRow = (await db.prepare("SELECT COUNT(*) c FROM project_floor_plans WHERE project_id = ?").get(projectId)) as {
    c: number;
  };
  await db
    .prepare(
      `INSERT INTO project_floor_plans (id, project_id, label, image_data_url, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, projectId, label || "الطابق", imageDataUrl, countRow.c);
  return (await db.prepare("SELECT * FROM project_floor_plans WHERE id = ?").get(id)) as unknown as FloorPlanRow;
}

export async function renameFloorPlan(id: string, label: string): Promise<void> {
  await db.prepare("UPDATE project_floor_plans SET label = ? WHERE id = ?").run(label || "الطابق", id);
}

export async function deleteFloorPlan(id: string): Promise<void> {
  await db.prepare("DELETE FROM project_floor_plans WHERE id = ?").run(id);
}

export async function listZones(floorPlanId: string): Promise<PlanZoneRow[]> {
  return (await db
    .prepare("SELECT * FROM project_plan_zones WHERE floor_plan_id = ? ORDER BY sort_order, label")
    .all(floorPlanId)) as unknown as PlanZoneRow[];
}

export async function createZone(floorPlanId: string, input: ZoneInput): Promise<PlanZoneRow> {
  const id = uid("zn_");
  const area = round2((input.width_m || 0) * (input.length_m || 0));
  const countRow = (await db.prepare("SELECT COUNT(*) c FROM project_plan_zones WHERE floor_plan_id = ?").get(floorPlanId)) as {
    c: number;
  };
  await db
    .prepare(
      `INSERT INTO project_plan_zones (id, floor_plan_id, label, x, y, w, h, width_m, length_m, height_m, area_sqm, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      floorPlanId,
      input.label || "منطقة",
      input.x,
      input.y,
      input.w,
      input.h,
      input.width_m || 0,
      input.length_m || 0,
      input.height_m || 0,
      area,
      input.notes || "",
      countRow.c
    );
  return (await db.prepare("SELECT * FROM project_plan_zones WHERE id = ?").get(id)) as unknown as PlanZoneRow;
}

export async function updateZone(id: string, input: ZoneInput): Promise<void> {
  const area = round2((input.width_m || 0) * (input.length_m || 0));
  await db
    .prepare(
      `UPDATE project_plan_zones
       SET label = ?, x = ?, y = ?, w = ?, h = ?, width_m = ?, length_m = ?, height_m = ?, area_sqm = ?, notes = ?
       WHERE id = ?`
    )
    .run(
      input.label || "منطقة",
      input.x,
      input.y,
      input.w,
      input.h,
      input.width_m || 0,
      input.length_m || 0,
      input.height_m || 0,
      area,
      input.notes || "",
      id
    );
}

export async function deleteZone(id: string): Promise<void> {
  await db.prepare("DELETE FROM project_plan_zones WHERE id = ?").run(id);
}

function generateShareToken(): string {
  // 24 بايت عشوائية فعلياً (node:crypto) وليس uid() العادي — لأن هذا الرمز يمنح وصولاً علنياً
  // بلا تسجيل دخول، فيجب أن يكون غير قابل للتخمين.
  return randomBytes(24).toString("hex");
}

// ينشئ رمز مشاركة إن لم يوجد، أو يعيد الرمز الحالي إن كانت المشاركة مُفعّلة أصلاً.
export async function ensureShareToken(projectId: string): Promise<string> {
  const row = (await db.prepare("SELECT plan_share_token FROM projects WHERE id = ?").get(projectId)) as
    | { plan_share_token: string | null }
    | undefined;
  if (row?.plan_share_token) return row.plan_share_token;
  const token = generateShareToken();
  await db.prepare("UPDATE projects SET plan_share_token = ? WHERE id = ?").run(token, projectId);
  return token;
}

export async function revokeShareToken(projectId: string): Promise<void> {
  await db.prepare("UPDATE projects SET plan_share_token = NULL WHERE id = ?").run(projectId);
}

export interface PublicFloorPlan extends FloorPlanRow {
  zones: PlanZoneRow[];
}

export interface PublicPlanData {
  projectName: string;
  floorPlans: PublicFloorPlan[];
}

// بيانات المخطط للعرض العلني عبر رابط المشاركة — بلا تسجيل دخول، لذا لا تُعيد سوى اسم المشروع
// (لا عميل، لا ملاحظات داخلية، لا أي بيانات حساسة) مع صور المخططات ومناطقها.
export async function getPublicPlanData(token: string): Promise<PublicPlanData | undefined> {
  const project = (await db.prepare("SELECT id, name FROM projects WHERE plan_share_token = ?").get(token)) as
    | { id: string; name: string }
    | undefined;
  if (!project) return undefined;
  const floorPlans = await listFloorPlans(project.id);
  const withZones = await Promise.all(
    floorPlans.map(async (fp) => ({ ...fp, zones: await listZones(fp.id) }))
  );
  return { projectName: project.name, floorPlans: withZones };
}
