import { redirect } from "next/navigation";

// زيارة الرابط الرئيسي مباشرة تُحوَّل تلقائياً: لوحة التحكم إن كان المستخدم مسجّلاً دخوله،
// أو صفحة تسجيل الدخول إن لم يكن (التحويل يحدث فعلياً داخل التخطيط (app)/layout.tsx عبر
// requirePageUser، لذلك يكفي هنا تمرير الزائر إلى /dashboard دائماً).
export default function RootPage() {
  redirect("/dashboard");
}
