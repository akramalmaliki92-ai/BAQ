"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" };
  }

  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}
