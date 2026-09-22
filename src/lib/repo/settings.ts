import { db, nowIso } from "@/lib/db/client";

export interface CompanySettings {
  id: number;
  name_ar: string;
  name_en: string;
  logo_data_url: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_number: string;
  bank_info: string;
  default_currency: string;
  default_margin_pct: number;
  min_margin_pct: number;
  default_validity_days: number;
  default_payment_terms: string;
  general_terms: string;
  intro_text: string;
  outro_text: string;
  quote_prefix: string;
  accent_color: string;
  accent_light: string;
  updated_at: string;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  return (await db.prepare("SELECT * FROM company WHERE id = 1").get()) as unknown as CompanySettings;
}

export async function updateCompanySettings(input: Partial<Omit<CompanySettings, "id" | "updated_at">>): Promise<void> {
  const current = await getCompanySettings();
  const merged = { ...current, ...input };
  // ملاحظة: default_currency لا يُعدَّل من هذه الدالة عمداً لتفادي تعقيد إعادة تسعير القوائم القديمة تلقائياً
  await db.prepare(
    `UPDATE company SET
      name_ar=?, name_en=?, logo_data_url=?, address=?, phone=?, email=?, website=?, tax_number=?, bank_info=?,
      default_margin_pct=?, min_margin_pct=?, default_validity_days=?, default_payment_terms=?,
      general_terms=?, intro_text=?, outro_text=?, quote_prefix=?, accent_color=?, accent_light=?, updated_at=?
     WHERE id = 1`
  ).run(
    merged.name_ar,
    merged.name_en,
    merged.logo_data_url,
    merged.address,
    merged.phone,
    merged.email,
    merged.website,
    merged.tax_number,
    merged.bank_info,
    Number(merged.default_margin_pct) || 0,
    Number(merged.min_margin_pct) || 0,
    Number(merged.default_validity_days) || 14,
    merged.default_payment_terms,
    merged.general_terms,
    merged.intro_text,
    merged.outro_text,
    merged.quote_prefix,
    merged.accent_color,
    merged.accent_light,
    nowIso()
  );
}
