import { NextRequest, NextResponse } from "next/server";
import { createDesignRequest, recentPublicCountByIp } from "@/lib/repo/designRequests";
import { GOVERNORATES, normalizePhone } from "@/lib/design/questions";
import { clientIp } from "@/lib/design/flow";

// بداية طلب من الرابط العام (المجيب الآلي): يُنشئ مسودة ويعيد رمزها السري.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // حقل خفي لا يملؤه إلا برنامج آلي
  if (b.website) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const name = String(b.name || "").trim().slice(0, 80);
  const phone = normalizePhone(String(b.phone || ""));
  const governorate = String(b.governorate || "");
  if (name.length < 3) return NextResponse.json({ error: "اكتب الاسم الكامل" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "رقم الهاتف غير صحيح. اكتبه بصيغة 07XXXXXXXXX" }, { status: 400 });
  if (!GOVERNORATES.includes(governorate)) return NextResponse.json({ error: "اختر المحافظة" }, { status: 400 });
  if (b.ack !== true) return NextResponse.json({ error: "يجب الموافقة على آلية العمل" }, { status: 400 });

  const ip = clientIp(req);
  if (ip && (await recentPublicCountByIp(ip)) >= 5)
    return NextResponse.json({ error: "تجاوزت عدد الطلبات المسموح. حاول بعد ساعة." }, { status: 429 });

  const r = await createDesignRequest({ source: "PUBLIC", name, phone, governorate, ip });
  return NextResponse.json({ token: r.token });
}
