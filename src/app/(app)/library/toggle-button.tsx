"use client";

import { useTransition } from "react";
import { toggleLibraryItemAction } from "./actions";

export default function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleLibraryItemAction(id, !active))}
      className="text-xs font-bold px-2.5 py-1 rounded-full border disabled:opacity-50"
      style={
        active
          ? { color: "#2f7d4f", borderColor: "#2f7d4f", background: "#e3efe7" }
          : { color: "#8a8a8a", borderColor: "#d0d0d0", background: "#f2f2f2" }
      }
      title={active ? "تعطيل الفقرة" : "تفعيل الفقرة"}
    >
      {active ? "فعّالة" : "معطّلة"}
    </button>
  );
}
