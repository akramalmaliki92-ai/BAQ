import { NextRequest, NextResponse } from "next/server";
import { getModelByToken, getVersionJs } from "@/lib/repo/models";
import { getProject } from "@/lib/repo/projects";
import { getCompanySettings } from "@/lib/repo/settings";
import { VIEWER_HEADERS } from "@/lib/model/buildViewerHtml";
import { buildShellHtml } from "@/lib/model/buildShellHtml";

// رابط الزبون: عام بلا تسجيل دخول، يعرض المشروع داخل العارض الموحّد (شعار الشركة وهويتها وأزرار ثابتة)
// بلا الملاحظات الداخلية وأدوات التعديل. الرمز عشوائي بطول 32 حرفاً ولا يكشف أي بيانات أخرى من الموقع.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const m = await getModelByToken(token);
  const scene = m?.scene || "engine";
  const js = m && scene === "engine" ? await getVersionJs(m.id) : undefined;
  if (!m || (scene === "engine" && !js))
    return new NextResponse("الرابط غير صالح", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const [project, company] = await Promise.all([getProject(m.project_id), getCompanySettings()]);
  const html = buildShellHtml(
    {
      projectName: project?.name || "مشروع",
      clientName: project?.client_name,
      location: project?.location,
      phone: company.phone,
      website: company.website,
      companyName: company.name_ar,
    },
    scene,
    js
  );
  return new NextResponse(html, { headers: VIEWER_HEADERS });
}
