import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/guard";
import { getLibraryItem } from "@/lib/repo/library";
import LibraryItemForm from "../../item-form";
import { updateLibraryItemAction } from "../../actions";

export default async function EditLibraryItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const item = await getLibraryItem(id);
  if (!item) notFound();

  const boundAction = updateLibraryItemAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">تعديل الفقرة</h1>
      <LibraryItemForm
        action={boundAction}
        submitLabel="حفظ التعديلات"
        defaultValues={{
          name: item.name,
          code: item.code || "",
          unit: item.unit,
          main_category: item.main_category,
          sub_category: item.sub_category,
          description: item.description,
          default_unit_cost: String(item.default_unit_cost),
          default_margin_pct: String(item.default_margin_pct),
          internal_notes: item.internal_notes,
        }}
      />
    </div>
  );
}
