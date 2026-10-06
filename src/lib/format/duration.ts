// تنسيق "مدة التنفيذ" الموحّدة: الحقل الوحيد لمدة التنفيذ في كامل النظام هو عدد الأيام
// (execution_duration_days) — هو ما يظهر في عرض السعر والعقد، وهو نفسه ما يُحسب عليه
// جدول التنفيذ الزمني الداخلي تلقائياً. لا يوجد حقل نصي منفصل يحتاج مزامنة يدوية.
export function formatExecutionDuration(days: number): string {
  const d = Math.max(0, Math.round(Number(days) || 0));
  return `${d} يوماً`;
}
