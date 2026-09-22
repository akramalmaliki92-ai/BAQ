export type Role = "ADMIN" | "MANAGER" | "PREPARER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

// من يحق له رؤية الكلفة وهامش الربح
export function canSeeCost(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "PREPARER";
  // ملاحظة: معدّ التندر يرى الكلفة لأنه من يُدخلها، لكن قد يُمنع لاحقاً عبر صلاحية دقيقة إضافية
  // إن رغبت الإدارة بذلك (راجع can(...) أدناه لصلاحية أدق على مستوى الحقل).
}

export function canApprove(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canEditMarginOrDiscount(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageLibraryAndSettings(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "ADMIN": return "مسؤول النظام";
    case "MANAGER": return "مدير";
    case "PREPARER": return "معدّ تندر";
  }
}
