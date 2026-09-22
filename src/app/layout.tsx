import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسعّر بيت القصيد",
  description: "تسعير التندرات وعروض الأسعار — بيت القصيد",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
