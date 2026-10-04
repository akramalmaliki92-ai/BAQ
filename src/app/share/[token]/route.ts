import { NextRequest, NextResponse } from "next/server";
import { getModelByToken, getVersionJs } from "@/lib/repo/models";
import { buildViewerHtml, VIEWER_HEADERS } from "@/lib/model/buildViewerHtml";

// رابط الزبون: عام بلا تسجيل دخول، يعرض آخر نسخة بوضع «الزبون» (بلا الملاحظات الداخلية وأدوات التعديل).
// الرمز عشوائي بطول 32 حرفاً ولا يكشف أي بيانات أخرى من الموقع.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const m = await getModelByToken(token);
  const js = m ? await getVersionJs(m.id) : undefined;
  if (!js) return new NextResponse("الرابط غير صالح", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new NextResponse(buildViewerHtml(js, true), { headers: VIEWER_HEADERS });
}
