import { requirePageRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/repo/settings";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  await requirePageRole(["ADMIN"]);
  const company = await getCompanySettings();

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <h1 className="text-xl font-extrabold">إعدادات الشركة</h1>
      <SettingsForm company={company} />
    </div>
  );
}
