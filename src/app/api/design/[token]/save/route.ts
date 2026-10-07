import { NextRequest, NextResponse } from "next/server";
import { getDesignRequestByToken, saveDraft } from "@/lib/repo/designRequests";
import { sanitizeAnswers } from "@/lib/design/questions";

// حفظ تلقائي لأجوبة المسودة
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getDesignRequestByToken(token);
  if (!r) return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
  if (r.status !== "DRAFT") return NextResponse.json({ error: "أُرسل الطلب مسبقاً" }, { status: 409 });
  const b = (await req.json().catch(() => ({}))) as { answers?: Record<string, unknown> };
  await saveDraft(r.id, { answers: sanitizeAnswers(b.answers) });
  return NextResponse.json({ ok: true });
}
