import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { Role, SessionUser } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// يُستخدم في بداية كل API route محمي. يرمي خطأ 401/403 حقيقيين من الخادم،
// وليس مجرد إخفاء زر في الواجهة — هذا هو ما يمنع الوصول عبر الروابط المباشرة أيضاً.
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "يجب تسجيل الدخول");
  return session;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    throw new ApiError(403, "لا تملك صلاحية تنفيذ هذا الإجراء");
  }
  return session;
}

// نسخة للاستخدام داخل صفحات/تخطيطات الخادم (Server Components): تُعيد التوجيه لصفحة الدخول
// بدل رمي خطأ HTTP — هذا هو ما يمنع فتح أي صفحة داخلية مباشرة برابط بلا تسجيل دخول فعلي.
export async function requirePageUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePageRole(roles: Role[]): Promise<SessionUser> {
  const session = await requirePageUser();
  if (!roles.includes(session.role)) redirect("/403");
  return session;
}

export function apiErrorResponse(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
}
