// أسئلة استبيان التصميم المعماري المعتمدة (20 سؤالاً في 6 خطوات + خطوة الصور).
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
      { key: "neighbors", no: 4, title: "البناء المجاور", kind: "choice", cols: 3, choices: [
        { v: "both", label: "ملاصق للجانبين" }, { v: "one", label: "جانب واحد" }, { v: "none", label: "منفصل" } ] },
    ],
  },
  {
    title: "البيت",
    questions: [
      { key: "floors", no: 5, title: "عدد الطوابق", kind: "choice", cols: 1, choices: [
        { v: "g", label: "أرضي فقط" }, { v: "g1", label: "أرضي وأول" }, { v: "g1_future", label: "أرضي وأول، مع إضافة طابق مستقبلاً" } ] },
      { key: "bedrooms", no: 6, title: "عدد غرف النوم الكلي", kind: "choice", cols: 4, choices: [
        { v: "2", label: "2" }, { v: "3", label: "3" }, { v: "4", label: "4" }, { v: "5+", label: "+5" } ] },
      { key: "ground_bedroom", no: 7, title: "غرفة نوم في الأرضي", sub: "لكبير سن", kind: "choice", cols: 2, choices: [
        { v: "yes", label: "نعم" }, { v: "no", label: "لا" } ] },
      { key: "split_first", no: 8, title: "فصل الطابق الأول كشقة مستقلة لاحقاً", kind: "choice", cols: 3, choices: [
        { v: "yes", label: "نعم" }, { v: "no", label: "لا" }, { v: "maybe", label: "ربما" } ] },
    ],
  },
  {
    title: "الطابق الأرضي",
    questions: [
      { key: "reception", no: 9, title: "الاستقبال", kind: "choice", cols: 2, choices: [
        { v: "one", label: "واحد" }, { v: "two", label: "رجال ونساء منفصلان" } ] },
      { key: "guest_wc", no: 10, title: "حمام الضيوف", kind: "choice", cols: 2, choices: [
        { v: "attached", label: "ملحق بالاستقبال" }, { v: "garden", label: "منعزل في الحديقة" } ] },
      { key: "kitchen_side", no: 11, title: "موقع المطبخ", sub: "بالنظر من الشارع", kind: "choice", cols: 3, choices: [
        { v: "right", label: "يمين", icon: "kitchen-right" }, { v: "left", label: "يسار", icon: "kitchen-left" }, { v: "any", label: "لا يهم" } ] },
      { key: "kitchen_type", no: 12, title: "نوع المطبخ", kind: "choice", cols: 3, choices: [
        { v: "closed", label: "مغلق" }, { v: "open", label: "مفتوح على الصالة" }, { v: "main_prep", label: "رئيسي + تحضيري" } ] },
      { key: "garage", no: 13, title: "الكراج", kind: "choice", cols: 3, choices: [
        { v: "1", label: "سيارة" }, { v: "2", label: "سيارتان" }, { v: "0", label: "بدون" } ] },
      { key: "garden", no: 14, title: "الحديقة", kind: "choice", cols: 4, choices: [
        { v: "front", label: "أمامية" }, { v: "back", label: "خلفية" }, { v: "both", label: "الاثنتان" }, { v: "none", label: "بدون" } ] },
    ],
  },
  {
    title: "الطابق الأول",
    questions: [
      { key: "master", no: 15, title: "الغرفة الرئيسية", kind: "choice", cols: 1, choices: [
        { v: "full", label: "بحمام وغرفة ملابس" }, { v: "bath", label: "بحمام فقط" }, { v: "plain", label: "غرفة عادية" } ] },
      { key: "family_hall", no: 16, title: "صالة عائلية علوية", kind: "choice", cols: 2, choices: [
        { v: "yes", label: "نعم" }, { v: "no", label: "لا" } ] },
    ],
  },
  {
    title: "الواجهة",
    note: "المواد والألوان نختارها معك في مرحلة الواجهة.",
    questions: [
      { key: "style", no: 17, title: "طراز الواجهة", kind: "choice", cols: 2, choices: [
        { v: "modern", label: "حديث", icon: "style-modern" }, { v: "classic", label: "كلاسيك", icon: "style-classic" },
        { v: "neoclassic", label: "نيوكلاسيك", icon: "style-neo" }, { v: "heritage", label: "تراثي", icon: "style-heritage" } ] },
      { key: "privacy", no: 18, title: "مستوى الخصوصية", kind: "choice", cols: 3, choices: [
        { v: "open", label: "مفتوحة" }, { v: "medium", label: "متوسطة" }, { v: "high", label: "عالية" } ] },
    ],
  },
  {
    title: "التنفيذ",
    questions: [
      { key: "tier", no: 19, title: "مستوى التنفيذ", kind: "choice", cols: 1, choices: [
        { v: "eco", label: "اقتصادي", hint: "مواد جيدة بكلفة مدروسة" },
        { v: "mid", label: "متوسط", hint: "توازن بين الجودة والكلفة" },
        { v: "lux", label: "فاخر", hint: "أعلى المواصفات والتشطيبات" } ] },
      { key: "start", no: 20, title: "موعد البدء", kind: "choice", cols: 3, choices: [
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
    `القطعة: ${num(a.plot_w)} × ${num(a.plot_d)} م، ${L("plot_type")}، الواجهة: ${L("facing")}، الجيران: ${L("neighbors")}`,
    `${L("floors")} — ${L("bedrooms")} غرف نوم${a.ground_bedroom === "yes" ? "، منها غرفة في الأرضي" : ""}${a.split_first === "yes" ? "، مع فصل الأول كشقة" : a.split_first === "maybe" ? "، فصل الأول كشقة: ربما" : ""}`,
    `الاستقبال: ${L("reception")}، حمام الضيوف: ${L("guest_wc")}`,
    `المطبخ: ${L("kitchen_side")}، ${L("kitchen_type")} — الكراج: ${L("garage")}، الحديقة: ${L("garden")}`,
    `الغرفة الرئيسية: ${L("master")}، صالة علوية: ${L("family_hall")}`,
    `الواجهة: ${L("style")}، الخصوصية: ${L("privacy")}`,
    `التنفيذ: ${L("tier")} — البدء: ${L("start")}`,
  ];
}

export const GOVERNORATES = [
  "البصرة", "بغداد", "ميسان", "ذي قار", "المثنى", "القادسية", "واسط", "بابل", "كربلاء", "النجف",
  "ديالى", "الأنبار", "صلاح الدين", "كركوك", "نينوى", "أربيل", "السليمانية", "دهوك", "حلبجة",
];

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
