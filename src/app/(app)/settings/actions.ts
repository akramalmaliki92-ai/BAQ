"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { updateCompanySettings, setSealImage } from "@/lib/repo/settings";

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

// رفع أو حذف صورة التوقيع أو الختم — للمدير ومسؤول النظام فقط. الصورة تصل مصغّرة من المتصفح
// بصيغة data URL، ويُتحقق هنا من نوعها وحجمها قبل الحفظ.
const SEAL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const SEAL_MAX = 700_000;

export async function setSealAction(kind: "signature" | "stamp", dataUrl: string | null): Promise<SettingsFormState> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);
    if (kind !== "signature" && kind !== "stamp") return { error: "نوع غير معروف" };
    if (dataUrl !== null) {
      if (!SEAL_RE.test(dataUrl)) return { error: "الصورة يجب أن تكون بصيغة PNG أو JPG أو WEBP" };
      if (dataUrl.length > SEAL_MAX) return { error: "حجم الصورة كبير؛ استعمل صورة أصغر" };
    }
    await setSealImage(kind, dataUrl);
    revalidatePath("/settings");
    return { ok: true };
  } catch {
    return { error: "تعذّر الحفظ؛ تأكد من صلاحيتك وأعد المحاولة" };
  }
}
