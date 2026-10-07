import type { Metadata } from "next";
import { getDesignRequestByToken, parseAnswers, parseFiles } from "@/lib/repo/designRequests";
import DesignForm from "../design-form";

export const metadata: Metadata = {
  title: "استبيان التصميم المعماري — بيت القصيد",
  robots: { index: false },
};

// رابط طلب محدد (مسودة يكملها الزبون، أو رابط خاص أُنشئ من صفحة المشروع)
export default async function DesignTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getDesignRequestByToken(token);
  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap" rel="stylesheet" />
    </>
  );
  const box = (title: string, text: string) => (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24, background: "#f6e7d2", borderRadius: 20, color: "#3b3026", textAlign: "center", fontFamily: "Almarai, Cairo, sans-serif" }}>
      {fonts}
      <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
  if (!r) return box("الرابط غير صالح", "تأكد من الرابط، أو تواصل مع بيت القصيد للحصول على رابط جديد.");
  if (r.status === "SUBMITTED") return box("وصلنا طلبك", "سيتواصل معك فريق التصميم في بيت القصيد قريباً.");
  return (
    <>
      {fonts}
      <DesignForm token={r.token} greetName={r.name || undefined} phone={r.phone} initialAnswers={parseAnswers(r)} initialFiles={parseFiles(r)} />
    </>
  );
}
