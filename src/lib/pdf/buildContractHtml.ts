// توليد HTML لعقد تنفيذ الأعمال — يُستخدم فقط بعد اعتماد عرض السعر (APPROVED)، ويحوّل بيانات
// العرض المعتمد إلى صيغة عقدية رسمية (طرفان، مواد مرقّمة، توقيعات) بدل عرض سعر عادي.
// يعيد استخدام نفس محرك التسعير وقالب الأقسام/الجدول من buildQuoteHtml حفاظاً على الاتساق البصري.
import { computeItem, computeQuoteTotals } from "@/lib/pricing/engine";
import { amountToArabicWords } from "@/lib/pricing/numberToArabicWords";
import type { QuoteRow, SectionWithItems, PaymentRow } from "@/lib/repo/quotes";
import type { CompanySettings } from "@/lib/repo/settings";
import type { ClientRow } from "@/lib/repo/clients";
import { LOGO_DATA_URI } from "./logoBase64";

function esc(s: string | null | undefined): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmt(n: number) {
  return Math.round(n || 0).toLocaleString("en-US");
}

// رقم العقد مشتق من رقم عرض السعر نفسه (نفس الرقم المرجعي)، مع استبدال بادئة "QTN" الخاصة
// بعروض الأسعار بـ"CTR" الخاصة بالعقود إن وُجدت، لتبقى قابلة للتتبع دون ترقيم منفصل مستقل.
export function buildContractNumber(quoteNumber: string): string {
  return quoteNumber.includes("QTN") ? quoteNumber.replace("QTN", "CTR") : `CTR-${quoteNumber}`;
}

export function buildContractHtml(
  quote: QuoteRow,
  sections: SectionWithItems[],
  payments: PaymentRow[],
  company: CompanySettings,
  client: ClientRow | undefined
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

  const currencyLabel = quote.currency === "IQD" ? "د.ع" : quote.currency;
  const contractNumber = buildContractNumber(quote.number);
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

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
            <td class="name-cell">${esc(it.name)}</td>
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
          <div class="section-sub">مجموع البند: <b>${fmt(st.sumSaleBeforeDiscount)} ${currencyLabel}</b></div>
        </div>`;
    })
    .join("");

  const paymentsHtml = payments
    .map(
      (p) => `<tr><td>${esc(p.label)}</td><td class="num">${p.pct}%</td><td class="num total">${fmt((totals.finalTotal * p.pct) / 100)} ${currencyLabel}</td></tr>`
    )
    .join("");

  const clientContactLine = [client?.contact_person, client?.phone, client?.address].filter(Boolean).map(esc).join(" · ");
  const companyContactLine = [company.address, company.phone, company.email].filter(Boolean).map(esc).join(" · ");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @font-face { font-family: 'Cairo'; src: local('Cairo'); }
  * { box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl; color: #21261f; font-size: 12.5px; margin: 0; padding: 28px 34px;
  }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #EF9C3D; padding-bottom: 14px; margin-bottom: 16px;
  }
  .header-brand { display: flex; align-items: center; gap: 12px; }
  .header-logo { height: 42px; width: auto; flex: none; }
  .company-name { font-weight: 800; font-size: 16px; }
  .company-line { font-size: 10.5px; color: #6b7264; margin-top: 3px; line-height: 1.7; }
  .doc-title { text-align: left; }
  .doc-title .kind { font-size: 10px; font-weight: 800; color: #6b7264; text-transform: uppercase; }
  .doc-title .num { font-weight: 800; font-size: 13px; margin-top: 2px; }
  .doc-title .date { font-size: 10.5px; color: #6b7264; margin-top: 2px; }

  .contract-title { text-align: center; font-weight: 800; font-size: 17px; margin: 6px 0 16px; }
  .preamble { font-size: 11.5px; line-height: 1.9; margin-bottom: 14px; }

  .parties { display: flex; gap: 14px; margin-bottom: 16px; }
  .party { flex: 1; border: 1px solid #e6e1d3; border-radius: 10px; padding: 12px 14px; }
  .party .role { font-weight: 800; font-size: 11.5px; color: #EF9C3D; margin-bottom: 4px; }
  .party .name { font-weight: 800; font-size: 13px; }
  .party .line { font-size: 10.5px; color: #6b7264; margin-top: 4px; line-height: 1.7; }

  .article { margin-bottom: 14px; page-break-inside: avoid; }
  .article-title { font-weight: 800; font-size: 12.5px; border-bottom: 1px solid #e6e1d3; padding-bottom: 5px; margin-bottom: 8px; }
  .article-body { font-size: 11px; line-height: 1.9; color: #333c2f; white-space: pre-wrap; }

  .section-block { margin-bottom: 12px; }
  .section-title { font-weight: 800; font-size: 12px; border-bottom: 1px solid #e6e1d3; padding-bottom: 4px; margin-bottom: 6px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead { display: table-header-group; }
  table.items th { background: #faf8f4; color: #6b7264; font-size: 10px; font-weight: 800; padding: 6px 8px; text-align: right; border-bottom: 1px solid #e6e1d3; }
  table.items td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 10.5px; }
  table.items tr { page-break-inside: avoid; }
  td.num, th.num { text-align: center; font-variant-numeric: tabular-nums; }
  td.total { font-weight: 800; }
  .detail-cell { font-size: 9.5px; color: #6b7264; }
  .section-sub { text-align: left; font-size: 10.5px; color: #6b7264; margin-top: 3px; }
  .section-sub b { color: #21261f; }

  .totals-box { background: #FDF0E0; border-radius: 10px; padding: 14px 18px; margin: 10px 0; page-break-inside: avoid; }
  .totals-box .row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 2px 0; }
  .totals-box .row.final { font-size: 15px; font-weight: 800; color: #EF9C3D; border-top: 1px dashed #e2cfa8; margin-top: 6px; padding-top: 8px; }
  .totals-box .words { font-size: 10.5px; margin-top: 6px; color: #5c5238; }

  table.pay { width: 100%; border-collapse: collapse; }
  table.pay th { background: #faf8f4; color: #6b7264; font-size: 10px; padding: 6px 8px; text-align: right; }
  table.pay td { padding: 6px 8px; border-bottom: 1px solid #efece4; font-size: 11px; }

  .sign-grid { display: flex; justify-content: space-between; margin-top: 40px; gap: 24px; page-break-inside: avoid; }
  .sign-grid .box { flex: 1; border-top: 1px solid #8a8a8a; padding-top: 6px; font-size: 10.5px; text-align: center; color: #4a5148; }
  .doc-footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e6e1d3; font-size: 9px; color: #9a9484; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-brand">
      <img class="header-logo" src="${LOGO_DATA_URI}" alt="بيت القصيد" />
      <div>
        <div class="company-name">${esc(company.name_ar)}</div>
        <div class="company-line">${companyContactLine}</div>
      </div>
    </div>
    <div class="doc-title">
      <div class="kind">عقد تنفيذ أعمال</div>
      <div class="num">${esc(contractNumber)}</div>
      <div class="date">التاريخ: ${today}</div>
    </div>
  </div>

  <div class="contract-title">عقد تنفيذ أعمال</div>

  <div class="preamble">
    تم الاتفاق والتراضي التام بين الطرفين الموقّعين أدناه على تنفيذ الأعمال الموضحة في هذا العقد، والمستندة إلى
    عرض السعر المعتمد رقم <b>${esc(quote.number)}</b> بتاريخ ${esc(quote.issue_date)}، وذلك وفق الشروط والأحكام المبيّنة في المواد التالية،
    والتي يقرّ الطرفان بقراءتها والموافقة عليها.
  </div>

  <div class="parties">
    <div class="party">
      <div class="role">الطرف الأول (المقاول)</div>
      <div class="name">${esc(company.name_ar)}</div>
      <div class="line">${companyContactLine}</div>
    </div>
    <div class="party">
      <div class="role">الطرف الثاني (صاحب العمل)</div>
      <div class="name">${esc(quote.client_name)}</div>
      ${clientContactLine ? `<div class="line">${clientContactLine}</div>` : ""}
    </div>
  </div>

  <div class="article">
    <div class="article-title">المادة الأولى — موضوع العقد</div>
    <div class="article-body">يلتزم الطرف الأول بتنفيذ الأعمال الخاصة بمشروع «${esc(quote.project_name)}» للطرف الثاني، وفق نطاق العمل والمواصفات الفنية المفصّلة في المادة الثانية من هذا العقد، وبما يطابق عرض السعر المعتمد المشار إليه أعلاه.</div>
  </div>

  <div class="article">
    <div class="article-title">المادة الثانية — نطاق الأعمال والمواصفات الفنية</div>
    ${sectionsHtml}
  </div>

  <div class="article">
    <div class="article-title">المادة الثالثة — قيمة العقد</div>
    <div class="totals-box">
      <div class="row"><span>المجموع قبل الخصم</span><b>${fmt(totals.sumSaleBeforeDiscount)} ${currencyLabel}</b></div>
      ${totals.discountAmount > 0 ? `<div class="row"><span>الخصم</span><b>${fmt(totals.discountAmount)} ${currencyLabel}</b></div>` : ""}
      ${totals.taxAmount > 0 ? `<div class="row"><span>الضريبة</span><b>${fmt(totals.taxAmount)} ${currencyLabel}</b></div>` : ""}
      <div class="row final"><span>القيمة الإجمالية للعقد</span><span>${fmt(totals.finalTotal)} ${currencyLabel}</span></div>
      <div class="words">${esc(amountToArabicWords(totals.finalTotal))}</div>
    </div>
  </div>

  <div class="article">
    <div class="article-title">المادة الرابعة — نظام الدفعات</div>
    <table class="pay">
      <thead><tr><th>الدفعة</th><th class="num">النسبة</th><th class="num">المبلغ</th></tr></thead>
      <tbody>${paymentsHtml}</tbody>
    </table>
    ${quote.payment_terms ? `<div class="article-body" style="margin-top:8px;">${esc(quote.payment_terms)}</div>` : ""}
  </div>

  <div class="article">
    <div class="article-title">المادة الخامسة — مدة التنفيذ</div>
    <div class="article-body">${quote.execution_duration ? esc(quote.execution_duration) : "تُحدَّد مدة التنفيذ باتفاق الطرفين، وتبدأ من تاريخ استلام الدفعة الأولى وتسليم الموقع جاهزاً لمباشرة العمل."}</div>
  </div>

  <div class="article">
    <div class="article-title">المادة السادسة — الشروط والأحكام العامة</div>
    <div class="article-body">${company.general_terms ? esc(company.general_terms) : "تنفَّذ الأعمال وفق الأصول الفنية المتعارف عليها والمواصفات المعتمدة من الطرف الثاني، وأي تعديل على النطاق أو المواصفات بعد توقيع هذا العقد يُسعَّر بشكل منفصل ولا يُعد جزءاً من هذا العقد إلا بموافقة خطية من الطرفين."}

يلتزم الطرف الثاني بتهيئة موقع العمل وتمكين الطرف الأول من الوصول إليه، ويُحمَّل الطرف الثاني مسؤولية أي تأخير ناتج عن عدم جاهزية الموقع أو تأخر السداد وفق الجدول المتفق عليه في المادة الرابعة.

يُعفى الطرفان من الالتزام بالمدد الزمنية المحددة في هذا العقد في حال وقوع ظروف قاهرة خارجة عن إرادتهما.

في حال نشوء أي خلاف حول تفسير أو تنفيذ بنود هذا العقد، يسعى الطرفان إلى حله ودياً؛ فإن تعذّر ذلك يُحال النزاع إلى الجهات القضائية المختصة.

حُرِّر هذا العقد من نسختين أصليتين بيد كل طرف نسخة للعمل بموجبها.</div>
  </div>

  <div class="sign-grid">
    <div class="box">الطرف الأول (المقاول)<br>${esc(company.name_ar)}<br><br>التوقيع والختم</div>
    <div class="box">الطرف الثاني (صاحب العمل)<br>${esc(quote.client_name)}<br><br>التوقيع</div>
  </div>

  <div class="doc-footer">${esc(company.name_ar)} · ${esc(company.phone)} — ${esc(contractNumber)} — مستند تعاقدي مستند إلى عرض السعر ${esc(quote.number)}</div>
</body>
</html>`;
}
