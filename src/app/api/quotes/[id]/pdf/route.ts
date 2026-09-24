import { NextRequest, NextResponse } from "next/server";
import { requireUser, apiErrorResponse } from "@/lib/auth/guard";
import { getQuote, getSectionsWithItems, getPayments, getOverheadCosts, recordExport } from "@/lib/repo/quotes";
import { getCompanySettings } from "@/lib/repo/settings";
import { buildQuoteHtml } from "@/lib/pdf/buildQuoteHtml";

// تصدير PDF عبر خدمة سحابية جاهزة (api2pdf.com) بدل تشغيل متصفح Chromium محلياً — هذا يزيل
// الاعتماد الكامل على تثبيت متصفح على الخادم (وهو ما سبّب كل مشاكل التصدير على الأجهزة المحلية)،
// ويجعل التصدير يعمل بشكل مطابق على أي بيئة استضافة بلا أي إعداد إضافي، طالما ضُبط متغيّر البيئة
// API2PDF_API_KEY. نفس الخدمة والمفتاح المستخدمان أصلاً في سير عمل "07 - PDF Report Generator" في n8n.
const API2PDF_URL = "https://v2.api2pdf.com/chrome/pdf/html";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const quote = await getQuote(id);
    if (!quote) return NextResponse.json({ error: "عرض السعر غير موجود" }, { status: 404 });

    const sections = await getSectionsWithItems(id);
    const payments = await getPayments(id);
    const company = await getCompanySettings();
    // مصاريف المشروع الداخلية تُجلب وتُمرَّر فقط عند تفعيل خيار توزيعها على الكلفة، بحيث يعكس
    // هذا الـPDF نفس السعر النهائي المرفوع الذي يراه المستخدم في واجهة المحرر.
    const overheadCosts = quote.distribute_overhead ? await getOverheadCosts(id) : [];
    const html = buildQuoteHtml(quote, sections, payments, company, overheadCosts);

    const apiKey = process.env.API2PDF_API_KEY;
    if (!apiKey) {
      throw new Error("متغيّر البيئة API2PDF_API_KEY غير مضبوط — لا يمكن تصدير PDF بدونه.");
    }

    const genRes = await fetch(API2PDF_URL, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        inlinePdf: false,
        fileName: `${quote.number}.pdf`,
        options: {
          printBackground: true,
          // api2pdf (وPuppeteer تحتها) تتوقع قيم الهوامش كنصوص تحمل وحدة قياس (px/in/mm)، وليس أرقاماً
          // مجردة. إرسالها كأرقام خام كان يُنتج هوامش غير صالحة يُفسّرها Chrome كصفحة بلا مساحة طباعة
          // ("content area is empty"), وهو ما كان يفشّل كل عملية تصدير.
          marginTop: "16px",
          marginBottom: "18px",
          marginLeft: "12px",
          marginRight: "12px",
        },
      }),
    });
    if (!genRes.ok) {
      const bodyText = await genRes.text().catch(() => "");
      console.error("api2pdf error", genRes.status, bodyText);
      throw new Error(`فشل توليد PDF من خدمة api2pdf (رمز ${genRes.status}): ${bodyText.slice(0, 500)}`);
    }
    const genJson = (await genRes.json()) as { FileUrl?: string; Success?: boolean; Error?: string };
    if (!genJson.FileUrl) {
      throw new Error(genJson.Error || "خدمة api2pdf لم تُرجع رابط الملف");
    }

    const fileRes = await fetch(genJson.FileUrl);
    if (!fileRes.ok) {
      throw new Error("تعذّر تنزيل ملف PDF الناتج");
    }
    const pdf = await fileRes.arrayBuffer();

    await recordExportSafe(id, user.id, "تصدير نسخة PDF");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
      },
    });
  } catch (e) {
    return apiErrorResponse(e);
  }
}

async function recordExportSafe(quoteId: string, userId: string, note: string) {
  try {
    await recordExport(quoteId, userId, note);
  } catch {
    // لا نفشل تصدير الـPDF بسبب خطأ في تسجيل السجل الزمني
  }
}
