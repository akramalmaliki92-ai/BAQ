"use client";

import { useState } from "react";

// زر نسخ رابط الزبون (الرابط العام لنسخة العرض من النموذج)
export default function ShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.origin + path;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("انسخ الرابط:", url);
        }
      }}
      className="rounded-xl border border-[var(--border)] font-bold text-sm px-4 py-2.5 hover:bg-[var(--surface-muted)]"
    >
      {copied ? "نُسخ رابط الزبون ✓" : "نسخ رابط الزبون"}
    </button>
  );
}
