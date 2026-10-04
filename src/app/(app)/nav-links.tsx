"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/types";

interface Item {
  href: string;
  label: string;
  roles?: Role[];
}

const ITEMS: Item[] = [
  { href: "/dashboard", label: "لوحة التحكم" },
  // بترتيب خطوات العمل: المخطط ← الزبون ← المشروع ← الفقرات ← العرض ← العقد
  { href: "/plans", label: "١ · مكتبة المخططات" },
  { href: "/clients", label: "٢ · العملاء" },
  { href: "/projects", label: "٣ · المشاريع" },
  { href: "/library", label: "٤ · مكتبة الفقرات" },
  { href: "/quotes", label: "٥ · عروض الأسعار" },
  { href: "/contracts", label: "٦ · العقود" },
  { href: "/users", label: "المستخدمون", roles: ["ADMIN"] },
  { href: "/settings", label: "إعدادات الشركة", roles: ["ADMIN"] },
];

export default function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap text-sm font-bold px-3.5 py-2 rounded-t-lg border-b-2 transition"
            style={{
              borderColor: active ? "var(--brand-dark)" : "transparent",
              color: active ? "var(--brand-dark)" : "var(--foreground-muted)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
