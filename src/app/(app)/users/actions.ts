"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { createUser, setUserActive, updateUserRole, resetUserPassword } from "@/lib/repo/users";
import type { Role } from "@/lib/auth/types";

export interface UserFormState {
  error?: string;
  ok?: boolean;
}

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireRole(["ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "PREPARER") as Role;

  if (!name || !email || password.length < 6) {
    return { error: "الاسم والبريد مطلوبان، وكلمة المرور يجب ألا تقل عن 6 أحرف" };
  }
  try {
    await createUser({ name, email, password, role });
  } catch {
    return { error: "البريد الإلكتروني مستخدم مسبقاً" };
  }
  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActiveAction(id: string, active: boolean): Promise<void> {
  await requireRole(["ADMIN"]);
  await setUserActive(id, active);
  revalidatePath("/users");
}

export async function changeUserRoleAction(id: string, role: Role): Promise<void> {
  await requireRole(["ADMIN"]);
  await updateUserRole(id, role);
  revalidatePath("/users");
}

export async function resetPasswordAction(id: string, newPassword: string): Promise<void> {
  await requireRole(["ADMIN"]);
  if (newPassword.length < 6) throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف");
  await resetUserPassword(id, newPassword);
}
