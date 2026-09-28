// اسم ملف الـPDF المُصدَّر (عرض سعر أو عقد) — يجمع الرقم المميز واسم المشروع معاً بدل الاكتفاء
// بالرقم وحده، لأن الرقم المجرد يصعب تتبعه بين عشرات الملفات المحفوظة على جهاز المستخدم.
export function buildExportFileName(number: string, projectName: string | null | undefined): string {
  const cleanProject = (projectName || "").replace(/[\\/:*?"<>|]/g, "").trim();
  return cleanProject ? `${number} - ${cleanProject}.pdf` : `${number}.pdf`;
}

// ترويسة Content-Disposition تدعم أسماء الملفات العربية عبر كل المتصفحات: filename عادي كبديل
// آمن (بأحرف ASCII فقط)، وfilename*=UTF-8'' للاسم الكامل بالعربية وفق RFC 6266.
export function contentDispositionHeader(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
