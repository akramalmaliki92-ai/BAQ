"use client";

import { useState, useTransition } from "react";
import { setSealAction } from "./actions";

type Kind = "signature" | "stamp";

// يصغّر الصورة داخل المتصفح (أقصى بُعد 600 بكسل) ويحفظها PNG للإبقاء على الخلفية الشفافة
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذّرت قراءة الملف"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("الملف ليس صورة صالحة"));
      img.onload = () => {
        const scale = Math.min(1, 600 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("تعذّرت معالجة الصورة"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function SealForm({ hasSignature, hasStamp }: { hasSignature: boolean; hasStamp: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<Record<Kind, string | null>>({ signature: null, stamp: null });

  function upload(kind: Kind, file: File | undefined) {
    if (!file) return;
    setMsg(null);
    start(async () => {
      try {
        const dataUrl = await shrink(file);
        const res = await setSealAction(kind, dataUrl);
        if (res.error) return setMsg({ text: res.error });
        setPreview((p) => ({ ...p, [kind]: dataUrl }));
        setMsg({ ok: true, text: kind === "signature" ? "✓ حُفظ التوقيع" : "✓ حُفظ الختم" });
      } catch (e) {
        setMsg({ text: e instanceof Error ? e.message : "تعذّر الرفع" });
      }
    });
  }

  function remove(kind: Kind) {
    if (!confirm(kind === "signature" ? "حذف صورة التوقيع؟" : "حذف صورة الختم؟")) return;
    start(async () => {
      const res = await setSealAction(kind, null);
      if (res.error) return setMsg({ text: res.error });
      setPreview((p) => ({ ...p, [kind]: null }));
      setMsg({ ok: true, text: "✓ حُذفت الصورة" });
    });
  }

  const card = (kind: Kind, label: string, saved: boolean) => (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold text-[var(--foreground-muted)]">{label}</div>
      <div className="h-28 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--surface-muted)]">
        {preview[kind] ? (
          <img src={preview[kind]!} alt={label} className="max-h-24 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-[var(--foreground-muted)]">{saved ? "✓ مرفوعة ومحفوظة" : "لم تُرفع بعد"}</span>
        )}
      </div>
      <div className="flex gap-2">
        <label className="rounded-xl text-white font-bold text-xs px-3 py-2 cursor-pointer" style={{ background: "var(--brand-dark)" }}>
          {saved || preview[kind] ? "استبدال" : "رفع صورة"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={pending}
            onChange={(e) => { upload(kind, e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {(saved || preview[kind]) && (
          <button type="button" onClick={() => remove(kind)} disabled={pending}
            className="rounded-xl border border-[var(--border)] font-bold text-xs px-3 py-2">حذف</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
      <div>
        <div className="font-extrabold text-sm">التوقيع والختم</div>
        <div className="text-xs text-[var(--foreground-muted)] mt-1">
          تُطبعان في خانة الطرف الأول عند الضغط على «عرض موقّع ومختوم» أو «عقد موقّع ومختوم». يُفضَّل صورة بخلفية شفافة أو بيضاء نظيفة.
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {card("signature", "صورة التوقيع", hasSignature)}
        {card("stamp", "صورة الختم", hasStamp)}
      </div>
      {pending && <div className="text-xs text-[var(--foreground-muted)]">جارٍ الحفظ...</div>}
      {msg && <div className={`text-sm font-bold ${msg.ok ? "text-[#2f7d4f]" : "text-red-700"}`}>{msg.text}</div>}
    </div>
  );
}
