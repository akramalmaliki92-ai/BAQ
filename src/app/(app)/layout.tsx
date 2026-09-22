import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { roleLabel } from "@/lib/auth/types";
import { logoutAction } from "./actions";
import NavLinks from "./nav-links";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="بيت القصيد" className="h-10 w-auto flex-none" />
            <div>
              <div className="font-extrabold text-sm leading-tight">مسعّر بيت القصيد</div>
              <div className="text-[11px] text-[var(--foreground-muted)] leading-tight">
                إدارة التندرات وعروض الأسعار
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold leading-tight">{user.name}</div>
              <div className="text-[11px] text-[var(--foreground-muted)] leading-tight">
                {roleLabel(user.role)}
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-bold rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-muted)]"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4">
          <NavLinks role={user.role} />
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
