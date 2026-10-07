import type { Metadata } from "next";
import DesignForm from "./design-form";

export const metadata: Metadata = {
  title: "استبيان التصميم المعماري — بيت القصيد",
  description: "أجب عن أسئلة قصيرة ليبدأ فريق بيت القصيد تصميم بيتك.",
};

// الرابط العام الثابت (للمجيب الآلي والصفحات): لا يحتاج تسجيل دخول
export default function PublicDesignPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap" rel="stylesheet" />
      <DesignForm />
    </>
  );
}
