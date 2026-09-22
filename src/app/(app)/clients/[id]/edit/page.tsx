import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getClient } from "@/lib/repo/clients";
import ClientForm from "../../client-form";
import { updateClientAction } from "../../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const boundAction = updateClientAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold">تعديل بيانات العميل</h1>
      <ClientForm
        action={boundAction}
        defaultValues={{
          name: client.name,
          contact_person: client.contact_person,
          phone: client.phone,
          email: client.email,
          address: client.address,
          tax_number: client.tax_number,
          notes: client.notes,
        }}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
