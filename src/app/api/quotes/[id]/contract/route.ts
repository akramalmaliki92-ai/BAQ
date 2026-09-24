import { NextRequest, NextResponse } from "next/server";
import { requireUser, apiErrorResponse, ApiError } from "@/lib/auth/guard";
import { getQuote, getSectionsWithItems, getPayments, getOverheadCosts, recordExport } from "@/lib/repo/quotes";
import { getCompanySettings } from "@/lib/repo/settings";
import { getClient } from "@/lib/repo/clients";
import { buildContractHtml, buildContractNumber } from "@/lib/pdf/buildContractHtml";

// تحويل عرض سعر مُعتمد إلى عقد عمل جاهز للتقديم — يعتمد نفس آلية تصدير الـPDF عبر api2pdf.com
// المستخدمة في مسار /api/quotes/[id]/pdf، لكنه يرفض أي عرض سعر لم يُعتمد بعد (status !== APPROVED)
// لأن العقد وثيقة تعاقدية يجب ألا تُصدَر قبل اكتمال الاعتماد الداخلي على السعر والشروط.
const API2PDF_URL = "https://v2.api2pdf.com/chrome/pdf/html";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const quote = await getQuote(id);
    if (!quote) return NextResponse.json({ error: "عرض السعر غير موجود" }, { status: 404 });
    if (quote.status !== "APPROVED") {
      throw new ApiError(400, "يجب اعتماد عرض السعر أولاً قبل تحويله إلى عقد عمل");
    }

    const sections = await getSectionsWithItems(id);
    const payments = await getPayments(id);
    const company = await getCompanySettings();
    const client = await getClient(quote.client_id);
    // مصاريف المشروع الداخلية تُجلب فقط عند تفعيل خيار توزيعها، بحيث تنعكس فعلياً على قيمة العقد
    // تماماً كما في عرض السعر وواجهة المحرر عند تفعيل نفس الخيار.
    const overheadCosts = quote.distribute_overhead ? await getOverheadCosts(id) : [];
    const html = buildContractHtml(quote, sections, payments, company, client, overheadCosts);

    const apiKey = process.env.API2PDF_API_KEY;
    if (!apiKey) {
      throw new Error("متغيّر البيئة API2PDF_API_KEY غير مضبوط — لا يمكن تصدير العقد بدونه.");
    }

    const contractNumber = buildContractNumber(quote.number);

    const genRes = await fetch(API2PDF_URL, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        inlinePdf: false,
        fileName: `${contractNumber}.pdf`,
        options: {
          printBackground: true,
          marginTop: "16px",
          marginBottom: "18px",
          marginLeft: "12px",
          marginRight: "12px",
        },
      }),
    });
    if (!genRes.ok) {
      const bodyText = await genRes.text().catch(() => "");
      console.error("api2pdf contract error", genRes.status, bodyText);
      throw new Error(`فشل توليد ملف العقد من خدمة api2pdf (رمز ${genRes.status}): ${bodyText.slice(0, 500)}`);
    }
    const genJson = (await genRes.json()) as { FileUrl?: string; Success?: boolean; Error?: string };
    if (!genJson.FileUrl) {
      throw new Error(genJson.Error || "خدمة api2pdf لم تُرجع رابط ملف العقد");
    }

    const fileRes = await fetch(genJson.FileUrl);
    if (!fileRes.ok) {
      throw new Error("تعذّر تنزيل ملف العقد الناتج");
    }
    const pdf = await fileRes.arrayBuffer();

    await recordExportSafe(id, user.id, "تحويل إلى عقد عمل وتصديره PDF");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${contractNumber}.pdf"`,
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
    // لا نفشل تصدير العقد بسبب خطأ في تسجيل السجل الزمني
  }
}
