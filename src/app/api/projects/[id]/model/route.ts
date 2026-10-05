import { NextRequest, NextResponse } from "next/server";
import { requireUser, apiErrorResponse } from "@/lib/auth/guard";
import { getProjectModel, getVersionJs } from "@/lib/repo/models";
import { buildViewerHtml, VIEWER_HEADERS } from "@/lib/model/buildViewerHtml";
import { buildShellHtml } from "@/lib/model/buildShellHtml";
import { getProject } from "@/lib/repo/projects";
import { getCompanySettings } from "@/lib/repo/settings";

// نسخة الفريق من النموذج ثلاثي الأبعاد (آخر نسخة، أو ?v=رقم النسخة). تتطلب تسجيل الدخول.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const m = await getProjectModel(id);
    if (!m) return NextResponse.json({ error: "لا يوجد نموذج لهذا المشروع" }, { status: 404 });
    // المشاهد المخصصة (غير المحرك العام) تُعرض في العارض الموحّد نفسه الذي يراه الزبون
    if (m.scene && m.scene !== "engine") {
      const [project, company] = await Promise.all([getProject(id), getCompanySettings()]);
      const html = buildShellHtml(
        { projectName: project?.name || "مشروع", clientName: project?.client_name, location: project?.location, phone: company.phone, website: company.website, companyName: company.name_ar },
        m.scene
      );
      return new NextResponse(html, { headers: VIEWER_HEADERS });
    }
    const v = Number(req.nextUrl.searchParams.get("v")) || undefined;
    const js = await getVersionJs(m.id, v);
    if (!js) return NextResponse.json({ error: "النسخة غير موجودة" }, { status: 404 });
    return new NextResponse(buildViewerHtml(js, false), { headers: VIEWER_HEADERS });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
