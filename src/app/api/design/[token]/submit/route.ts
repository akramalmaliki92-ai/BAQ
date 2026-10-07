import { NextRequest, NextResponse } from "next/server";
import { getDesignRequestByToken, saveDraft } from "@/lib/repo/designRequests";
import { submitRequest, siteOrigin } from "@/lib/design/flow";
import { sanitizeAnswers } from "@/lib/design/questions";

export const maxDuration = 60;

// الإرسال النهائي: يتحقق من الأجوبة، ثم (للرابط العام) ينشئ العميل والمشروع، ثم ينبّه عبر تيليجرام
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let r = await getDesignRequestByToken(token);
  if (!r) return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { answers?: Record<string, unknown> };
  if (b.answers && r.status === "DRAFT") {
    await saveDraft(r.id, { answers: sanitizeAnswers(b.answers) });
    r = (await getDesignRequestByToken(token))!;
  }
  const res = await submitRequest(r, siteOrigin(req));
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
