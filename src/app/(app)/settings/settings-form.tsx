"use client";

import { useActionState } from "react";
import { updateSettingsAction, type SettingsFormState } from "./actions";
import type { CompanySettings } from "@/lib/repo/settings";

const initial: SettingsFormState = {};
const cls = "w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm";

export default function SettingsForm({ company }: { company: CompanySettings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-[var(--border)] p-5 grid sm:grid-cols-2 gap-4">
        <F l="اسم الشركة بالعربية"><input name="name_ar" defaultValue={company.name_ar} className={cls} /></F>
        <F l="اسم الشركة بالإنجليزية"><input name="name_en" defaultValue={company.name_en} className={cls} dir="ltr" /></F>
        <F l="العنوان" full><input name="address" defaultValue={company.address} className={cls} /></F>
        <F l="رقم الهاتف"><input name="phone" defaultValue={company.phone} className={cls} dir="ltr" /></F>
        <F l="البريد الإلكتروني"><input name="email" defaultValue={company.email} className={cls} dir="ltr" /></F>
        <F l="الموقع الإلكتروني"><input name="website" defaultValue={company.website} className={cls} dir="ltr" /></F>
        <F l="الرقم الضريبي"><input name="tax_number" defaultValue={company.tax_number} className={cls} /></F>
        <F l="بيانات الحساب البنكي" full><textarea name="bank_info" defaultValue={company.bank_info} rows={2} className={cls} /></F>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] p-5 grid sm:grid-cols-3 gap-4">
        <F l="نسبة الربح الافتراضية %"><input name="default_margin_pct" type="number" step="any" defaultValue={company.default_margin_pct} className={`${cls} tabular`} /></F>
        <F l="الحد الأدنى المسموح للربح %"><input name="min_margin_pct" type="number" step="any" defaultValue={company.min_margin_pct} className={`${cls} tabular`} /></F>
        <F l="مدة صلاحية العرض الافتراضية (يوم)"><input name="default_validity_days" type="number" defaultValue={company.default_validity_days} className={`${cls} tabular`} /></F>
        <F l="بادئة ترقيم عروض الأسعار"><input name="quote_prefix" defaultValue={company.quote_prefix} className={`${cls} tabular`} dir="ltr" /></F>
        <F l="اللون الأساسي الداكن"><input name="accent_color" type="text" defaultValue={company.accent_color} className={`${cls} tabular`} dir="ltr" /></F>
        <F l="اللون الأساسي الفاتح"><input name="accent_light" type="text" defaultValue={company.accent_light} className={`${cls} tabular`} dir="ltr" /></F>
        <F l="طريقة الدفع الافتراضية" full><input name="default_payment_terms" defaultValue={company.default_payment_terms} className={cls} /></F>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] p-5 grid gap-4">
        <F l="نص المقدمة الافتراضي لعروض الأسعار"><textarea name="intro_text" defaultValue={company.intro_text} rows={2} className={cls} /></F>
        <F l="نص الخاتمة الافتراضي"><textarea name="outro_text" defaultValue={company.outro_text} rows={2} className={cls} /></F>
        <F l="الشروط العامة (تُطبع في كل عرض سعر)"><textarea name="general_terms" defaultValue={company.general_terms} rows={4} className={cls} /></F>
      </div>

      {state.ok && <div className="text-sm font-bold text-[#2f7d4f]">✓ تم حفظ الإعدادات</div>}

      <button type="submit" disabled={pending} className="self-start rounded-xl text-white font-bold text-sm px-6 py-3 disabled:opacity-60" style={{ background: "var(--brand-dark)" }}>
        {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}

function F({ l, children, full }: { l: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 lg:col-span-3" : ""}>
      <label className="block text-xs font-bold mb-1.5 text-[var(--foreground-muted)]">{l}</label>
      {children}
    </div>
  );
}
