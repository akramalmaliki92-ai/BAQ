"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { updateCompanySettings } from "@/lib/repo/settings";

export interface SettingsFormState {
  error?: string;
  ok?: boolean;
}

export async function updateSettingsAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireRole(["ADMIN"]);
  await updateCompanySettings({
    name_ar: String(formData.get("name_ar") || ""),
    name_en: String(formData.get("name_en") || ""),
    address: String(formData.get("address") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    website: String(formData.get("website") || ""),
    tax_number: String(formData.get("tax_number") || ""),
    bank_info: String(formData.get("bank_info") || ""),
    default_margin_pct: Number(formData.get("default_margin_pct") || 20),
    min_margin_pct: Number(formData.get("min_margin_pct") || 10),
    default_validity_days: Number(formData.get("default_validity_days") || 14),
    default_payment_terms: String(formData.get("default_payment_terms") || ""),
    general_terms: String(formData.get("general_terms") || ""),
    intro_text: String(formData.get("intro_text") || ""),
    outro_text: String(formData.get("outro_text") || ""),
    quote_prefix: String(formData.get("quote_prefix") || "BQ-QTN"),
    accent_color: String(formData.get("accent_color") || "#74816F"),
    accent_light: String(formData.get("accent_light") || "#F6E8D2"),
  });
  revalidatePath("/settings");
  return { ok: true };
}
