// محرك التسعير الداخلي — طريقة الربح على الكلفة (Markup)، مطابق تماماً للصيغ المعتمدة:
//   سعر بيع الوحدة = كلفة الوحدة × (1 + نسبة الربح)
//   إجمالي الكلفة  = الكمية × كلفة الوحدة
//   إجمالي البيع   = الكمية × سعر بيع الوحدة
//   إجمالي الربح   = إجمالي البيع - إجمالي الكلفة
// هذا الملف لا يعرف شيئاً عن قاعدة البيانات أو الواجهة، فهو قابل للاختبار بمعزل تام.

export interface PricingItem {
  id: string;
  qty: number;
  unitCost: number;
  marginPct: number;
  manualUnitPrice?: number | null; // إن وُجد، يتجاوز الحساب التلقائي (لمستخدم مخوّل فقط)
  hiddenFromClient?: boolean;
}

export interface ItemComputed {
  id: string;
  unitPrice: number;
  costTotal: number;
  saleTotal: number;
  profitTotal: number;
}

export function computeUnitPrice(unitCost: number, marginPct: number, manualUnitPrice?: number | null): number {
  if (manualUnitPrice != null && !Number.isNaN(manualUnitPrice)) return manualUnitPrice;
  return round2(unitCost * (1 + marginPct / 100));
}

export function computeItem(item: PricingItem): ItemComputed {
  const unitPrice = computeUnitPrice(item.unitCost, item.marginPct, item.manualUnitPrice);
  const costTotal = round2(item.qty * item.unitCost);
  const saleTotal = round2(item.qty * unitPrice);
  const profitTotal = round2(saleTotal - costTotal);
  return { id: item.id, unitPrice, costTotal, saleTotal, profitTotal };
}

export interface DiscountConfig {
  type: "PERCENT" | "FIXED";
  value: number;
}

export interface QuoteTotals {
  sumCost: number;
  sumSaleBeforeDiscount: number;
  discountAmount: number;
  sumSaleAfterDiscount: number;
  taxAmount: number;
  finalTotal: number;
  profitAfterDiscount: number;
  effectiveMarginPct: number; // نسبة الربح الفعلية بعد الخصم، من الكلفة
  belowMinMargin: boolean;
}

export function computeQuoteTotals(
  items: PricingItem[],
  discount: DiscountConfig,
  taxEnabled: boolean,
  taxPct: number,
  minMarginPct: number
): QuoteTotals {
  let sumCost = 0;
  let sumSaleBeforeDiscount = 0;
  for (const it of items) {
    const c = computeItem(it);
    sumCost += c.costTotal;
    sumSaleBeforeDiscount += c.saleTotal;
  }
  sumCost = round2(sumCost);
  sumSaleBeforeDiscount = round2(sumSaleBeforeDiscount);

  const discountAmount = round2(
    discount.type === "PERCENT" ? (sumSaleBeforeDiscount * discount.value) / 100 : discount.value
  );
  const sumSaleAfterDiscount = round2(Math.max(0, sumSaleBeforeDiscount - discountAmount));
  const taxAmount = round2(taxEnabled ? (sumSaleAfterDiscount * taxPct) / 100 : 0);
  const finalTotal = round2(sumSaleAfterDiscount + taxAmount);
  const profitAfterDiscount = round2(sumSaleAfterDiscount - sumCost);
  const effectiveMarginPct = sumCost > 0 ? round2((profitAfterDiscount / sumCost) * 100) : 0;

  return {
    sumCost,
    sumSaleBeforeDiscount,
    discountAmount,
    sumSaleAfterDiscount,
    taxAmount,
    finalTotal,
    profitAfterDiscount,
    effectiveMarginPct,
    belowMinMargin: effectiveMarginPct < minMarginPct,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
