import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6 text-center">
      <div className="text-5xl">🚫</div>
      <h1 className="text-xl font-extrabold">لا تملك صلاحية الوصول إلى هذه الصفحة</h1>
      <p className="text-[var(--foreground-muted)] text-sm">
        إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول النظام.
      </p>
      <Link href="/dashboard" className="mt-2 text-sm font-bold" style={{ color: "var(--brand-dark)" }}>
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
