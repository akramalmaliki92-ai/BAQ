"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: "var(--brand-light)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow"
            style={{ background: "var(--brand-dark)" }}
          >
            بق
          </div>
          <div className="text-center">
            <div className="font-extrabold text-xl text-[var(--foreground)]">مسعّر بيت القصيد</div>
            <div className="text-sm text-[var(--foreground-muted)]">تسجيل الدخول للمتابعة</div>
          </div>
        </div>

        <form action={formAction} className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-1.5 text-[var(--foreground-muted)]">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: "var(--brand-dark)" }}
              placeholder="name@baytalqasid.iq"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-1.5 text-[var(--foreground-muted)]">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: "var(--brand-dark)" }}
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-xl text-white font-bold py-2.5 text-sm disabled:opacity-60 transition"
            style={{ background: "var(--brand-dark)" }}
          >
            {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[var(--foreground-muted)]">
          حسابات تجريبية: admin@baq.local · manager@baq.local · preparer@baq.local — كلمة المرور: 123456
        </div>
      </div>
    </div>
  );
}
