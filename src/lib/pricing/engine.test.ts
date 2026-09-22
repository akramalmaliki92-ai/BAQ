// اختبار تحقق سريع لمحرك التسعير (يُشغَّل يدوياً عبر: npx tsx src/lib/pricing/engine.test.ts)
import { computeItem, computeQuoteTotals } from "./engine";

function assertEqual(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 0.001) {
    console.error(`✗ FAIL: ${label} — expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${label}`);
  }
}

// فقرة: كمية 10، كلفة الوحدة 1000، هامش ربح 20%
const item1 = computeItem({ id: "a", qty: 10, unitCost: 1000, marginPct: 20 });
assertEqual(item1.unitPrice, 1200, "سعر بيع الوحدة = 1000×1.2 = 1200");
assertEqual(item1.costTotal, 10000, "إجمالي الكلفة = 10×1000 = 10000");
assertEqual(item1.saleTotal, 12000, "إجمالي البيع = 10×1200 = 12000");
assertEqual(item1.profitTotal, 2000, "إجمالي الربح = 12000-10000 = 2000");

// فقرة ثانية: كمية 5، كلفة 500، هامش 30%
const item2 = computeItem({ id: "b", qty: 5, unitCost: 500, marginPct: 30 });
assertEqual(item2.unitPrice, 650, "سعر بيع الوحدة الثانية = 500×1.3 = 650");
assertEqual(item2.saleTotal, 3250, "إجمالي بيع الفقرة الثانية = 5×650 = 3250");

// إجمالي التندر بلا خصم ولا ضريبة
const totalsNoDiscount = computeQuoteTotals(
  [
    { id: "a", qty: 10, unitCost: 1000, marginPct: 20 },
    { id: "b", qty: 5, unitCost: 500, marginPct: 30 },
  ],
  { type: "PERCENT", value: 0 },
  false,
  0,
  10
);
assertEqual(totalsNoDiscount.sumCost, 12500, "إجمالي الكلفة الكلي = 10000+2500 = 12500");
assertEqual(totalsNoDiscount.sumSaleBeforeDiscount, 15250, "إجمالي البيع قبل الخصم = 12000+3250 = 15250");
assertEqual(totalsNoDiscount.profitAfterDiscount, 2750, "الربح = 15250-12500 = 2750");
assertEqual(totalsNoDiscount.effectiveMarginPct, 22, "نسبة الربح الفعلية = 2750/12500 = 22%");
if (totalsNoDiscount.belowMinMargin) {
  console.error("✗ FAIL: لا يجب أن يكون أقل من الحد الأدنى (22% > 10%)");
  process.exitCode = 1;
} else {
  console.log("✓ فوق الحد الأدنى للربح كما هو متوقع");
}

// نفس التندر مع خصم 15% — يجب أن يُعاد حساب الربح تلقائياً وينخفض تحت 10%
const totalsWithDiscount = computeQuoteTotals(
  [
    { id: "a", qty: 10, unitCost: 1000, marginPct: 20 },
    { id: "b", qty: 5, unitCost: 500, marginPct: 30 },
  ],
  { type: "PERCENT", value: 15 },
  false,
  0,
  10
);
assertEqual(totalsWithDiscount.discountAmount, 2287.5, "قيمة الخصم = 15250×15% = 2287.5");
assertEqual(totalsWithDiscount.sumSaleAfterDiscount, 12962.5, "البيع بعد الخصم = 15250-2287.5");
assertEqual(totalsWithDiscount.profitAfterDiscount, 462.5, "الربح بعد الخصم = 12962.5-12500");
assertEqual(totalsWithDiscount.effectiveMarginPct, 3.7, "نسبة الربح الفعلية بعد الخصم ~3.7%");
if (!totalsWithDiscount.belowMinMargin) {
  console.error("✗ FAIL: يجب أن يظهر تحذير انخفاض الربح عن الحد الأدنى بعد هذا الخصم");
  process.exitCode = 1;
} else {
  console.log("✓ تحذير انخفاض الربح عن الحد الأدنى يعمل بشكل صحيح");
}

// السعر اليدوي يتجاوز الحساب التلقائي
const manual = computeItem({ id: "c", qty: 2, unitCost: 100, marginPct: 20, manualUnitPrice: 500 });
assertEqual(manual.unitPrice, 500, "السعر اليدوي يتجاوز الحساب التلقائي");
assertEqual(manual.saleTotal, 1000, "الإجمالي يعتمد السعر اليدوي");

if (process.exitCode === 1) {
  console.log("\n=== توجد اختبارات فاشلة ===");
} else {
  console.log("\n=== كل اختبارات محرك التسعير ناجحة ===");
}
