"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { createLibraryItem, updateLibraryItem, setLibraryItemActive, type LibraryItemInput } from "@/lib/repo/library";

export interface LibraryFormState {
  error?: string;
  ok?: boolean;
}

function readInput(formData: FormData): LibraryItemInput {
  return {
    code: String(formData.get("code") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    main_category: String(formData.get("main_category") || "").trim(),
    sub_category: String(formData.get("sub_category") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    unit: String(formData.get("unit") || "عدد"),
    default_unit_cost: Number(formData.get("default_unit_cost") || 0),
    default_margin_pct: Number(formData.get("default_margin_pct") || 20),
    internal_notes: String(formData.get("internal_notes") || "").trim(),
  };
}

export async function createLibraryItemAction(_prev: LibraryFormState, formData: FormData): Promise<LibraryFormState> {
  await requireRole(["ADMIN"]);
  const input = readInput(formData);
  if (!input.name) return { error: "اسم الفقرة مطلوب" };
  await createLibraryItem(input);
  revalidatePath("/library");
  return { ok: true };
}

export async function updateLibraryItemAction(id: string, _prev: LibraryFormState, formData: FormData): Promise<LibraryFormState> {
  await requireRole(["ADMIN"]);
  const input = readInput(formData);
  if (!input.name) return { error: "اسم الفقرة مطلوب" };
  await updateLibraryItem(id, input);
  revalidatePath("/library");
  return { ok: true };
}

export async function toggleLibraryItemAction(id: string, active: boolean): Promise<void> {
  await requireRole(["ADMIN"]);
  await setLibraryItemActive(id, active);
  revalidatePath("/library");
}
