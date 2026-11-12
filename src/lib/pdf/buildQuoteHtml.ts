// توليد HTML مخصص لعرض السعر النهائي (PDF) — منفصل عن واجهة المحرر عمداً، لأن طباعة PDF
// تحتاج تحكماً دقيقاً بتكرار رأس الجدول بين الصفحات، ومنع تقسيم السطر الواحد، وهوامش الطباعة.
//
// التصميم مبني على الهوية البصرية لقسم المشاريع: صفحات بيضاء، الشعار البرتقالي الأصلي في الزاوية
// العلوية اليمنى، ونقش السهم الأصلي خافتاً في الزاوية العلوية اليسرى، والعناوين بالبني الداكن،
// والبرتقالي في صف عناوين الجداول والخطوط الفاصلة، والخط المراعي مضمَّناً. الترويسة (الشعار ورقم
// العرض) تتكرر في كل صفحة، والتذييل (معلومات الاتصال ورقم الصفحة) يأتي من قالب تذييل الطباعة
// QUOTE_PDF_FOOTER_TEMPLATE الذي يمرره مسار التصدير إلى خدمة api2pdf.
import { computeItem, computeQuoteTotals, applyOverheadToItems, sumOverheadCosts, type PricingItem } from "@/lib/pricing/engine";
import { amountToArabicWords } from "@/lib/pricing/numberToArabicWords";
import type { QuoteRow, SectionWithItems, PaymentRow, OverheadCostRow } from "@/lib/repo/quotes";
import type { CompanySettings } from "@/lib/repo/settings";
import { ALMARAI_FONT_FACES, BAQ_LOGO_ORANGE, BAQ_PATTERN_A4 } from "./brandAssets";
import { sealHtml, SEAL_CSS, type SealImages } from "./seal";
import { formatExecutionDuration } from "@/lib/format/duration";

function esc(s: string | null | undefined): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// يزيل الأسطر الفارغة والمسافات المكررة من النصوص المدخلة يدوياً حتى لا تظهر فراغات في الطباعة
function clean(s: string | null | undefined): string {
  return esc((s || "").replace(/\s+/g, " ").trim());
}
// التاريخ بصيغة يوم/شهر/سنة، وهي المألوفة في المراسلات العراقية ولا تنقلب داخل النص العربي
function dmy(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : esc(iso);
}
function fmt(n: number) {
  return Math.round(n || 0).toLocaleString("en-US");
}

// ألوان الهوية (قسم المشاريع) — لا يُستعمل لون من خارجها، بل درجات شفافية منها فقط
const ORANGE = "#ef9c3d";
const BROWN = "#3b3026";

// مقاسات الطباعة (A4): الترويسة الثابتة أعلى كل صفحة، وهامش سفلي يحجزه قالب التذييل
export const QUOTE_PDF_MARGINS = { top: "0mm", bottom: "15mm", left: "0mm", right: "0mm" };

// قالب تذييل الطباعة: شريط برتقالي بمعلومات الاتصال ورقم الصفحة، يتكرر في كل صفحة.
// قوالب الترويسة والتذييل في Chrome لا ترث خطوط الصفحة ولا أنماطها، لذلك يُضمَّن كل شيء داخله.
export function buildQuoteFooterTemplate(company: CompanySettings, quoteNumber: string): string {
  return `<div style="width:100%;margin:0;padding:0;font-size:8.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
  <style>${ALMARAI_FONT_FACES}</style>
  <div dir="rtl" style="font-family:'Almarai',Tahoma,Arial,sans-serif;margin:0 14mm;border-top:2px solid ${ORANGE};padding-top:5px;display:flex;justify-content:space-between;align-items:center;color:${BROWN};">
    <span>${esc(company.address)}&nbsp;&nbsp;·&nbsp;&nbsp;<span dir="ltr">${esc(company.phone)}</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span dir="ltr">${esc(company.email)}</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span dir="ltr">${esc(company.website)}</span></span>
    <span style="white-space:nowrap;">${esc(quoteNumber)}&nbsp;&nbsp;|&nbsp;&nbsp;صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></span>
  </div>
</div>`;
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
  const hidePrice = !!quote.hide_unit_price;
  const colCount = hidePrice ? 6 : 7;

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
            <td class="c">${si + 1}.${ii + 1}</td>
            <td class="name">${clean(it.name)}${it.client_note ? `<div class="note">${clean(it.client_note)}</div>` : ""}</td>
            <td class="detail">${clean(it.description)}</td>
            <td class="c">${clean(it.unit)}</td>
            <td class="c n">${fmt(it.qty)}</td>
            ${hidePrice ? "" : `<td class="c n">${fmt(c.unitPrice)}</td>`}
            <td class="c n b">${fmt(c.saleTotal)}</td>
          </tr>`;
        })
        .join("");
      return `
        <div class="section">
          <h2><span class="sn">${String(si + 1).padStart(2, "0")}</span>${clean(s.name || "قسم")}</h2>
          <table class="items">
            <colgroup>
              <col style="width:6%"><col style="width:${hidePrice ? 20 : 17}%"><col style="width:${hidePrice ? 46 : 39}%">
              <col style="width:9%"><col style="width:8%">${hidePrice ? "" : `<col style="width:10%">`}<col style="width:${hidePrice ? 11 : 11}%">
            </colgroup>
            <thead>
              <tr>
                <th>ت</th><th>الفقرة</th><th>التفاصيل</th><th>الوحدة</th><th>الكمية</th>
                ${hidePrice ? "" : `<th>سعر الوحدة</th>`}<th>المبلغ</th>
              </tr>
            </thead>
            <tbody>${rows}
              <tr class="sub"><td colspan="${colCount - 1}">مجموع القسم</td><td class="c n b">${fmt(st.sumSaleBeforeDiscount)}</td></tr>
            </tbody>
          </table>
        </div>`;
    })
    .join("");

  const paymentsHtml = payments
    .map(
      (p) => `<tr><td>${clean(p.label)}</td><td class="c n">${p.pct}%</td><td class="c n b">${fmt((totals.finalTotal * p.pct) / 100)} ${currencyLabel}</td></tr>`
    )
    .join("");

  const meta: [string, string][] = [
    ["العميل", clean(quote.client_name)],
    ["المشروع", clean(quote.project_name)],
    ["تاريخ الإصدار", `<span dir="ltr">${dmy(quote.issue_date)}</span>`],
  ];
  if (quote.valid_until) meta.push(["صالح حتى", `<span dir="ltr">${dmy(quote.valid_until)}</span>`]);
  if (quote.execution_duration_days) meta.push(["مدة التنفيذ", esc(formatExecutionDuration(quote.execution_duration_days))]);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
${ALMARAI_FONT_FACES}
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Almarai', Tahoma, Arial, sans-serif; direction: rtl; color: ${BROWN}; font-size: 10.5px; line-height: 1.7; }

  /* الترويسة الثابتة: تتكرر في أعلى كل صفحة مع النقش. النقش في أسفل الطبقات، وكل الصناديق والجداول
     فوقه بخلفيات معتمة (التظليل البرتقالي فوق الأبيض) حتى لا يظهر النقش من خلالها */
  .pattern { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0; }
  .pattern img { width: 100%; height: 100%; }
  .head { position: fixed; top: 0; left: 0; right: 0; height: 28mm; padding: 8mm 14mm 0; z-index: 1;
          display: flex; justify-content: space-between; align-items: flex-start; }
  .head .logo { height: 14mm; width: auto; }
  .head .doc { text-align: left; padding-top: 1mm; }
  .head .doc .k { font-size: 9px; font-weight: 700; color: ${ORANGE}; letter-spacing: .3px; }
  .head .doc .v { font-size: 12.5px; font-weight: 800; direction: ltr; }

  /* الجدول الخارجي يحجز مكان الترويسة في كل صفحة (رأسه يتكرر تلقائياً عند الطباعة) */
  table.page { width: 100%; border-collapse: collapse; position: relative; z-index: 2; }
  table.page > thead td { height: 29mm; padding: 0; }
  table.page > tbody > tr > td { padding: 0 14mm; }

  .title { display: flex; align-items: stretch; gap: 10px; margin: 0 0 12px; }
  .title .bar { width: 4px; background: ${ORANGE}; border-radius: 2px; }
  .title h1 { margin: 0; font-size: 19px; font-weight: 800; line-height: 1.35; }
  .title .co { font-size: 10px; opacity: .75; }

  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px; padding: 8px 14px; margin-bottom: 10px;
          background: linear-gradient(rgba(239,156,61,.08), rgba(239,156,61,.08)), #ffffff; border-right: 3px solid ${ORANGE}; border-radius: 4px; }
  .meta div { font-size: 10.5px; }
  .meta .k { font-weight: 700; opacity: .7; }

  .intro { margin: 0 0 10px; font-size: 11px; }

  .section { margin-bottom: 12px; }
  h2 { font-size: 13px; font-weight: 800; margin: 10px 0 5px; display: flex; align-items: center; gap: 8px; break-after: avoid; page-break-after: avoid; }
  h2 .sn { color: ${ORANGE}; font-weight: 800; }

  table.items { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.items thead { display: table-header-group; }
  table.items th { background: ${ORANGE}; color: #ffffff; font-size: 9.5px; font-weight: 700; padding: 6px 5px; text-align: center; }
  table.items td { background: #ffffff; padding: 7px 5px; border-bottom: 1px solid rgba(239,156,61,.35); vertical-align: top; font-size: 10px; word-wrap: break-word; }
  table.items tbody tr:nth-child(even):not(.sub) td { background: linear-gradient(rgba(239,156,61,.10), rgba(239,156,61,.10)), #ffffff; }
  table.items tr { break-inside: avoid; page-break-inside: avoid; }
  td.c { text-align: center; }
  td.n { font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.b { font-weight: 800; }
  td.name { font-weight: 700; }
  td.detail { text-align: justify; font-size: 9.5px; line-height: 1.75; }
  .note { font-size: 8.5px; font-weight: 400; opacity: .7; margin-top: 2px; }
  tr.sub td { border-top: 1.5px solid ${ORANGE}; border-bottom: 0; font-weight: 700; padding-top: 6px; }
  tr.sub td:first-child { text-align: left; padding-left: 10px; }

  .keep { break-inside: avoid; page-break-inside: avoid; }

  .totals { margin-top: 10px; background: #ffffff; border: 1px solid rgba(239,156,61,.5); border-radius: 6px; overflow: hidden; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 14px; font-size: 11px; }
  .totals .row + .row { border-top: 1px solid rgba(239,156,61,.25); }
  .totals .final { background: linear-gradient(rgba(239,156,61,.12), rgba(239,156,61,.12)), #ffffff; font-size: 14px; font-weight: 800; }
  .totals .final b { color: ${BROWN}; }
  .totals .words { padding: 6px 14px 8px; font-size: 10px; background: linear-gradient(rgba(239,156,61,.12), rgba(239,156,61,.12)), #ffffff; border-top: 1px dashed rgba(239,156,61,.5); }

  h3 { font-size: 12px; font-weight: 800; margin: 12px 0 5px; padding-right: 8px; border-right: 3px solid ${ORANGE}; break-after: avoid; page-break-after: avoid; }
  table.pay { width: 100%; border-collapse: collapse; }
  table.pay th { background: ${ORANGE}; color: #ffffff; font-size: 9.5px; font-weight: 700; padding: 5px 8px; text-align: center; }
  table.pay th:first-child, table.pay td:first-child { text-align: right; }
  table.pay td { background: #ffffff; padding: 6px 8px; border-bottom: 1px solid rgba(239,156,61,.35); font-size: 10.5px; }

  .terms p { margin: 0 0 4px; font-size: 10.5px; }
  .terms .gen { white-space: pre-line; }
  .outro { margin: 12px 0 0; font-size: 11px; }

  .sign { display: flex; justify-content: space-between; gap: 30px; margin-top: 14px; }
  .sign .box { flex: 1; text-align: center; font-size: 10px; }
  .sign .box .t { font-weight: 700; border-top: 1px solid rgba(59,48,38,.5); padding-top: 6px; margin-top: 4px; }
  .sign .box .by { opacity: .75; }
  .sign .box .space { height: 92px; }
${SEAL_CSS}
  .seal { margin: 0 auto; }
  .watermark { position: fixed; top: 42%; left: 0; right: 0; text-align: center; font-size: 96px; font-weight: 800;
               color: ${ORANGE}; opacity: .10; transform: rotate(-28deg); z-index: 3; pointer-events: none; }
</style>
</head>
<body>
  <div class="pattern"><img src="${BAQ_PATTERN_A4}" alt=""></div>
  <div class="head">
    <img class="logo" src="${BAQ_LOGO_ORANGE}" alt="بيت القصيد">
    <div class="doc"><div class="k">عرض سعر${isDraft ? " — مسودة" : ""}</div><div class="v">${esc(quote.number)}</div></div>
  </div>
  ${isDraft ? `<div class="watermark">مسودة</div>` : ""}

  <table class="page">
    <thead><tr><td></td></tr></thead>
    <tbody><tr><td>

      <div class="title"><div class="bar"></div><div>
        <h1>${clean(quote.title && quote.title !== "عرض سعر" ? quote.title : `عرض سعر — ${quote.project_name || ""}`)}</h1>
        <div class="co">${esc(company.name_ar)}</div>
      </div></div>

      <div class="meta">${meta.map(([k, v]) => `<div><span class="k">${k}: </span>${v}</div>`).join("")}</div>

      ${quote.intro_text ? `<p class="intro">${clean(quote.intro_text)}</p>` : ""}

      ${sectionsHtml}

      <div class="totals keep">
        <div class="row"><span>المجموع قبل الخصم</span><b>${fmt(totals.sumSaleBeforeDiscount)} ${currencyLabel}</b></div>
        ${totals.discountAmount > 0 ? `<div class="row"><span>الخصم</span><b>${fmt(totals.discountAmount)} ${currencyLabel}</b></div>` : ""}
        ${totals.taxAmount > 0 ? `<div class="row"><span>الضريبة</span><b>${fmt(totals.taxAmount)} ${currencyLabel}</b></div>` : ""}
        <div class="row final"><span>المبلغ النهائي</span><b>${fmt(totals.finalTotal)} ${currencyLabel}</b></div>
        <div class="words">${esc(amountToArabicWords(totals.finalTotal))}</div>
      </div>

      ${
        payments.length
          ? `<div class="keep"><h3>نظام الدفعات</h3>
        <table class="pay">
          <thead><tr><th>الدفعة</th><th>النسبة</th><th>المبلغ</th></tr></thead>
          <tbody>${paymentsHtml}</tbody>
        </table></div>`
          : ""
      }

      <div class="keep">
        ${
          quote.payment_terms || company.general_terms
            ? `<div class="terms"><h3>الشروط والأحكام</h3>
                ${quote.payment_terms ? `<p>طريقة الدفع: ${clean(quote.payment_terms)}</p>` : ""}
                ${company.general_terms ? `<p class="gen">${esc(company.general_terms.trim())}</p>` : ""}
              </div>`
            : ""
        }
        ${quote.outro_text ? `<p class="outro">${clean(quote.outro_text)}</p>` : ""}

        <div class="sign">
          <div class="box">
            ${seal && sealHtml(seal) !== "<br><br>" ? sealHtml(seal) : `<div class="space"></div>`}
            <div class="t">توقيع وختم الشركة</div>
            ${quote.created_by_name ? `<div class="by">مُعدّ العرض: ${clean(quote.created_by_name)}</div>` : ""}
          </div>
          <div class="box">
            <div class="space"></div>
            <div class="t">توقيع واستلام العميل</div>
          </div>
        </div>
      </div>

    </td></tr></tbody>
  </table>
</body>
</html>`;
}
