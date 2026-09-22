// تحويل الأرقام إلى كتابة عربية (تفقيط) — لعرض "المبلغ النهائي كتابة" في عرض السعر.
// ملاحظة: هذا تنفيذ عملي مبسّط مناسب للمستندات التجارية (يغطي القواعد الأساسية لعدد/معدود
// وصيغ المفرد والمثنى والجمع للألف والمليون والمليار)، وليس محلّلاً نحوياً كاملاً لكل حالات
// الإعراب الدقيقة (كحذف التنوين في حالات الإضافة). يكفي تماماً لعرض مبلغ نهائي بوضوح.

const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS = [
  "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر",
  "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر",
];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = [
  "", "مئة", "مئتان", "ثلاثمئة", "أربعمئة",
  "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة",
];

type Scale = [string, string, string]; // مفرد، مثنى، جمع

const SCALES: Scale[] = [
  ["", "", ""],
  ["ألف", "ألفان", "آلاف"],
  ["مليون", "مليونان", "ملايين"],
  ["مليار", "ملياران", "مليارات"],
];

function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]);
  if (r > 0) {
    if (r < 10) parts.push(ONES[r]);
    else if (r < 20) parts.push(TEENS[r - 10]);
    else {
      const t = Math.floor(r / 10);
      const o = r % 10;
      parts.push(o > 0 ? `${ONES[o]} و${TENS[t]}` : TENS[t]);
    }
  }
  return parts.join(" و");
}

function groupWithScale(groupValue: number, scale: Scale): string {
  if (groupValue === 0) return "";
  if (groupValue === 1) return scale[0];
  if (groupValue === 2) return scale[1];
  const words = threeDigitsToWords(groupValue);
  const form = groupValue >= 3 && groupValue <= 10 ? scale[2] : scale[0];
  return `${words} ${form}`;
}

/** يحوّل عدداً صحيحاً غير سالب (حتى تريليون تقريباً) إلى كتابة عربية */
export function integerToArabicWords(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "صفر";

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  // groups[0] هو أعلى مرتبة (مليار)، وهكذا حتى آخر مجموعة (آحاد)
  const scaleStartIndex = groups.length - 1; // فهرس مجموعة الآحاد في SCALES = 0

  const parts: string[] = [];
  groups.forEach((g, idx) => {
    if (g === 0) return;
    const scaleIndex = scaleStartIndex - idx; // 0=آحاد, 1=ألف, 2=مليون, 3=مليار
    if (scaleIndex === 0) {
      parts.push(threeDigitsToWords(g));
    } else {
      parts.push(groupWithScale(g, SCALES[scaleIndex]));
    }
  });

  return parts.join(" و");
}

/** يكتب مبلغاً مالياً كاملاً مع اسم العملة، مع دعم كسر العملة (فلس) عند الحاجة */
export function amountToArabicWords(
  amount: number,
  currencyMajor = "دينار عراقي",
  currencyMinor?: string
): string {
  const major = Math.floor(Math.abs(amount));
  const minor = Math.round((Math.abs(amount) - major) * 1000); // الدينار العراقي = 1000 فلس

  let text = `${integerToArabicWords(major)} ${currencyMajor}`;
  if (currencyMinor && minor > 0) {
    text += ` و${integerToArabicWords(minor)} ${currencyMinor}`;
  }
  return `${text} فقط لا غير`;
}
