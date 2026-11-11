import { unstable_rethrow } from "next/navigation";
import { ApiError } from "./guard";
import type { ActionError } from "@/lib/action-error";

const UNEXPECTED_ERROR = "حدث خطأ غير متوقع في الخادم، أعد المحاولة. إن تكرر الخطأ فأبلغ مسؤول النظام.";

// رسائل الأخطاء المقصودة للمستخدم في المشروع مكتوبة بالعربية؛ أما أخطاء قاعدة البيانات والمكتبات
// فإنجليزية وقد تكشف تفاصيل داخلية، فلا تُعرض كما هي.
function isUserFacingMessage(message: string): boolean {
  return /[؀-ۿ]/.test(message);
}

// يغلّف جسم إجراء الخادم: الأخطاء المتوقعة (ApiError أو خطأ برسالة عربية) تُعاد كقيمة تحمل نصها،
// وأي خطأ آخر يُسجَّل في سجل الخادم ويُعاد برسالة عامة بالعربية.
// أخطاء Next.js الداخلية (مثل redirect و notFound) تُعاد رميها كما هي لتعمل بشكل طبيعي.
export async function guarded<T>(fn: () => Promise<T>): Promise<T | ActionError> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ApiError) return { __baqActionError: e.message };
    if (e instanceof Error && isUserFacingMessage(e.message)) return { __baqActionError: e.message };
    console.error(e);
    return { __baqActionError: UNEXPECTED_ERROR };
  }
}
