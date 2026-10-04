import { NextRequest, NextResponse } from "next/server";
import { requireUser, apiErrorResponse } from "@/lib/auth/guard";
import { getPlanModelJs } from "@/lib/repo/models";
import { buildViewerHtml, VIEWER_HEADERS } from "@/lib/model/buildViewerHtml";

// عرض مخطط من المكتبة بنسخة العرض (بلا أدوات التعديل)، للفريق المسجّل فقط.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const js = await getPlanModelJs(id);
    if (!js) return NextResponse.json({ error: "المخطط غير موجود" }, { status: 404 });
    return new NextResponse(buildViewerHtml(js, true), { headers: VIEWER_HEADERS });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
