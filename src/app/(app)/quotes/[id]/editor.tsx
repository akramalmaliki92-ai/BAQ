"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { canEditMarginOrDiscount, canApprove, roleLabel } from "@/lib/auth/types";
import { computeItem, computeQuoteTotals, computeUnitPrice } from "@/lib/pricing/engine";
import { amountToArabicWords } from "@/lib/pricing/numberToArabicWords";
import type { EditorProps } from "./editor-types";
import {
  updateQuoteMetaAction,
  addSectionAction,
  renameSectionAction,
  deleteSectionAction,
  addLibraryItemAction,
  addCustomItemAction,
  updateItemAction,
  deleteItemAction,
  copyItemAction,
  reorderItemsAction,
  setPaymentsAction,
  setOverheadCostsAction,
  sendForReviewAction,
  returnForRevisionAction,
  approveQuoteAction,
  cancelApprovalAction,
  cancelQuoteAction,
} from "../actions";

const EDITABLE_STATUSES = ["DRAFT", "NEEDS_REVISION"];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة", IN_REVIEW: "قيد المراجعة", NEEDS_REVISION: "يحتاج إلى تعديل", APPROVED: "معتمد", CANCELLED: "ملغى",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#8a8a8a", IN_REVIEW: "#b8860b", NEEDS_REVISION: "#c0552f", APPROVED: "#2f7d4f", CANCELLED: "#a3402f",
};
const UNITS = ["متر طولي", "متر مربع", "متر مكعب", "عدد", "نقطة", "مقطوعية", "يوم", "ساعة", "طن", "كيلوغرام"];

function fmt(n: number) {
  return Math.round(n || 0).toLocaleString("en-US");
}

export default function QuoteEditor(props: EditorProps) {
  const { quote, payments, libraryItems, company, currentUser } = props;
  const [sections, setSections] = useState(props.sections);
  const [meta, setMeta] = useState({
    title: quote.title,
    issue_date: quote.issue_date,
    valid_until: quote.valid_until || "",
    execution_duration: quote.execution_duration,
    payment_terms: quote.payment_terms,
    intro_text: quote.intro_text,
    outro_text: quote.outro_text,
    internal_notes: quote.internal_notes,
    discount_type: quote.discount_type,
    discount_value: quote.discount_value,
    tax_enabled: !!quote.tax_enabled,
    tax_pct: quote.tax_pct,
    hide_unit_price: !!quote.hide_unit_price,
  });
  const [pay, setPay] = useState(payments.map((p) => ({ label: p.label, pct: p.pct })));
  const [overhead, setOverhead] = useState(
    props.overheadCosts.map((o) => ({ label: o.label, days: o.days, daily_rate: o.daily_rate }))
  );
  const [tab, setTab] = useState<"edit" | "internal" | "client" | "log">("edit");
  const [pending, startTransition] = useTransition();
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const editable = EDITABLE_STATUSES.includes(quote.status);
  const canDiscount = canEditMarginOrDiscount(currentUser.role);
  const canApproveRole = canApprove(currentUser.role);

  const flatItems = useMemo(
    () =>
      sections.flatMap((s) =>
        s.items.map((it) => ({
          id: it.id,
          qty: it.qty,
          unitCost: it.unit_cost,
          marginPct: it.margin_pct,
          manualUnitPrice: it.manual_unit_price,
        }))
      ),
    [sections]
  );

  const totals = useMemo(
    () =>
      computeQuoteTotals(
        flatItems,
        { type: meta.discount_type, value: Number(meta.discount_value) || 0 },
        meta.tax_enabled,
        Number(meta.tax_pct) || 0,
        quote.min_margin_pct ?? company.min_margin_pct
      ),
    [flatItems, meta, quote.min_margin_pct, company.min_margin_pct]
  );

  function persistMeta(patch: Partial<typeof meta>) {
    const next = { ...meta, ...patch };
    setMeta(next);
    startTransition(() => {
      updateQuoteMetaAction(quote.id, next).catch((e) => alert(e.message || "حدث خطأ"));
    });
  }

  function addSection() {
    const name = prompt("اسم القسم الجديد:", "");
    if (name === null) return;
    const tempId = "tmp_" + Math.random().toString(36).slice(2);
    setSections((s) => [...s, { id: tempId, quote_id: quote.id, name: name || "قسم جديد", sort_order: s.length, items: [] }]);
    startTransition(async () => {
      try {
        const realId = await addSectionAction(quote.id, name || "قسم جديد");
        setSections((s) => s.map((sec) => (sec.id === tempId ? { ...sec, id: realId } : sec)));
      } catch (e: any) {
        alert(e.message);
      }
    });
  }

  function renameSection(id: string, name: string) {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, name } : sec)));
    startTransition(() => {
      renameSectionAction(quote.id, id, name).catch((e) => alert(e.message));
    });
  }

  function removeSection(id: string) {
    if (!confirm("حذف هذا القسم بكل فقراته؟")) return;
    setSections((s) => s.filter((sec) => sec.id !== id));
    startTransition(() => {
      deleteSectionAction(quote.id, id).catch((e) => alert(e.message));
    });
  }

  function addCustom(sectionId: string) {
    const tempId = "tmp_" + Math.random().toString(36).slice(2);
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: tempId,
                  section_id: sectionId,
                  library_item_id: null,
                  code: "",
                  name: "",
                  description: "",
                  unit: "عدد",
                  qty: 0,
                  unit_cost: 0,
                  margin_pct: company.default_margin_pct,
                  manual_unit_price: null,
                  internal_note: "",
                  client_note: "",
                  hidden_from_client: 0,
                  sort_order: s.items.length,
                },
              ],
            }
          : s
      )
    );
    startTransition(async () => {
      try {
        const realId = await addCustomItemAction(quote.id, sectionId, { name: "", margin_pct: company.default_margin_pct });
        setSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.map((it) => (it.id === tempId ? { ...it, id: realId } : it)) } : s)));
      } catch (e: any) {
        alert(e.message);
      }
    });
  }

  function addFromLibrary(sectionId: string, libId: string) {
    const li = libraryItems.find((l) => l.id === libId);
    if (!li) return;
    const tempId = "tmp_" + Math.random().toString(36).slice(2);
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: tempId,
                  section_id: sectionId,
                  library_item_id: li.id,
                  code: li.code || "",
                  name: li.name,
                  description: li.description,
                  unit: li.unit,
                  qty: 1,
                  unit_cost: li.default_unit_cost,
                  margin_pct: li.default_margin_pct,
                  manual_unit_price: null,
                  internal_note: "",
                  client_note: "",
                  hidden_from_client: 0,
                  sort_order: s.items.length,
                },
              ],
            }
          : s
      )
    );
    setPickerFor(null);
    startTransition(async () => {
      try {
        const realId = await addLibraryItemAction(quote.id, sectionId, libId);
        setSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.map((it) => (it.id === tempId ? { ...it, id: realId } : it)) } : s)));
      } catch (e: any) {
        alert(e.message);
      }
    });
  }

  function patchItem(sectionId: string, itemId: string, patch: Record<string, unknown>) {
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) } : s
      )
    );
  }

  function commitItem(itemId: string, patch: Record<string, unknown>) {
    startTransition(() => {
      updateItemAction(quote.id, itemId, patch).catch((e) => alert(e.message));
    });
  }

  function removeItem(sectionId: string, itemId: string) {
    setSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)));
    startTransition(() => {
      deleteItemAction(quote.id, itemId).catch((e) => alert(e.message));
    });
  }

  function duplicateItem(itemId: string) {
    startTransition(async () => {
      await copyItemAction(quote.id, itemId).catch((e) => alert(e.message));
      window.location.reload();
    });
  }

  function moveItem(sectionId: string, itemId: string, dir: -1 | 1) {
    setSections((secs) =>
      secs.map((s) => {
        if (s.id !== sectionId) return s;
        const idx = s.items.findIndex((i) => i.id === itemId);
        const swapWith = idx + dir;
        if (idx < 0 || swapWith < 0 || swapWith >= s.items.length) return s;
        const items = [...s.items];
        [items[idx], items[swapWith]] = [items[swapWith], items[idx]];
        startTransition(() => {
          reorderItemsAction(quote.id, sectionId, items.map((i) => i.id)).catch((e) => alert(e.message));
        });
        return { ...s, items };
      })
    );
  }

  function updatePayLabel(idx: number, label: string) {
    setPay((p) => p.map((x, i) => (i === idx ? { ...x, label } : x)));
  }
  function updatePayPct(idx: number, pct: number) {
    const next = pay.map((x, i) => (i === idx ? { ...x, pct } : x));
    setPay(next);
    startTransition(() => setPaymentsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  function commitPayLabels() {
    startTransition(() => setPaymentsAction(quote.id, pay).catch((e) => alert(e.message)));
  }
  function addPayment() {
    const next = [...pay, { label: `الدفعة ${pay.length + 1}`, pct: 0 }];
    setPay(next);
    startTransition(() => setPaymentsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  function removePayment(idx: number) {
    const next = pay.filter((_, i) => i !== idx);
    setPay(next);
    startTransition(() => setPaymentsAction(quote.id, next).catch((e) => alert(e.message)));
  }

  const payPctTotal = pay.reduce((s, p) => s + (Number(p.pct) || 0), 0);

  function updateOverheadLabel(idx: number, label: string) {
    setOverhead((o) => o.map((x, i) => (i === idx ? { ...x, label } : x)));
  }
  function commitOverheadLabels() {
    startTransition(() => setOverheadCostsAction(quote.id, overhead).catch((e) => alert(e.message)));
  }
  function updateOverheadDays(idx: number, days: number) {
    const next = overhead.map((x, i) => (i === idx ? { ...x, days } : x));
    setOverhead(next);
    startTransition(() => setOverheadCostsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  function updateOverheadRate(idx: number, daily_rate: number) {
    const next = overhead.map((x, i) => (i === idx ? { ...x, daily_rate } : x));
    setOverhead(next);
    startTransition(() => setOverheadCostsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  function addOverhead() {
    const next = [...overhead, { label: "مهندس الموقع", days: 0, daily_rate: 0 }];
    setOverhead(next);
    startTransition(() => setOverheadCostsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  function removeOverhead(idx: number) {
    const next = overhead.filter((_, i) => i !== idx);
    setOverhead(next);
    startTransition(() => setOverheadCostsAction(quote.id, next).catch((e) => alert(e.message)));
  }
  const overheadTotal = overhead.reduce((s, o) => s + (Number(o.days) || 0) * (Number(o.daily_rate) || 0), 0);

  function doSendForReview() {
    if (!confirm("إرسال عرض السعر إلى المدير للمراجعة؟ لن تتمكن من تعديله حتى يعاد إليك أو يُعتمد.")) return;
    startTransition(async () => {
      await sendForReviewAction(quote.id).catch((e) => alert(e.message));
      window.location.reload();
    });
  }
  function doApprove() {
    if (!confirm("اعتماد عرض السعر؟ سيُقفل ضد التعديل بعد الاعتماد.")) return;
    startTransition(async () => {
      await approveQuoteAction(quote.id).catch((e) => alert(e.message));
      window.location.reload();
    });
  }
  function doReturn() {
    if (!revisionNote.trim()) return alert("يجب كتابة ملاحظة للمعدّ توضح سبب الإعادة");
    startTransition(async () => {
      await returnForRevisionAction(quote.id, revisionNote).catch((e) => alert(e.message));
      window.location.reload();
    });
  }
  function doCancelApproval() {
    if (!cancelReason.trim()) return alert("يجب كتابة سبب إلغاء الاعتماد");
    startTransition(async () => {
      await cancelApprovalAction(quote.id, cancelReason).catch((e) => alert(e.message));
      window.location.reload();
    });
  }
  function doCancelQuote() {
    if (!confirm("إلغاء عرض السعر نهائياً؟")) return;
    startTransition(async () => {
      await cancelQuoteAction(quote.id, cancelReason || "إلغاء بواسطة الإدارة").catch((e) => alert(e.message));
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-16">
      {/* رأس الصفحة */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold tabular">{quote.number}</h1>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: STATUS_COLOR[quote.status] }}>
              {STATUS_LABEL[quote.status]}
            </span>
            {quote.status === "DRAFT" && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fdf1e0] text-[#9a5b23]">مسودة — غير معتمد</span>}
          </div>
          <div className="text-sm text-[var(--foreground-muted)] mt-1">
            <Link href={`/projects/${quote.project_id}`} className="font-bold" style={{ color: "var(--brand-dark)" }}>{quote.project_name}</Link>
            {" · "}{quote.client_name}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]"
          >
            📄 تصدير PDF
          </a>
          {editable && (
            <button onClick={doSendForReview} disabled={pending} className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
              إرسال للمراجعة
            </button>
          )}
        </div>
      </div>

      {quote.status === "NEEDS_REVISION" && quote.revision_note && (
        <div className="text-sm rounded-xl px-4 py-3 bg-[#fbeae5] text-[#c0552f] border border-[#f0c9bd]">
          <b>ملاحظة المدير:</b> {quote.revision_note}
        </div>
      )}

      {/* تبويبات */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {[
          { k: "edit", l: "تحرير" },
          { k: "internal", l: "معاينة داخلية (سرّي)" },
          { k: "client", l: "معاينة العميل" },
          { k: "log", l: "السجل الزمني" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className="text-sm font-bold px-3.5 py-2 rounded-t-lg border-b-2"
            style={{ borderColor: tab === t.k ? "var(--brand-dark)" : "transparent", color: tab === t.k ? "var(--brand-dark)" : "var(--foreground-muted)" }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "edit" && (
        <>
          {/* بيانات العرض */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 grid sm:grid-cols-3 gap-4">
            <Field label="عنوان العرض">
              <input disabled={!editable} defaultValue={meta.title} onBlur={(e) => persistMeta({ title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="تاريخ الإصدار">
              <input disabled={!editable} type="date" defaultValue={meta.issue_date} onBlur={(e) => persistMeta({ issue_date: e.target.value })} className={`${inputCls} tabular`} />
            </Field>
            <Field label="تاريخ انتهاء الصلاحية">
              <input disabled={!editable} type="date" defaultValue={meta.valid_until} onBlur={(e) => persistMeta({ valid_until: e.target.value })} className={`${inputCls} tabular`} />
            </Field>
            <Field label="مدة التنفيذ">
              <input disabled={!editable} defaultValue={meta.execution_duration} onBlur={(e) => persistMeta({ execution_duration: e.target.value })} className={inputCls} placeholder="مثال: 45 يوم عمل" />
            </Field>
            <Field label="طريقة الدفع (نص وصفي)">
              <input disabled={!editable} defaultValue={meta.payment_terms} onBlur={(e) => persistMeta({ payment_terms: e.target.value })} className={inputCls} />
            </Field>
            <Field label="العملة">
              <div className={`${inputCls} bg-[var(--surface-muted)] tabular`}>{quote.currency}</div>
            </Field>
            <Field label="مقدمة العرض" full>
              <textarea disabled={!editable} defaultValue={meta.intro_text} onBlur={(e) => persistMeta({ intro_text: e.target.value })} rows={2} className={inputCls} />
            </Field>
            <Field label="خاتمة العرض" full>
              <textarea disabled={!editable} defaultValue={meta.outro_text} onBlur={(e) => persistMeta({ outro_text: e.target.value })} rows={2} className={inputCls} />
            </Field>
            <Field label="ملاحظات داخلية (لا تظهر للعميل)" full>
              <textarea disabled={!editable} defaultValue={meta.internal_notes} onBlur={(e) => persistMeta({ internal_notes: e.target.value })} rows={2} className={inputCls} />
            </Field>
          </div>

          {/* الأقسام والفقرات */}
          <div className="flex flex-col gap-4">
            {sections.map((s, si) => {
              const st = computeQuoteTotals(
                s.items.map((it) => ({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price })),
                { type: "PERCENT", value: 0 },
                false,
                0,
                0
              );
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none" style={{ background: "var(--brand-dark)" }}>{si + 1}</div>
                    <input
                      disabled={!editable}
                      defaultValue={s.name}
                      onBlur={(e) => renameSection(s.id, e.target.value)}
                      placeholder="اسم القسم"
                      className="flex-1 bg-transparent font-bold text-sm px-2 py-1 rounded focus:bg-white focus:ring-2 outline-none"
                    />
                    <div className="text-xs text-[var(--foreground-muted)] tabular whitespace-nowrap">مجموع القسم: <b className="text-[var(--foreground)]">{fmt(st.sumSaleBeforeDiscount)}</b></div>
                    {editable && <button onClick={() => removeSection(s.id)} className="text-xs text-red-600 font-bold px-2">حذف القسم</button>}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10.5px] text-[var(--foreground-muted)] border-b border-[var(--border)]">
                          <th className="px-2 py-2 text-right font-bold w-8">#</th>
                          <th className="px-2 py-2 text-right font-bold min-w-[160px]">الفقرة</th>
                          <th className="px-2 py-2 text-right font-bold min-w-[220px]">التفاصيل</th>
                          <th className="px-2 py-2 text-right font-bold w-24">الوحدة</th>
                          <th className="px-2 py-2 text-right font-bold w-20">الكمية</th>
                          <th className="px-2 py-2 text-right font-bold w-24 bg-[var(--brand-light)]">الكلفة *</th>
                          <th className="px-2 py-2 text-right font-bold w-20 bg-[var(--brand-light)]">الربح % *</th>
                          <th className="px-2 py-2 text-right font-bold w-24">سعر الوحدة</th>
                          <th className="px-2 py-2 text-right font-bold w-28">المجموع</th>
                          <th className="px-2 py-2 text-right font-bold w-24 bg-[var(--brand-light)]">الربح *</th>
                          <th className="px-2 py-2 text-right font-bold w-10">إخفاء</th>
                          <th className="px-2 py-2 w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.items.map((it, ii) => {
                          const c = computeItem({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price });
                          return (
                            <tr key={it.id} className="border-b border-[var(--border)] last:border-0">
                              <td className="px-2 py-1.5 text-[var(--foreground-muted)] tabular">{ii + 1}</td>
                              <td className="px-2 py-1.5">
                                <input
                                  disabled={!editable}
                                  defaultValue={it.name}
                                  onBlur={(e) => { patchItem(s.id, it.id, { name: e.target.value }); commitItem(it.id, { name: e.target.value }); }}
                                  className={rowInputCls}
                                  placeholder="اسم الفقرة"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  disabled={!editable}
                                  defaultValue={it.description}
                                  onBlur={(e) => { patchItem(s.id, it.id, { description: e.target.value }); commitItem(it.id, { description: e.target.value }); }}
                                  className={rowInputCls}
                                  placeholder="مثال: مواد + عمل الجبسوم بورد على هيكل حديدي 40×40"
                                  title={it.description}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  disabled={!editable}
                                  list="units-list"
                                  defaultValue={it.unit}
                                  onBlur={(e) => { patchItem(s.id, it.id, { unit: e.target.value }); commitItem(it.id, { unit: e.target.value }); }}
                                  className={rowInputCls}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  disabled={!editable}
                                  type="number" step="any"
                                  defaultValue={it.qty}
                                  onChange={(e) => patchItem(s.id, it.id, { qty: Number(e.target.value) || 0 })}
                                  onBlur={(e) => commitItem(it.id, { qty: Number(e.target.value) || 0 })}
                                  className={`${rowInputCls} tabular`}
                                />
                              </td>
                              <td className="px-2 py-1.5 bg-[var(--brand-light)]/40">
                                <input
                                  disabled={!editable}
                                  type="number" step="any"
                                  defaultValue={it.unit_cost}
                                  onChange={(e) => patchItem(s.id, it.id, { unit_cost: Number(e.target.value) || 0 })}
                                  onBlur={(e) => commitItem(it.id, { unit_cost: Number(e.target.value) || 0 })}
                                  className={`${rowInputCls} tabular`}
                                />
                              </td>
                              <td className="px-2 py-1.5 bg-[var(--brand-light)]/40">
                                <input
                                  disabled={!editable}
                                  type="number" step="any"
                                  defaultValue={it.margin_pct}
                                  onChange={(e) => patchItem(s.id, it.id, { margin_pct: Number(e.target.value) || 0 })}
                                  onBlur={(e) => commitItem(it.id, { margin_pct: Number(e.target.value) || 0 })}
                                  className={`${rowInputCls} tabular`}
                                />
                              </td>
                              <td className="px-2 py-1.5 tabular font-bold">
                                {editable && canDiscount ? (
                                  <input
                                    type="number" step="any"
                                    defaultValue={it.manual_unit_price ?? c.unitPrice}
                                    onBlur={(e) => {
                                      const v = e.target.value === "" ? null : Number(e.target.value);
                                      patchItem(s.id, it.id, { manual_unit_price: v });
                                      commitItem(it.id, { manual_unit_price: v });
                                    }}
                                    className={`${rowInputCls} tabular`}
                                    title="تعديل يدوي للسعر (يتجاوز الحساب التلقائي)"
                                  />
                                ) : (
                                  fmt(c.unitPrice)
                                )}
                              </td>
                              <td className="px-2 py-1.5 tabular font-bold">{fmt(c.saleTotal)}</td>
                              <td className="px-2 py-1.5 tabular bg-[var(--brand-light)]/40">{fmt(c.profitTotal)}</td>
                              <td className="px-2 py-1.5 text-center">
                                <input
                                  disabled={!editable}
                                  type="checkbox"
                                  defaultChecked={!!it.hidden_from_client}
                                  onChange={(e) => { patchItem(s.id, it.id, { hidden_from_client: e.target.checked }); commitItem(it.id, { hidden_from_client: e.target.checked }); }}
                                />
                              </td>
                              <td className="px-2 py-1.5 whitespace-nowrap">
                                {editable && (
                                  <div className="flex gap-1 items-center justify-end">
                                    <button onClick={() => moveItem(s.id, it.id, -1)} className="text-[11px] px-1" title="نقل لأعلى">▲</button>
                                    <button onClick={() => moveItem(s.id, it.id, 1)} className="text-[11px] px-1" title="نقل لأسفل">▼</button>
                                    <button onClick={() => duplicateItem(it.id)} className="text-[11px] px-1" title="نسخ">⧉</button>
                                    <button onClick={() => removeItem(s.id, it.id)} className="text-[11px] px-1 text-red-600" title="حذف">✕</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {editable && (
                    <div className="flex gap-2 items-center px-3 py-2.5 border-t border-[var(--border)] flex-wrap">
                      <button onClick={() => addCustom(s.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)]">
                        ＋ فقرة مخصّصة
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setPickerFor(pickerFor === s.id ? null : s.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                          style={{ background: "var(--brand-dark)" }}
                        >
                          ＋ من مكتبة الفقرات
                        </button>
                        {pickerFor === s.id && (
                          <LibraryPicker items={libraryItems} onPick={(id) => addFromLibrary(s.id, id)} onClose={() => setPickerFor(null)} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {editable && (
              <button onClick={addSection} className="rounded-2xl border-2 border-dashed border-[var(--border)] py-4 text-sm font-bold text-[var(--foreground-muted)] hover:border-[var(--brand-dark)] hover:text-[var(--brand-dark)]">
                ＋ إضافة قسم جديد
              </button>
            )}
          </div>
          <datalist id="units-list">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>

          {/* الخصم والضريبة والدفعات والملخص */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
              <div className="font-bold text-sm">الخصم والضريبة {!canDiscount && <span className="text-[11px] font-normal text-[var(--foreground-muted)]">(للمدير/المسؤول فقط)</span>}</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نوع الخصم">
                  <select disabled={!editable || !canDiscount} defaultValue={meta.discount_type} onChange={(e) => persistMeta({ discount_type: e.target.value as "PERCENT" | "FIXED" })} className={inputCls}>
                    <option value="PERCENT">نسبة %</option>
                    <option value="FIXED">مبلغ ثابت</option>
                  </select>
                </Field>
                <Field label="قيمة الخصم">
                  <input disabled={!editable || !canDiscount} type="number" step="any" defaultValue={meta.discount_value} onBlur={(e) => persistMeta({ discount_value: Number(e.target.value) || 0 })} className={`${inputCls} tabular`} />
                </Field>
                <Field label="تفعيل الضريبة">
                  <label className="flex items-center gap-2 h-full">
                    <input disabled={!editable} type="checkbox" defaultChecked={meta.tax_enabled} onChange={(e) => persistMeta({ tax_enabled: e.target.checked })} />
                    <span className="text-sm">مفعّلة</span>
                  </label>
                </Field>
                <Field label="نسبة الضريبة %">
                  <input disabled={!editable} type="number" step="any" defaultValue={meta.tax_pct} onBlur={(e) => persistMeta({ tax_pct: Number(e.target.value) || 0 })} className={`${inputCls} tabular`} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm mt-1">
                <input disabled={!editable} type="checkbox" defaultChecked={meta.hide_unit_price} onChange={(e) => persistMeta({ hide_unit_price: e.target.checked })} />
                إخفاء سعر الوحدة في نسخة العميل (جدول كميات فقط)
              </label>

              {totals.belowMinMargin && (
                <div className="text-xs font-bold rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">
                  ⚠ تحذير: نسبة الربح الفعلية بعد الخصم ({totals.effectiveMarginPct}%) أقل من الحد الأدنى المسموح ({quote.min_margin_pct ?? company.min_margin_pct}%)
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
              <div className="font-bold text-sm">نظام الدفعات</div>
              <table className="w-full text-sm">
                <tbody>
                  {pay.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pl-2">
                        <input disabled={!editable} defaultValue={p.label} onChange={(e) => updatePayLabel(idx, e.target.value)} onBlur={commitPayLabels} className={inputCls} />
                      </td>
                      <td className="py-1 pl-2 w-24">
                        <input disabled={!editable} type="number" defaultValue={p.pct} onBlur={(e) => updatePayPct(idx, Number(e.target.value) || 0)} className={`${inputCls} tabular`} />
                      </td>
                      <td className="py-1 tabular font-bold w-28 text-left">{fmt(totals.finalTotal * (Number(p.pct) || 0) / 100)}</td>
                      {editable && (
                        <td className="w-8">
                          <button onClick={() => removePayment(idx)} className="text-red-600 text-xs">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={`text-xs font-bold ${Math.abs(payPctTotal - 100) < 0.01 ? "text-[#2f7d4f]" : "text-[#a3402f]"}`}>
                {Math.abs(payPctTotal - 100) < 0.01 ? "✓ مجموع النسب 100%" : `مجموع النسب حالياً ${payPctTotal}% (يفترض أن يكون 100%)`}
              </div>
              {editable && (
                <button onClick={addPayment} className="self-start text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)]">＋ إضافة دفعة</button>
              )}
            </div>
          </div>

          {/* مصاريف ونفقات المشروع الداخلية */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
            <div>
              <div className="font-bold text-sm">مصاريف ونفقات المشروع (داخلي فقط)</div>
              <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5">مثل مهندس الموقع أو المشرف — لا تظهر إطلاقاً للعميل ولا في PDF، وتُستخدم فقط لمعرفة التكلفة الحقيقية وصافي الربح.</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[var(--foreground-muted)]">
                  <th className="text-right font-bold py-1">البند</th>
                  <th className="text-right font-bold py-1 w-24">عدد الأيام</th>
                  <th className="text-right font-bold py-1 w-28">سعر اليوم</th>
                  <th className="text-right font-bold py-1 w-28">المجموع</th>
                  {editable && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {overhead.map((o, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pl-2">
                      <input disabled={!editable} defaultValue={o.label} onChange={(e) => updateOverheadLabel(idx, e.target.value)} onBlur={commitOverheadLabels} className={inputCls} placeholder="مثال: مهندس الموقع" />
                    </td>
                    <td className="py-1 pl-2">
                      <input disabled={!editable} type="number" step="any" defaultValue={o.days} onBlur={(e) => updateOverheadDays(idx, Number(e.target.value) || 0)} className={`${inputCls} tabular`} />
                    </td>
                    <td className="py-1 pl-2">
                      <input disabled={!editable} type="number" step="any" defaultValue={o.daily_rate} onBlur={(e) => updateOverheadRate(idx, Number(e.target.value) || 0)} className={`${inputCls} tabular`} />
                    </td>
                    <td className="py-1 tabular font-bold">{fmt((Number(o.days) || 0) * (Number(o.daily_rate) || 0))}</td>
                    {editable && (
                      <td className="w-8">
                        <button onClick={() => removeOverhead(idx)} className="text-red-600 text-xs">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {overhead.length === 0 && <div className="text-xs text-[var(--foreground-muted)]">لا توجد بنود مضافة بعد</div>}
            <div className="flex items-center justify-between">
              {editable ? (
                <button onClick={addOverhead} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)]">＋ إضافة بند</button>
              ) : <span />}
              <div className="text-sm font-bold">إجمالي المصاريف: <span className="tabular">{fmt(overheadTotal)}</span></div>
            </div>
          </div>

          <TotalsSummary totals={totals} currency={quote.currency} overheadTotal={overheadTotal} />

          {/* إجراءات دورة المراجعة */}
          <ReviewActions
            role={currentUser.role}
            status={quote.status}
            canApproveRole={canApproveRole}
            revisionNote={revisionNote}
            setRevisionNote={setRevisionNote}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            onApprove={doApprove}
            onReturn={doReturn}
            onCancelApproval={doCancelApproval}
            onCancelQuote={doCancelQuote}
          />
        </>
      )}

      {(tab === "internal" || tab === "client") && (
        <DocumentPreview
          quote={quote}
          sections={sections}
          pay={pay}
          totals={totals}
          company={company}
          internal={tab === "internal"}
          hideUnitPrice={meta.hide_unit_price}
        />
      )}

      {tab === "log" && <AuditTab auditLog={props.auditLog} />}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-60 disabled:bg-[var(--surface-muted)]";
const rowInputCls = "w-full rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--brand-dark)] px-1.5 py-1 text-xs outline-none disabled:opacity-70 bg-transparent focus:bg-white";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-3" : ""}>
      <label className="block text-[11px] font-bold mb-1 text-[var(--foreground-muted)]">{label}</label>
      {children}
    </div>
  );
}

function LibraryPicker({
  items,
  onPick,
  onClose,
}: {
  items: EditorProps["libraryItems"];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => !q || i.name.includes(q) || (i.code || "").includes(q));
  return (
    <div className="absolute z-30 mt-2 w-80 bg-white rounded-xl border border-[var(--border)] shadow-lg p-2" style={{ insetInlineStart: 0 }}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في المكتبة..." className="w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs mb-2" />
      <div className="max-h-80 overflow-y-auto flex flex-col">
        {filtered.length === 0 && <div className="text-xs text-[var(--foreground-muted)] px-2 py-3">لا توجد نتائج</div>}
        {filtered.map((it) => (
          <button key={it.id} onClick={() => onPick(it.id)} className="text-right text-xs px-2 py-2 rounded-lg hover:bg-[var(--surface-muted)] flex flex-col gap-0.5 border-b border-[var(--border)] last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{it.name}</span>
              <span className="tabular font-bold flex-none" style={{ color: "var(--brand-dark)" }}>
                {fmt(computeUnitPrice(it.default_unit_cost, it.default_margin_pct))}
              </span>
            </div>
            <div className="text-[10.5px] text-[var(--foreground-muted)]">{it.main_category} · {it.unit}</div>
            {it.description && <div className="text-[10.5px] text-[var(--foreground-muted)] line-clamp-2">{it.description}</div>}
          </button>
        ))}
      </div>
      <button onClick={onClose} className="text-[11px] text-[var(--foreground-muted)] mt-1">إغلاق</button>
    </div>
  );
}

function TotalsSummary({
  totals, currency, overheadTotal,
}: { totals: ReturnType<typeof computeQuoteTotals>; currency: string; overheadTotal?: number }) {
  const ovh = overheadTotal || 0;
  const netProfit = totals.profitAfterDiscount - ovh;
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-1.5">
      <div className="font-bold text-sm mb-1">الملخص المالي (داخلي)</div>
      <Row l="إجمالي الكلفة" v={fmt(totals.sumCost)} />
      <Row l="إجمالي البيع قبل الخصم" v={fmt(totals.sumSaleBeforeDiscount)} />
      <Row l="قيمة الخصم" v={fmt(totals.discountAmount)} />
      <Row l="إجمالي البيع بعد الخصم" v={fmt(totals.sumSaleAfterDiscount)} />
      <Row l="الضريبة" v={fmt(totals.taxAmount)} />
      <Row l="الربح المتوقع بعد الخصم" v={fmt(totals.profitAfterDiscount)} good />
      <Row l="نسبة الربح الفعلية بعد الخصم" v={`${totals.effectiveMarginPct}%`} good={!totals.belowMinMargin} bad={totals.belowMinMargin} />
      {ovh > 0 && (
        <>
          <Row l="مصاريف ونفقات المشروع (الإشراف ونحوه)" v={fmt(ovh)} />
          <Row l="صافي الربح بعد المصاريف" v={fmt(netProfit)} good={netProfit >= 0} bad={netProfit < 0} />
        </>
      )}
      <div className="h-px bg-[var(--border)] my-1" />
      <Row l="المبلغ النهائي" v={`${fmt(totals.finalTotal)} ${currency === "IQD" ? "د.ع" : currency}`} big />
      <div className="text-xs text-[var(--foreground-muted)] mt-1">{amountToArabicWords(totals.finalTotal)}</div>
    </div>
  );
}
function Row({ l, v, good, bad, big }: { l: string; v: string; good?: boolean; bad?: boolean; big?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-[var(--foreground-muted)]">{l}</span>
      <span className={`tabular font-bold ${big ? "text-lg" : ""}`} style={{ color: bad ? "#a3402f" : good ? "#2f7d4f" : big ? "var(--brand-dark)" : undefined }}>{v}</span>
    </div>
  );
}

function ReviewActions({
  role, status, canApproveRole, revisionNote, setRevisionNote, cancelReason, setCancelReason,
  onApprove, onReturn, onCancelApproval, onCancelQuote,
}: {
  role: string; status: string; canApproveRole: boolean;
  revisionNote: string; setRevisionNote: (s: string) => void;
  cancelReason: string; setCancelReason: (s: string) => void;
  onApprove: () => void; onReturn: () => void; onCancelApproval: () => void; onCancelQuote: () => void;
}) {
  if (!canApproveRole) return null;
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
      <div className="font-bold text-sm">إجراءات المراجعة والاعتماد ({roleLabel(role as "ADMIN" | "MANAGER" | "PREPARER")})</div>
      {status === "IN_REVIEW" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={onApprove} className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "#2f7d4f" }}>✓ اعتماد عرض السعر</button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="ملاحظة الإعادة للمعدّ..." className={`${inputCls} max-w-sm`} />
            <button onClick={onReturn} className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]">↩ إعادة للتعديل</button>
          </div>
        </div>
      )}
      {status === "APPROVED" && (
        <div className="flex gap-2 items-center flex-wrap">
          <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="سبب إلغاء الاعتماد..." className={`${inputCls} max-w-sm`} />
          <button onClick={onCancelApproval} className="rounded-xl border border-red-300 text-red-700 font-bold text-sm px-4 py-2.5 hover:bg-red-50">إلغاء الاعتماد</button>
        </div>
      )}
      {(status === "DRAFT" || status === "IN_REVIEW" || status === "NEEDS_REVISION") && (
        <button onClick={onCancelQuote} className="self-start text-xs text-red-600 font-bold">إلغاء عرض السعر نهائياً</button>
      )}
    </div>
  );
}

function DocumentPreview({
  quote, sections, pay, totals, company, internal, hideUnitPrice,
}: {
  quote: EditorProps["quote"]; sections: EditorProps["sections"]; pay: { label: string; pct: number }[];
  totals: ReturnType<typeof computeQuoteTotals>; company: EditorProps["company"]; internal: boolean; hideUnitPrice: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {internal ? (
        <div className="text-xs font-bold rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200 inline-block self-start">
          🔒 هذه المعاينة الداخلية سرّية وتحتوي الكلفة وهامش الربح — غير مخصصة للعميل إطلاقاً
        </div>
      ) : (
        <div className="text-xs font-bold rounded-lg px-3 py-2 bg-[var(--brand-light)] text-[#6b4a1f] border border-[#e9d6b4] inline-block self-start">
          هذه هي النسخة التي سيراها العميل بالضبط
        </div>
      )}
      <div className="bg-white rounded-2xl border border-[var(--border)] p-8 relative overflow-hidden">
        {quote.status !== "APPROVED" && (
          <div
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center text-[110px] font-extrabold opacity-[0.07] rotate-[-25deg]"
            style={{ color: "var(--brand-dark)" }}
          >
            مسودة
          </div>
        )}
        <div className="relative flex items-start justify-between border-b-2 pb-4 mb-5 flex-wrap gap-3" style={{ borderColor: "var(--brand-dark)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold" style={{ background: "var(--brand-dark)" }}>بق</div>
            <div>
              <div className="font-extrabold">{company.name_ar}</div>
              <div className="text-[11px] text-[var(--foreground-muted)]">{company.address} · {company.phone} · {company.email}</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase">عرض سعر</div>
            <div className="font-extrabold tabular">{quote.number}</div>
            <div className="text-[11px] text-[var(--foreground-muted)] tabular">{quote.issue_date}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 text-xs mb-5">
          <div><div className="text-[var(--foreground-muted)] font-bold">العميل</div>{quote.client_name}</div>
          <div><div className="text-[var(--foreground-muted)] font-bold">المشروع</div>{quote.project_name}</div>
          <div><div className="text-[var(--foreground-muted)] font-bold">مدة التنفيذ</div>{quote.execution_duration || "—"}</div>
          <div><div className="text-[var(--foreground-muted)] font-bold">صالح حتى</div>{quote.valid_until || "—"}</div>
        </div>

        {quote.intro_text && <p className="text-sm mb-5">{quote.intro_text}</p>}

        {sections.filter((s) => s.items.some((i) => internal || !i.hidden_from_client)).map((s, si) => {
          const visibleItems = s.items.filter((i) => internal || !i.hidden_from_client);
          if (visibleItems.length === 0) return null;
          const st = computeQuoteTotals(visibleItems.map((it) => ({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price })), { type: "PERCENT", value: 0 }, false, 0, 0);
          return (
            <div key={s.id} className="mb-5">
              <div className="font-bold text-sm border-b border-[var(--border)] pb-1.5 mb-2">{si + 1}. {s.name}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                    <th className="text-right font-bold px-2 py-1.5">#</th>
                    <th className="text-right font-bold px-2 py-1.5">الفقرة</th>
                    <th className="text-right font-bold px-2 py-1.5">التفاصيل</th>
                    <th className="text-right font-bold px-2 py-1.5">الوحدة</th>
                    <th className="text-right font-bold px-2 py-1.5">الكمية</th>
                    {!hideUnitPrice && <th className="text-right font-bold px-2 py-1.5">سعر الوحدة</th>}
                    <th className="text-right font-bold px-2 py-1.5">المبلغ الإجمالي</th>
                    {internal && <th className="text-right font-bold px-2 py-1.5 bg-[var(--brand-light)]">الكلفة</th>}
                    {internal && <th className="text-right font-bold px-2 py-1.5 bg-[var(--brand-light)]">الربح</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((it, ii) => {
                    const c = computeItem({ id: it.id, qty: it.qty, unitCost: it.unit_cost, marginPct: it.margin_pct, manualUnitPrice: it.manual_unit_price });
                    return (
                      <tr key={it.id} className="border-b border-[var(--border)]">
                        <td className="px-2 py-1.5 tabular">{ii + 1}</td>
                        <td className="px-2 py-1.5">{it.name}{it.client_note && <div className="text-[10px] text-[var(--foreground-muted)]">{it.client_note}</div>}</td>
                        <td className="px-2 py-1.5 text-[var(--foreground-muted)]">{it.description}</td>
                        <td className="px-2 py-1.5">{it.unit}</td>
                        <td className="px-2 py-1.5 tabular">{fmt(it.qty)}</td>
                        {!hideUnitPrice && <td className="px-2 py-1.5 tabular">{fmt(c.unitPrice)}</td>}
                        <td className="px-2 py-1.5 tabular font-bold">{fmt(c.saleTotal)}</td>
                        {internal && <td className="px-2 py-1.5 tabular bg-[var(--brand-light)]/30">{fmt(c.costTotal)}</td>}
                        {internal && <td className="px-2 py-1.5 tabular bg-[var(--brand-light)]/30">{fmt(c.profitTotal)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-left text-xs mt-1 text-[var(--foreground-muted)]">مجموع القسم: <b className="text-[var(--foreground)]">{fmt(st.sumSaleBeforeDiscount)}</b></div>
            </div>
          );
        })}

        <div className="rounded-xl p-4 mt-4 flex flex-col gap-1" style={{ background: "var(--brand-light)" }}>
          <Row l="المجموع قبل الخصم" v={fmt(totals.sumSaleBeforeDiscount)} />
          <Row l="الخصم" v={fmt(totals.discountAmount)} />
          {totals.taxAmount > 0 && <Row l="الضريبة" v={fmt(totals.taxAmount)} />}
          <Row l="المبلغ النهائي" v={`${fmt(totals.finalTotal)} ${quote.currency === "IQD" ? "د.ع" : quote.currency}`} big />
          <div className="text-xs mt-1">{amountToArabicWords(totals.finalTotal)}</div>
          {internal && <Row l="الربح المتوقع" v={fmt(totals.profitAfterDiscount)} good />}
        </div>

        <div className="mt-5">
          <div className="font-bold text-sm mb-2">نظام الدفعات</div>
          <table className="w-full text-xs">
            <thead><tr className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]"><th className="text-right px-2 py-1.5 font-bold">الدفعة</th><th className="text-right px-2 py-1.5 font-bold">النسبة</th><th className="text-right px-2 py-1.5 font-bold">المبلغ</th></tr></thead>
            <tbody>
              {pay.map((p, i) => (
                <tr key={i} className="border-b border-[var(--border)]"><td className="px-2 py-1.5">{p.label}</td><td className="px-2 py-1.5 tabular">{p.pct}%</td><td className="px-2 py-1.5 tabular font-bold">{fmt(totals.finalTotal * p.pct / 100)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {quote.outro_text && <p className="text-sm mt-5">{quote.outro_text}</p>}

        <div className="grid sm:grid-cols-2 gap-6 mt-10 pt-6 border-t border-[var(--border)] text-xs text-center">
          <div className="border-t border-[var(--foreground-muted)] pt-2 mx-6">توقيع وختم الطرف الأول (بيت القصيد)</div>
          <div className="border-t border-[var(--foreground-muted)] pt-2 mx-6">توقيع الطرف الثاني (العميل)</div>
        </div>
      </div>
    </div>
  );
}

function AuditTab({ auditLog }: { auditLog: EditorProps["auditLog"] }) {
  const ACTION_LABEL: Record<string, string> = {
    CREATED: "إنشاء عرض السعر", PRICE_EDITED: "تعديل تسعير", SENT_FOR_REVIEW: "إرسال للمراجعة",
    RETURNED_FOR_REVISION: "إعادة للتعديل", APPROVED: "اعتماد", APPROVAL_CANCELLED: "إلغاء اعتماد",
    CANCELLED: "إلغاء عرض السعر", EXPORTED: "تصدير نسخة نهائية",
  };
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
      {auditLog.length === 0 ? (
        <div className="px-4 py-8 text-sm text-center text-[var(--foreground-muted)]">لا توجد أحداث بعد</div>
      ) : (
        auditLog.map((a) => (
          <div key={a.id} className="px-4 py-3 border-b border-[var(--border)] last:border-0 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold">{ACTION_LABEL[a.action] || a.action}</div>
              {a.note && <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{a.note}</div>}
            </div>
            <div className="text-left flex-none">
              <div className="text-xs font-bold">{a.user_name || "—"}</div>
              <div className="text-[10.5px] text-[var(--foreground-muted)] tabular">{a.created_at}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
