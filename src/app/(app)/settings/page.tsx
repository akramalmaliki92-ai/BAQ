import { requirePageRole } from "@/lib/auth/guard";
import { getCompanySettings, withoutSealImages } from "@/lib/repo/settings";
import SettingsForm from "./settings-form";
import SealForm from "./seal-form";

// الصفحة مفتوحة للمدير ومسؤول النظام: بطاقة التوقيع والختم للاثنين، أما إعدادات الشركة العامة
// فتبقى لمسؤول النظام فقط كما كانت.
export default async function SettingsPage() {
  const user = await requirePageRole(["ADMIN", "MANAGER"]);
  const company = withoutSealImages(await getCompanySettings());

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <h1 className="text-xl font-extrabold">إعدادات الشركة</h1>
      <SealForm hasSignature={company.has_signature} hasStamp={company.has_stamp} />
      {user.role === "ADMIN" && <SettingsForm company={company} />}
    </div>
  );
}
