import { NextRequest, NextResponse } from "next/server";
import { requireUser, apiErrorResponse } from "@/lib/auth/guard";
import { getProjectModel, getVersionJs } from "@/lib/repo/models";
import { buildViewerHtml, VIEWER_HEADERS } from "@/lib/model/buildViewerHtml";

// نسخة الفريق من النموذج ثلاثي الأبعاد (آخر نسخة، أو ?v=رقم النسخة). تتطلب تسجيل الدخول.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const m = await getProjectModel(id);
    if (!m) return NextResponse.json({ error: "لا يوجد نموذج لهذا المشروع" }, { status: 404 });
    const v = Number(req.nextUrl.searchParams.get("v")) || undefined;
    const js = await getVersionJs(m.id, v);
    if (!js) return NextResponse.json({ error: "النسخة غير موجودة" }, { status: 404 });
    return new NextResponse(buildViewerHtml(js, false), { headers: VIEWER_HEADERS });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
