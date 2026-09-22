// توليد HTML مخصص لعرض السعر النهائي (PDF) — منفصل عن واجهة المحرر عمداً، لأن طباعة PDF
// تحتاج تحكماً دقيقاً بتكرار رأس الجدول بين الصفحات، ومنع تقسيم السطر الواحد، وهوامش الطباعة —
// وهذا أسهل وأضمن بقالب HTML/CSS مخصص للطباعة بدل إعادة استخدام واجهة React التفاعلية.
import { computeItem, computeQuoteTotals } from "@/lib/pricing/engine";
import { amountToArabicWords } from "@/lib/pricing/numberToArabicWords";
import type { QuoteRow, SectionWithItems, PaymentRow } from "@/lib/repo/quotes";
import type { CompanySettings } from "@/lib/repo/settings";

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
  company: CompanySettings
): string {
  const flatItems = sections.flatMap((s) => s.items).map((it) => ({
    id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price,
  }));
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
        visible.map((it) => ({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price })),
        { type: "PERCENT", value: 0 }, false, 0, 0
      );
      const rows = visible
        .map((it, ii) => {
          const c = computeItem({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price });
          return `<tr>
            <td class="num">${ii + 1}</td>
            <td class="name-cell">${esc(it.name)}${it.client_note ? `<div class="note">${esc(it.client_note)}</div>` : ""}</td>
            <td class="detail-cell">${esc(it.description)}</td>
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
            <tbody>${rows}</tbody>
          </table>
          <div class="section-sub">مجموع القسم: <b>${fmt(st.sumSaleBeforeDiscount)} ${currencyLabel}</b></div>
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
<style>
  @font-face {
    font-family: 'Cairo';
    src: local('Cairo');
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #21261f;
    font-size: 12.5px;
    margin: 0;
    padding: 28px 34px;
  }
  .brand-dark { color: #74816F; }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #74816F; padding-bottom: 14px; margin-bottom: 18px;
  }
  .company-name { font-weight: 800; font-size: 16px; }
  .company-line { font-size: 10.5px; color: #6b7264; margin-top: 3px; line-height: 1.7; }
  .doc-title { text-align: left; }
  .doc-title .kind { font-size: 10px; font-weight: 800; color: #6b7264; text-transform: uppercase; }
  .doc-title .num { font-weight: 800; font-size: 13px; margin-top: 2px; }
  .doc-title .date { font-size: 10.5px; color: #6b7264; margin-top: 2px; }

  .meta-grid { display: flex; gap: 22px; font-size: 11px; margin-bottom: 16px; flex-wrap: wrap; }
  .meta-grid .k { color: #6b7264; font-weight: 700; }

  .intro { font-size: 12px; margin-bottom: 16px; line-height: 1.8; }

  .section-block { margin-bottom: 14px; }
  .section-title { font-weight: 800; font-size: 12.5px; border-bottom: 1px solid #e6e1d3; padding-bottom: 5px; margin-bottom: 6px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead { display: table-header-group; }
  table.items th { background: #faf8f4; color: #6b7264; font-size: 10px; font-weight: 800; padding: 6px 8px; text-align: right; border-bottom: 1px solid #e6e1d3; }
  table.items td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 11px; }
  table.items tr { page-break-inside: avoid; }
  td.num, th.num { text-align: center; font-variant-numeric: tabular-nums; }
  td.total { font-weight: 800; }
  .note { font-size: 9.5px; color: #6b7264; margin-top: 2px; }
  .detail-cell { font-size: 10px; color: #6b7264; }
  .section-sub { text-align: left; font-size: 11px; color: #6b7264; margin-top: 3px; }
  .section-sub b { color: #21261f; }

  .totals-box { background: #F6E8D2; border-radius: 10px; padding: 14px 18px; margin-top: 12px; page-break-inside: avoid; }
  .totals-box .row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 2px 0; }
  .totals-box .row.final { font-size: 15px; font-weight: 800; color: #74816F; border-top: 1px dashed #e2cfa8; margin-top: 6px; padding-top: 8px; }
  .totals-box .words { font-size: 10.5px; margin-top: 6px; color: #5c5238; }

  .pay-title { font-weight: 800; font-size: 12px; margin: 16px 0 6px; }
  table.pay { width: 100%; border-collapse: collapse; }
  table.pay th { background: #faf8f4; color: #6b7264; font-size: 10px; padding: 6px 8px; text-align: right; }
  table.pay td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 11px; }

  .terms { margin-top: 18px; font-size: 10.5px; line-height: 1.9; color: #4a5148; white-space: pre-wrap; page-break-inside: avoid; }
  .terms-title { font-weight: 800; font-size: 12px; margin-bottom: 6px; color: #21261f; }

  .outro { font-size: 11.5px; margin-top: 14px; }

  .sign-grid { display: flex; justify-content: space-between; margin-top: 46px; gap: 24px; page-break-inside: avoid; }
  .sign-grid .box { flex: 1; border-top: 1px solid #8a8a8a; padding-top: 6px; font-size: 10.5px; text-align: center; color: #4a5148; }
  .watermark {
    position: fixed; top: 40%; left: 0; right: 0; text-align: center;
    font-size: 90px; font-weight: 800; color: #74816F; opacity: 0.09;
    transform: rotate(-28deg); pointer-events: none; z-index: 0;
  }
  .doc-footer {
    margin-top: 24px; padding-top: 8px; border-top: 1px solid #e6e1d3;
    font-size: 9px; color: #9a9484; text-align: center;
  }
</style>
</head>
<body>
  ${isDraft ? `<div class="watermark">مسودة</div>` : ""}
  <div class="header">
    <div>
      <div class="company-name">${esc(company.name_ar)}</div>
      <div class="company-line">${esc(company.address)}<br>${esc(company.website)} · ${esc(company.email)} · ${esc(company.phone)}</div>
    </div>
    <div class="doc-title">
      <div class="kind">عرض سعر${isDraft ? " — مسودة" : ""}</div>
      <div class="num">${esc(quote.number)}</div>
      <div class="date">تاريخ الإصدار: ${esc(quote.issue_date)}</div>
      ${quote.valid_until ? `<div class="date">صالح حتى: ${esc(quote.valid_until)}</div>` : ""}
    </div>
  </div>

  <div class="meta-grid">
    <div><span class="k">العميل: </span>${esc(quote.client_name)}</div>
    <div><span class="k">المشروع: </span>${esc(quote.project_name)}</div>
    ${quote.execution_duration ? `<div><span class="k">مدة التنفيذ: </span>${esc(quote.execution_duration)}</div>` : ""}
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
          ${quote.payment_terms ? `<div>طريقة الدفع: ${esc(quote.payment_terms)}</div>` : ""}
          ${company.general_terms ? `<div style="margin-top:6px;">${esc(company.general_terms)}</div>` : ""}
        </div>`
      : ""
  }

  ${quote.outro_text ? `<div class="outro">${esc(quote.outro_text)}</div>` : ""}

  <div class="sign-grid">
    <div class="box">اسم مُعدّ العرض: ${esc(quote.created_by_name || "")}<br><br>توقيع وختم الشركة</div>
    <div class="box">توقيع واستلام العميل</div>
  </div>

  <div class="doc-footer">${esc(company.name_ar)} · ${esc(company.phone)} — ${esc(quote.number)} — للاستخدام الداخلي والعميل المعني فقط</div>
</body>
</html>`;
}
