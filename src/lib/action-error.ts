// شكل رسالة الخطأ التي تُعيدها إجراءات الخادم (Server Actions) بدل رمي الخطأ.
// السبب: في نسخة الإنتاج يحجب Next.js نص أي خطأ يُرمى من إجراء خادم ويستبدله برسالة إنجليزية
// عامة (Minified React error #441)، فلا يرى المستخدم سبب الرفض. لذلك تُعاد الرسالة كقيمة عادية،
// ويحوّلها غلاف جهة المتصفح إلى خطأ عادي يحمل النص العربي كما هو.
// هذا الملف بلا "use server" ولا "use client" ليُستعمل في الجهتين.

export const ACTION_ERROR_KEY = "__baqActionError";

export type ActionError = { __baqActionError: string };

export function isActionError(value: unknown): value is ActionError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>)[ACTION_ERROR_KEY] === "string"
  );
}
