// مراحل منهجية بيت القصيد لكل مشروع (المصدر: مهارة «منهجية مشاريع البنايات»).
export const STAGES: { no: number; title: string; hint: string }[] = [
  { no: 1, title: "المخطط", hint: "اختيار المخطط من المكتبة أو رسمه من صور المخطط" },
  { no: 2, title: "التعديلات المعمارية", hint: "طابقاً طابقاً حسب طلب الزبون" },
  { no: 3, title: "المواقف", hint: "محاكاة دخول السيارات وخروجها (إن وُجدت)" },
  { no: 4, title: "الإنشائي الأولي", hint: "أبعاد محافظة للأعمدة والجسور والأساس" },
  { no: 5, title: "الخدمات", hint: "الماء والمجاري والتبريد والكهرباء" },
  { no: 6, title: "الواجهة", hint: "التصميم والتظليل والصور" },
  { no: 7, title: "ملف المشروع", hint: "PDF موحّد للزبون" },
  { no: 8, title: "جدول الكميات", hint: "يُنزَّل عرضَ سعر في المسعّر" },
  { no: 9, title: "التسعير والعرض", hint: "الكلفة والهامش وعرض السعر والدفعات" },
];

export type StageState = Record<string, { done: boolean; at?: string }>;

export function parseStages(json: string | null | undefined): StageState {
  try {
    const o = JSON.parse(json || "{}");
    return o && typeof o === "object" ? (o as StageState) : {};
  } catch {
    return {};
  }
}
