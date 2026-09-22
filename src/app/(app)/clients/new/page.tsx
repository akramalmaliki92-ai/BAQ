import { requirePageUser } from "@/lib/auth/guard";
import ClientForm from "../client-form";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  await requirePageUser();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">عميل جديد</h1>
      <ClientForm action={createClientAction} submitLabel="حفظ العميل" />
    </div>
  );
}
