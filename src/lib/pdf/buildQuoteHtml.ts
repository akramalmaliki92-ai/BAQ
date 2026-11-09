// توليد HTML مخصص لعرض السعر النهائي (PDF) — منفصل عن واجهة المحرر عمداً، لأن طباعة PDF
// تحتاج تحكماً دقيقاً بتكرار رأس الجدول بين الصفحات، ومنع تقسيم السطر الواحد، وهوامش الطباعة —
// وهذا أسهل وأضمن بقالب HTML/CSS مخصص للطباعة بدل إعادة استخدام واجهة React التفاعلية.
import { computeItem, computeQuoteTotals, applyOverheadToItems, sumOverheadCosts, type PricingItem } from "@/lib/pricing/engine";
import { amountToArabicWords } from "@/lib/pricing/numberToArabicWords";
import type { QuoteRow, SectionWithItems, PaymentRow, OverheadCostRow } from "@/lib/repo/quotes";
import type { CompanySettings } from "@/lib/repo/settings";
import { LOGO_DATA_URI } from "./logoBase64";
import { sealHtml, SEAL_CSS, type SealImages } from "./seal";
import { formatExecutionDuration } from "@/lib/format/duration";

function esc(s: string | null | undefined): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmt(n: number) {
  return Math.round(n || 0).toLocaleString("en-US");
}

export function buildQuoteHtml(
  quote: QuoteRow,
  sections: SectionWithItems[],
  payments: PaymentRow[],
  company: CompanySettings,
  overheadCosts: OverheadCostRow[] = [],
  seal?: SealImages
): string {
  const rawFlatItems = sections.flatMap((s) => s.items).map((it) => ({
    id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price,
  }));
  // عند تفعيل خيار توزيع المصاريف تُضاف حصة كل فقرة من مصاريف المشروع إلى كلفتها فعلياً، فترتفع
  // كلفتها وسعر بيعها — وبالتالي السعر النهائي في هذا الـPDF — تماماً كما في واجهة المحرر.
  const overheadTotal = quote.distribute_overhead ? sumOverheadCosts(overheadCosts) : 0;
  const flatItems = overheadTotal > 0 ? applyOverheadToItems(rawFlatItems, overheadTotal) : rawFlatItems;
  const itemsById: Record<string, PricingItem> = {};
  for (const it of flatItems) itemsById[it.id] = it;

  const totals = computeQuoteTotals(
    flatItems,
    { type: quote.discount_type, value: quote.discount_value },
    !!quote.tax_enabled,
    quote.tax_pct,
    quote.min_margin_pct ?? company.min_margin_pct
  );

  const isDraft = quote.status !== "APPROVED";
  const currencyLabel = quote.currency === "IQD" ? "د.ع" : quote.currency;

  const sectionsHtml = sections
    .map((s, si) => {
      const visible = s.items.filter((it) => !it.hidden_from_client);
      if (visible.length === 0) return "";
      const st = computeQuoteTotals(
        visible.map((it) => itemsById[it.id] ?? { id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price }),
        { type: "PERCENT", value: 0 }, false, 0, 0
      );
      const rows = visible
        .map((it, ii) => {
          const c = computeItem(itemsById[it.id] ?? { id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price });
          return `<tr>
            <td class="num">${ii + 1}</td>
            <td class="name-cell">${esc((it.name || "").trim())}${it.client_note ? `<div class="note">${esc(it.client_note)}</div>` : ""}</td>
            <td class="detail-cell">${esc((it.description || "").trim())}</td>
            <td class="num">${esc(it.unit)}</td>
            <td class="num">${fmt(it.qty)}</td>
            ${quote.hide_unit_price ? "" : `<td class="num">${fmt(c.unitPrice)}</td>`}
            <td class="num total">${fmt(c.saleTotal)}</td>
          </tr>`;
        })
        .join("");
      return `
        <div class="section-block">
          <div class="section-title">${si + 1}. ${esc(s.name || "قسم")}</div>
          <table class="items">
            <colgroup>
              <col style="width:5%" />
              <col style="width:${quote.hide_unit_price ? 20 : 16}%" />
              <col />
              <col style="width:8%" />
              <col style="width:8%" />
              ${quote.hide_unit_price ? "" : `<col style="width:10%" />`}
              <col style="width:13%" />
            </colgroup>
            <thead>
              <tr>
                <th class="num">#</th>
                <th>الفقرة</th>
                <th>التفاصيل</th>
                <th class="num">الوحدة</th>
                <th class="num">الكمية</th>
                ${quote.hide_unit_price ? "" : `<th class="num">سعر الوحدة</th>`}
                <th class="num">المبلغ الإجمالي</th>
              </tr>
            </thead>
            <tbody>${rows}
              <tr class="sub-row"><td colspan="${quote.hide_unit_price ? 6 : 7}">مجموع القسم: <b>${fmt(st.sumSaleBeforeDiscount)} ${currencyLabel}</b></td></tr>
            </tbody>
          </table>
        </div>`;
    })
    .join("");

  const paymentsHtml = payments
    .map(
      (p) => `<tr><td>${esc(p.label)}</td><td class="num">${p.pct}%</td><td class="num total">${fmt((totals.finalTotal * p.pct) / 100)} ${currencyLabel}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />
<style>

  * { box-sizing: border-box; }
  body {
    font-family: 'Almarai', 'Montserrat', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #3b3026;
    font-size: 12.5px;
    margin: 0;
    padding: 20px 30px;
  }
  .brand-dark { color: #EF9C3D; }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #EF9C3D; padding-bottom: 14px; margin-bottom: 14px;
  }
  .header-brand { display: flex; align-items: center; gap: 12px; }
  .header-logo { height: 42px; width: auto; flex: none; }
  .company-name { font-weight: 800; font-size: 16px; }
  .company-line { font-size: 10.5px; color: #7a6a58; margin-top: 3px; line-height: 1.7; }
  .doc-title { text-align: left; }
  .doc-title .kind { font-size: 10px; font-weight: 800; color: #7a6a58; text-transform: uppercase; }
  .doc-title .num { font-weight: 800; font-size: 13px; margin-top: 2px; }
  .doc-title .date { font-size: 10.5px; color: #7a6a58; margin-top: 2px; }

  .meta-grid { display: flex; gap: 22px; font-size: 11px; margin-bottom: 10px; flex-wrap: wrap; }
  .meta-grid .k { color: #7a6a58; font-weight: 700; }

  .intro { font-size: 12px; margin-bottom: 10px; line-height: 1.8; }

  .section-block { margin-bottom: 14px; }
  .section-title { font-weight: 800; font-size: 12.5px; border-bottom: 1px solid #e6e1d3; padding-bottom: 5px; margin-bottom: 6px; }
  table.items { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.items thead { display: table-header-group; }
  table.items th { background: #fdf4e8; color: #7a6a58; font-size: 10px; font-weight: 800; padding: 6px 8px; text-align: right; border-bottom: 1px solid #e6e1d3; }
  table.items td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 11px; vertical-align: top; }
  table.items tr { page-break-inside: avoid; break-inside: avoid; }
  table.items td.name-cell { font-weight: 700; color: #3b3026; }
  table.items tr.sub-row td { text-align: left; font-size: 11px; color: #7a6a58; border-bottom: none; padding-top: 5px; }
  table.items tr.sub-row b { color: #3b3026; }
  .section-title { page-break-after: avoid; break-after: avoid; }
  td.num, th.num { text-align: center; font-variant-numeric: tabular-nums; }
  td.total { font-weight: 800; }
  .note { font-size: 9.5px; color: #7a6a58; margin-top: 2px; }
  .detail-cell { font-size: 10px; color: #5a4a3c; line-height: 1.65; }
  .section-sub { text-align: left; font-size: 11px; color: #7a6a58; margin-top: 3px; }
  .section-sub b { color: #3b3026; }

  .totals-box { background: #FDF0E0; border-radius: 10px; padding: 14px 18px; margin-top: 12px; page-break-inside: avoid; }
  .totals-box .row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 2px 0; }
  .totals-box .row.final { font-size: 15px; font-weight: 800; color: #EF9C3D; border-top: 1px dashed #e2cfa8; margin-top: 6px; padding-top: 8px; }
  .totals-box .words { font-size: 10.5px; margin-top: 6px; color: #3b3026; }

  .pay-title { font-weight: 800; font-size: 12px; margin: 12px 0 6px; page-break-after: avoid; break-after: avoid; }
  table.pay { width: 100%; border-collapse: collapse; }
  table.pay th { background: #fdf4e8; color: #7a6a58; font-size: 10px; padding: 6px 8px; text-align: right; }
  table.pay td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 11px; }

  .terms { margin-top: 12px; font-size: 10.5px; line-height: 1.9; color: #3b3026; page-break-inside: avoid; }
  .terms .pre { white-space: pre-wrap; }
  .terms-title { font-weight: 800; font-size: 12px; margin-bottom: 6px; color: #3b3026; }

  .outro { font-size: 11.5px; margin-top: 14px; }

  .sign-grid { display: flex; justify-content: space-between; margin-top: 22px; gap: 24px; page-break-inside: avoid; }
  .sign-grid .box { flex: 1; border-top: 1px solid #8a8a8a; padding-top: 6px; font-size: 10.5px; text-align: center; color: #3b3026; }
${SEAL_CSS}
  .watermark {
    position: fixed; top: 40%; left: 0; right: 0; text-align: center;
    font-size: 90px; font-weight: 800; color: #EF9C3D; opacity: 0.09;
    transform: rotate(-28deg); pointer-events: none; z-index: 0;
  }
  .closing { page-break-inside: avoid; break-inside: avoid; }
  .doc-footer {
    margin-top: 16px; padding-top: 8px; border-top: 1px solid #e6e1d3;
    font-size: 9px; color: #9a9484; text-align: center;
  }
</style>
</head>
<body>
  ${isDraft ? `<div class="watermark">مسودة</div>` : ""}
  <div class="header">
    <div class="header-brand">
      <img class="header-logo" src="${LOGO_DATA_URI}" alt="بيت القصيد" />
      <div>
        <div class="company-name">${esc(company.name_ar)}</div>
        <div class="company-line">${esc(company.address)}<br><bdi dir="ltr">${esc(company.website)}</bdi> · <bdi dir="ltr">${esc(company.email)}</bdi> · <bdi dir="ltr">${esc(company.phone)}</bdi></div>
      </div>
    </div>
    <div class="doc-title">
      <div class="kind">عرض سعر${isDraft ? " — مسودة" : ""}</div>
      <div class="num">${esc(quote.number)}</div>
      <div class="date">تاريخ الإصدار: <bdi dir="ltr">${esc(quote.issue_date)}</bdi></div>
      ${quote.valid_until ? `<div class="date">صالح حتى: <bdi dir="ltr">${esc(quote.valid_until)}</bdi></div>` : ""}
    </div>
  </div>

  <div class="meta-grid">
    <div><span class="k">العميل: </span>${esc(quote.client_name)}</div>
    <div><span class="k">المشروع: </span>${esc(quote.project_name)}</div>
    ${quote.execution_duration_days ? `<div><span class="k">مدة التنفيذ: </span>${esc(formatExecutionDuration(quote.execution_duration_days))}</div>` : ""}
  </div>

  ${quote.intro_text ? `<div class="intro">${esc(quote.intro_text)}</div>` : ""}

  ${sectionsHtml}

  <div class="totals-box">
    <div class="row"><span>المجموع قبل الخصم</span><b>${fmt(totals.sumSaleBeforeDiscount)} ${currencyLabel}</b></div>
    ${totals.discountAmount > 0 ? `<div class="row"><span>الخصم</span><b>${fmt(totals.discountAmount)} ${currencyLabel}</b></div>` : ""}
    ${totals.taxAmount > 0 ? `<div class="row"><span>الضريبة</span><b>${fmt(totals.taxAmount)} ${currencyLabel}</b></div>` : ""}
    <div class="row final"><span>المبلغ النهائي</span><span>${fmt(totals.finalTotal)} ${currencyLabel}</span></div>
    <div class="words">${esc(amountToArabicWords(totals.finalTotal))}</div>
  </div>

  <div class="pay-title">نظام الدفعات</div>
  <table class="pay">
    <thead><tr><th>الدفعة</th><th class="num">النسبة</th><th class="num">المبلغ</th></tr></thead>
    <tbody>${paymentsHtml}</tbody>
  </table>

  ${
    quote.payment_terms || company.general_terms
      ? `<div class="terms">
          <div class="terms-title">الشروط والأحكام</div>
          ${quote.payment_terms ? `<div class="pre">طريقة الدفع: ${esc(quote.payment_terms.trim())}</div>` : ""}
          ${company.general_terms ? `<div class="pre" style="margin-top:6px;">${esc(company.general_terms.trim())}</div>` : ""}
        </div>`
      : ""
  }

  ${quote.outro_text ? `<div class="outro">${esc(quote.outro_text)}</div>` : ""}

  <div class="closing">
  <div class="sign-grid">
    <div class="box">اسم مُعدّ العرض: ${esc(quote.created_by_name || "")}${sealHtml(seal)}توقيع وختم الشركة</div>
    <div class="box">توقيع واستلام العميل</div>
  </div>

  <div class="doc-footer">${esc(company.name_ar)} · <bdi dir="ltr">${esc(company.phone)}</bdi> — <bdi dir="ltr">${esc(quote.number)}</bdi> — للاستخدام الداخلي والعميل المعني فقط</div>
  </div>
</body>
</html>`;
}
