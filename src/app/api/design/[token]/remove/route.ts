import { NextRequest, NextResponse } from "next/server";
import { getDesignRequestByToken, removeFile } from "@/lib/repo/designRequests";

// إزالة صورة من الطلب (تبقى نسختها في Drive)
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getDesignRequestByToken(token);
  if (!r) return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
  if (r.status !== "DRAFT") return NextResponse.json({ error: "أُرسل الطلب مسبقاً" }, { status: 409 });
  const b = (await req.json().catch(() => ({}))) as { fileId?: string };
  if (b.fileId) await removeFile(r.id, String(b.fileId));
  return NextResponse.json({ ok: true });
}
