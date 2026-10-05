"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guard";
import {
  createFloorPlan,
  renameFloorPlan,
  deleteFloorPlan,
  createZone,
  updateZone,
  deleteZone,
  ensureShareToken,
  revokeShareToken,
  type ZoneInput,
} from "@/lib/repo/floorplans";

export async function createFloorPlanAction(projectId: string, label: string, imageDataUrl: string): Promise<string> {
  await requireUser();
  if (!imageDataUrl) throw new Error("يجب اختيار صورة المخطط");
  const fp = await createFloorPlan(projectId, label, imageDataUrl);
  revalidatePath(`/projects/${projectId}/plan`);
  return fp.id;
}

export async function renameFloorPlanAction(projectId: string, floorPlanId: string, label: string): Promise<void> {
  await requireUser();
  await renameFloorPlan(floorPlanId, label);
  revalidatePath(`/projects/${projectId}/plan`);
}

export async function deleteFloorPlanAction(projectId: string, floorPlanId: string): Promise<void> {
  await requireUser();
  await deleteFloorPlan(floorPlanId);
  revalidatePath(`/projects/${projectId}/plan`);
}

export async function createZoneAction(projectId: string, floorPlanId: string, input: ZoneInput): Promise<string> {
  await requireUser();
  const z = await createZone(floorPlanId, input);
  revalidatePath(`/projects/${projectId}/plan`);
  return z.id;
}

export async function updateZoneAction(projectId: string, zoneId: string, input: ZoneInput): Promise<void> {
  await requireUser();
  await updateZone(zoneId, input);
  revalidatePath(`/projects/${projectId}/plan`);
}

export async function deleteZoneAction(projectId: string, zoneId: string): Promise<void> {
  await requireUser();
  await deleteZone(zoneId);
  revalidatePath(`/projects/${projectId}/plan`);
}

export async function ensureShareTokenAction(projectId: string): Promise<string> {
  await requireUser();
  return ensureShareToken(projectId);
}

export async function revokeShareTokenAction(projectId: string): Promise<void> {
  await requireUser();
  await revokeShareToken(projectId);
  revalidatePath(`/projects/${projectId}/plan`);
}
