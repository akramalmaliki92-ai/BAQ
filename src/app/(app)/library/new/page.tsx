import { requirePageRole } from "@/lib/auth/guard";
import LibraryItemForm from "../item-form";
import { createLibraryItemAction } from "../actions";

export default async function NewLibraryItemPage() {
  await requirePageRole(["ADMIN", "MANAGER"]);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">فقرة جديدة في المكتبة</h1>
      <LibraryItemForm action={createLibraryItemAction} submitLabel="حفظ الفقرة" />
    </div>
  );
}
