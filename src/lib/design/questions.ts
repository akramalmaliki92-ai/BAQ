// أسئلة استبيان التصميم المعماري المعتمدة (13 سؤالاً في 4 خطوات + خطوة الصور).
// المصدر الوحيد للأسئلة: تستعملها الفورمة، وصفحة عرض الطلب، ونص تنبيه تيليجرام.

export type Choice = { v: string; label: string; hint?: string; icon?: "kitchen-right" | "kitchen-left" | "style-modern" | "style-classic" | "style-neo" | "style-heritage" };

export type Question =
  | { key: string; no: number; title: string; sub?: string; kind: "choice"; cols: 1 | 2 | 3 | 4; choices: Choice[] }
  | { key: string; no: number; title: string; sub?: string; kind: "dims" };

export interface Step {
  title: string;
  questions: Question[];
  note?: string;
}

export const STEPS: Step[] = [
  {
    title: "القطعة",
    questions: [
      { key: "plot", no: 1, title: "أبعاد القطعة", kind: "dims" },
      { key: "plot_type", no: 2, title: "موقع القطعة", kind: "choice", cols: 2, choices: [
        { v: "one", label: "شارع واحد" }, { v: "corner", label: "ركن (شارعان)" } ] },
      { key: "facing", no: 3, title: "اتجاه الواجهة", kind: "choice", cols: 3, choices: [
        { v: "N", label: "شمال" }, { v: "S", label: "جنوب" }, { v: "E", label: "شرق" }, { v: "W", label: "غرب" }, { v: "unknown", label: "لا أعرف" } ] },
    ],
  },
  {
    title: "البيت",
    questions: [
      { key: "floors", no: 4, title: "عدد الطوابق", kind: "choice", cols: 1, choices: [
        { v: "g", label: "أرضي فقط" },
        { v: "g1", label: "أرضي وأول" },
        { v: "g1_split", label: "أرضي وأول، مع فصل الأول كشقة مستقلة" },
        { v: "g1_future", label: "أرضي وأول، مع إضافة طابق مستقبلاً" } ] },
      { key: "bedrooms", no: 5, title: "عدد غرف النوم الكلي", kind: "choice", cols: 4, choices: [
        { v: "2", label: "2" }, { v: "3", label: "3" }, { v: "4", label: "4" }, { v: "5+", label: "+5" } ] },
      { key: "ground_bedroom", no: 6, title: "غرفة نوم في الطابق الأرضي", kind: "choice", cols: 2, choices: [
        { v: "yes", label: "نعم" }, { v: "no", label: "لا" } ] },
    ],
  },
  {
    title: "الطابق الأرضي",
    questions: [
      { key: "reception_open", no: 7, title: "هل تريد أن يُفتح الاستقبال على الهول الداخلي بباب كبير؟", kind: "choice", cols: 2, choices: [
        { v: "yes", label: "نعم، بباب كبير" }, { v: "no", label: "لا، منفصل" } ] },
      { key: "guest_wc", no: 8, title: "حمام الضيوف", kind: "choice", cols: 2, choices: [
        { v: "attached", label: "ملحق بالاستقبال" }, { v: "garden", label: "منعزل في الحديقة" } ] },
      { key: "kitchen_side", no: 9, title: "موقع المطبخ", sub: "بالنظر من الشارع", kind: "choice", cols: 3, choices: [
        { v: "right", label: "يمين", icon: "kitchen-right" }, { v: "left", label: "يسار", icon: "kitchen-left" }, { v: "any", label: "لا يهم" } ] },
      { key: "kitchen_kind", no: 10, title: "نوع المطبخ", kind: "choice", cols: 1, choices: [
        { v: "split", label: "مطبخ منفصل (حار وبارد)" },
        { v: "single", label: "مطبخ واحد" },
        { v: "open", label: "مطبخ مفتوح على الصالة" } ] },
    ],
  },
  {
    title: "الواجهة والتنفيذ",
    note: "المواد والألوان نختارها معك في مرحلة الواجهة.",
    questions: [
      { key: "style", no: 11, title: "طراز الواجهة", kind: "choice", cols: 2, choices: [
        { v: "modern", label: "حديث", icon: "style-modern" }, { v: "classic", label: "كلاسيك", icon: "style-classic" },
        { v: "neoclassic", label: "نيوكلاسيك", icon: "style-neo" }, { v: "heritage", label: "تراثي", icon: "style-heritage" } ] },
      { key: "tier", no: 12, title: "مستوى التنفيذ", kind: "choice", cols: 1, choices: [
        { v: "eco", label: "اقتصادي", hint: "مواد جيدة بكلفة مدروسة" },
        { v: "mid", label: "متوسط", hint: "توازن بين الجودة والكلفة" },
        { v: "lux", label: "فاخر", hint: "أعلى المواصفات والتشطيبات" } ] },
      { key: "start", no: 13, title: "موعد البدء", kind: "choice", cols: 3, choices: [
        { v: "1m", label: "خلال شهر" }, { v: "3m", label: "خلال 3 أشهر" }, { v: "later", label: "لاحقاً" } ] },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = STEPS.flatMap((s) => s.questions);

export type Answers = Record<string, string>;

export const FILE_KINDS = [
  { kind: "deed", label: "صورة سند القطعة", optional: false },
  { kind: "site", label: "صور الموقع", optional: true },
  { kind: "refs", label: "بيوت أعجبتك", optional: true },
] as const;
export type FileKind = (typeof FILE_KINDS)[number]["kind"];

export interface StoredFile {
  kind: FileKind;
  name: string;
  fileId: string;
  link: string;
  thumb: string; // صورة مصغّرة صغيرة (data URL) للعرض داخل المسعّر
  at: string;
}

export function labelOf(key: string, value: string | undefined): string {
  const q = ALL_QUESTIONS.find((x) => x.key === key);
  if (!q || q.kind !== "choice" || !value) return value || "";
  return q.choices.find((c) => c.v === value)?.label || value;
}

export function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// يعيد أرقام الأسئلة غير المجابة (للتحقق قبل الإرسال)
export function missingQuestions(a: Answers): number[] {
  const out: number[] = [];
  for (const q of ALL_QUESTIONS) {
    if (q.kind === "dims") {
      const w = num(a.plot_w), d = num(a.plot_d);
      if (!(w > 0 && w < 1000 && d > 0 && d < 1000)) out.push(q.no);
    } else if (!a[q.key] || !q.choices.some((c) => c.v === a[q.key])) out.push(q.no);
  }
  return out;
}

// ملخص قصير لكل الأجوبة (للتنبيه وصفحة الطلب)
export function summaryLines(a: Answers): string[] {
  const L = (k: string) => labelOf(k, a[k]);
  return [
    `القطعة: ${num(a.plot_w)} × ${num(a.plot_d)} م، ${L("plot_type")}، الواجهة: ${L("facing")}`,
    `${L("floors")} — ${L("bedrooms")} غرف نوم${a.ground_bedroom === "yes" ? "، منها غرفة في الأرضي" : ""}`,
    `الاستقبال على الهول بباب كبير: ${L("reception_open")}، حمام الضيوف: ${L("guest_wc")}`,
    `المطبخ: ${L("kitchen_side")}، ${L("kitchen_kind")}`,
    `الواجهة: ${L("style")} — التنفيذ: ${L("tier")} — البدء: ${L("start")}`,
  ];
}

// بيت القصيد تعمل في البصرة فقط
export const GOVERNORATES = ["البصرة"];

// يوحّد رقم الهاتف العراقي إلى الصيغة 07XXXXXXXXX، أو يعيد "" إن لم يكن صالحاً
export function normalizePhone(raw: string): string {
  let s = String(raw || "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^\d+]/g, "");
  if (s.startsWith("+964")) s = "0" + s.slice(4);
  else if (s.startsWith("00964")) s = "0" + s.slice(5);
  else if (s.startsWith("964")) s = "0" + s.slice(3);
  else if (s.startsWith("7") && s.length === 10) s = "0" + s;
  return /^07\d{9}$/.test(s) ? s : "";
}

const ANSWER_KEYS = new Set(ALL_QUESTIONS.filter((q) => q.kind === "choice").map((q) => q.key).concat(["plot_w", "plot_d", "notes"]));

// يقبل فقط مفاتيح الأسئلة المعروفة ويقص الطول
export function sanitizeAnswers(raw: Record<string, unknown> | undefined): Answers {
  const out: Answers = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (ANSWER_KEYS.has(k) && v != null) out[k] = String(v).slice(0, k === "notes" ? 1500 : 20);
  }
  return out;
}
