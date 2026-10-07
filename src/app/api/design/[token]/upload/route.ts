import { NextRequest, NextResponse } from "next/server";
import { getDesignRequestByToken, appendFile, parseFiles } from "@/lib/repo/designRequests";
import { FILE_KINDS, type FileKind } from "@/lib/design/questions";
import { ensureFolder } from "@/lib/design/flow";
import { uploadToDrive } from "@/lib/design/n8n";

export const maxDuration = 60;

const MAX_FILES = 20;
const MAX_BYTES = 3 * 1024 * 1024; // بعد التصغير في هاتف الزبون تكون الصورة عادة أقل من 1MB
const MIMES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

// رفع صورة: تُرسل إلى Drive عبر n8n، ويُحفظ رابطها وصورة مصغّرة صغيرة
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getDesignRequestByToken(token);
  if (!r) return NextResponse.json({ error: "الرابط غير صالح" }, { status: 404 });
  if (r.status !== "DRAFT") return NextResponse.json({ error: "أُرسل الطلب مسبقاً" }, { status: 409 });
  if (parseFiles(r).length >= MAX_FILES) return NextResponse.json({ error: `الحد الأقصى ${MAX_FILES} صورة` }, { status: 400 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = String(b.kind || "") as FileKind;
  const mime = String(b.mime || "");
  const b64 = String(b.b64 || "");
  const thumb = String(b.thumb || "");
  if (!FILE_KINDS.some((k) => k.kind === kind)) return NextResponse.json({ error: "نوع غير معروف" }, { status: 400 });
  if (!MIMES.has(mime)) return NextResponse.json({ error: "يُقبل فقط الصور أو PDF" }, { status: 400 });
  if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return NextResponse.json({ error: "ملف تالف" }, { status: 400 });
  if (b64.length * 0.75 > MAX_BYTES) return NextResponse.json({ error: "الملف أكبر من 3MB" }, { status: 413 });
  const safeThumb = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(thumb) && thumb.length < 60000 ? thumb : "";

  const label = FILE_KINDS.find((k) => k.kind === kind)!.label;
  const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1].replace("jpeg", "jpg");
  const filename = `${label} ${parseFiles(r).filter((f) => f.kind === kind).length + 1}.${ext}`;

  try {
    const folderId = await ensureFolder(r);
    const up = await uploadToDrive(folderId, filename, mime, b64);
    const file = { kind, name: filename, fileId: up.fileId, link: up.link, thumb: safeThumb, at: new Date().toISOString() };
    await appendFile(r.id, file);
    return NextResponse.json({ file });
  } catch (e) {
    console.error("design upload failed", e);
    return NextResponse.json({ error: "تعذّر رفع الصورة. حاول مرة أخرى." }, { status: 502 });
  }
}
