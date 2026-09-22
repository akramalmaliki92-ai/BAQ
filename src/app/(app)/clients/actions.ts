"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { createClient, updateClient, findSimilarClients, type ClientInput } from "@/lib/repo/clients";

export interface ClientFormState {
  error?: string;
  warning?: string;
  values?: Record<string, string>;
}

function readInput(formData: FormData): ClientInput {
  return {
    name: String(formData.get("name") || "").trim(),
    contact_person: String(formData.get("contact_person") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    tax_number: String(formData.get("tax_number") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await requireUser();
  const input = readInput(formData);
  const confirmDuplicate = formData.get("confirm_duplicate") === "1";

  if (!input.name) {
    return { error: "اسم العميل مطلوب", values: input as unknown as Record<string, string> };
  }

  if (!confirmDuplicate) {
    const similar = await findSimilarClients(input.name, input.phone);
    if (similar.length > 0) {
      return {
        warning: `يوجد عميل مشابه فعلاً: ${similar.map((s) => s.name).join("، ")}. إن كنت متأكداً أنه عميل مختلف اضغط "متابعة الحفظ رغم التشابه".`,
        values: input as unknown as Record<string, string>,
      };
    }
  }

  const client = await createClient(input, user.id);
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireUser();
  const input = readInput(formData);
  if (!input.name) {
    return { error: "اسم العميل مطلوب", values: input as unknown as Record<string, string> };
  }
  await updateClient(id, input);
  redirect(`/clients/${id}`);
}
