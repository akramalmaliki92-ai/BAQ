"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  STEPS,
  FILE_KINDS,
  GOVERNORATES,
  type Answers,
  type Choice,
  type FileKind,
  type Question,
  type StoredFile,
  labelOf,
  num,
  normalizePhone,
} from "@/lib/design/questions";

const C = { green: "#71826d", greenDark: "#5d6c59", greenSoft: "#e7ece5", beige: "#f6e7d2", line: "#e3d3bc", orange: "#ef9c3d", brown: "#3b3026", muted: "#7a6a5a" };

interface Props {
  token?: string;
  greetName?: string;
  initialAnswers?: Answers;
  initialFiles?: StoredFile[];
  phone?: string;
}

type Pending = { id: string; kind: FileKind; preview: string; error?: string };

export default function DesignForm({ token: initialToken, greetName, initialAnswers, initialFiles, phone }: Props) {
  const isPublic = !initialToken;
  const [token, setToken] = useState(initialToken || "");
  const [step, setStep] = useState(0); // 0 ترحيب، ثم خطوات الأسئلة، ثم الصور، ثم المراجعة، ثم تم
  const [answers, setAnswers] = useState<Answers>(initialAnswers || {});
  const [files, setFiles] = useState<StoredFile[]>(initialFiles || []);
  const [pending, setPending] = useState<Pending[]>([]);
  const [who, setWho] = useState({ name: "", phone: "", governorate: GOVERNORATES[0], website: "" });
  const [ack, setAck] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<"" | "saving" | "saved" | "error">("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const topRef = useRef<HTMLDivElement>(null);

  const totalSteps = STEPS.length + 1; // خطوات الأسئلة + الصور
  const PHOTOS = STEPS.length + 1, REVIEW = STEPS.length + 2, DONE = STEPS.length + 3;

  const go = (n: number) => {
    setErr("");
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // حفظ تلقائي بعد كل تغيير بنصف ثانية تقريباً
  const scheduleSave = useCallback(
    (next: Answers) => {
      if (!token) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaved("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/design/${token}/save`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: next }) });
          setSaved(res.ok ? "saved" : "error");
        } catch {
          setSaved("error");
        }
      }, 700);
    },
    [token]
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const answersRef = useRef<Answers>(initialAnswers || {});
  const setAnswer = (k: string, v: string) => {
    const next = { ...answersRef.current, [k]: v };
    answersRef.current = next;
    setAnswers(next);
    scheduleSave(next);
    setErr("");
  };

  async function start() {
    setErr("");
    if (!ack) return setErr("وافق على آلية العمل للمتابعة.");
    if (!isPublic) return go(1);
    if (who.name.trim().length < 3) return setErr("اكتب الاسم الكامل.");
    if (!normalizePhone(who.phone)) return setErr("رقم الهاتف غير صحيح. اكتبه بصيغة 07XXXXXXXXX");
    if (token) return go(1);
    setBusy(true);
    try {
      const res = await fetch("/api/design/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...who, ack: true }) });
      const data = await res.json();
      if (!res.ok) return setErr(data.error || "تعذّر البدء. حاول مرة أخرى.");
      setToken(data.token);
      window.history.replaceState(null, "", `/design/${data.token}`);
      go(1);
    } catch {
      setErr("تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  function stepMissing(i: number): Question | undefined {
    return STEPS[i].questions.find((q) => (q.kind === "dims" ? !(num(answers.plot_w) > 0 && num(answers.plot_d) > 0) : !answers[q.key]));
  }

  function next() {
    if (step >= 1 && step <= STEPS.length) {
      const m = stepMissing(step - 1);
      if (m) return setErr(`أجب عن السؤال ${m.no}: ${m.title}`);
    }
    go(step + 1);
  }

  // تصغير الصورة في الهاتف قبل الرفع (أقصى بُعد 2000 بكسل) + صورة مصغّرة للعرض
  async function prepare(file: File): Promise<{ b64: string; mime: string; thumb: string }> {
    if (file.type === "application/pdf") {
      if (file.size > 3 * 1024 * 1024) throw new Error("ملف PDF أكبر من 3MB");
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return { b64: btoa(bin), mime: "application/pdf", thumb: "" };
    }
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const draw = (max: number, q: number) => {
      const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * s);
      cv.height = Math.round(bmp.height * s);
      const ctx = cv.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/jpeg", q);
    };
    const full = draw(2000, 0.82);
    const thumb = draw(240, 0.6);
    return { b64: full.split(",")[1], mime: "image/jpeg", thumb };
  }

  function addFiles(kind: FileKind, list: FileList | null) {
    if (!list || !token) return;
    for (const file of Array.from(list)) {
      const id = Math.random().toString(36).slice(2);
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      setPending((p) => [...p, { id, kind, preview }]);
      // رفع متتابع (صورة بعد صورة) حتى لا يُثقل إنترنت الهاتف
      queue.current = queue.current.then(async () => {
        try {
          const prep = await prepare(file);
          const res = await fetch(`/api/design/${token}/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ...prep }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "تعذّر رفع الصورة");
          setFiles((f) => [...f, data.file]);
          setPending((p) => p.filter((x) => x.id !== id));
          if (preview) URL.revokeObjectURL(preview);
        } catch (e) {
          setPending((p) => p.map((x) => (x.id === id ? { ...x, error: e instanceof Error ? e.message : "تعذّر رفع الصورة" } : x)));
        }
      });
    }
  }

  async function removeStored(fileId: string) {
    setFiles((f) => f.filter((x) => x.fileId !== fileId));
    await fetch(`/api/design/${token}/remove`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileId }) }).catch(() => {});
  }

  async function submit() {
    if (pending.some((p) => !p.error)) return setErr("انتظر حتى يكتمل رفع الصور.");
    setBusy(true);
    setErr("");
    try {
      await queue.current;
      const res = await fetch(`/api/design/${token}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.missing?.length) return setErr(`بقيت أسئلة بلا إجابة: ${data.missing.join("، ")}`);
        return setErr(data.error || "تعذّر الإرسال. حاول مرة أخرى.");
      }
      go(DONE);
    } catch {
      setErr("تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  // ===== عناصر الواجهة =====
  const card = (on: boolean): React.CSSProperties => ({
    background: on ? C.greenSoft : "#fff",
    border: `1.5px solid ${on ? C.green : C.line}`,
    borderRadius: 12,
    padding: "10px 6px",
    textAlign: "center",
    fontSize: 14,
    fontWeight: on ? 700 : 400,
    color: C.brown,
    cursor: "pointer",
    width: "100%",
  });
  const input: React.CSSProperties = { width: "100%", background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "11px 12px", fontSize: 15, color: C.brown, outline: "none" };
  const btn = (bg = C.green): React.CSSProperties => ({ background: bg, color: "#fff", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 15, width: "100%", border: 0, cursor: "pointer", opacity: busy ? 0.6 : 1 });

  const header = (title: string, sub?: string) => (
    <div style={{ background: C.green, color: "#fff", padding: "14px 16px" }}>
      {step > 0 && step < DONE ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>{step <= totalSteps ? `${step} من ${totalSteps}` : "قبل الإرسال"}</span>
            <span style={{ fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ height: 6, background: C.greenDark, borderRadius: 3, marginTop: 8 }}>
            <i style={{ display: "block", height: 6, borderRadius: 3, background: C.orange, width: `${Math.min(100, (step / totalSteps) * 100)}%`, transition: "width .3s" }} />
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="بيت القصيد" style={{ height: 34, filter: "brightness(0) invert(1)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.9 }}>{sub}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const icon = (c: Choice) => {
    switch (c.icon) {
      case "kitchen-right":
      case "kitchen-left":
        return (
          <svg width="52" height="36" viewBox="0 0 44 30" aria-hidden="true">
            <rect x="1" y="1" width="42" height="28" fill="none" stroke={C.brown} />
            <rect x={c.icon === "kitchen-right" ? 24 : 2} y="2" width="18" height="12" fill={C.orange} />
            <rect x="16" y="27" width="12" height="3" fill={C.brown} />
          </svg>
        );
      case "style-modern":
        return (<svg width="72" height="42" viewBox="0 0 70 40" aria-hidden="true"><rect x="8" y="8" width="54" height="30" fill={C.green} /><rect x="30" y="2" width="32" height="10" fill={C.brown} /><rect x="14" y="16" width="20" height="8" fill={C.beige} /></svg>);
      case "style-classic":
        return (<svg width="72" height="42" viewBox="0 0 70 40" aria-hidden="true"><path d="M5 14 L35 2 L65 14 Z" fill={C.brown} /><rect x="10" y="14" width="50" height="24" fill={C.line} /><rect x="16" y="18" width="4" height="20" fill="#fff" /><rect x="50" y="18" width="4" height="20" fill="#fff" /><rect x="29" y="22" width="12" height="16" fill={C.green} /></svg>);
      case "style-neo":
        return (<svg width="72" height="42" viewBox="0 0 70 40" aria-hidden="true"><rect x="8" y="6" width="54" height="32" fill={C.beige} stroke={C.brown} /><rect x="8" y="4" width="54" height="4" fill={C.brown} /><rect x="14" y="14" width="10" height="14" fill={C.green} /><rect x="46" y="14" width="10" height="14" fill={C.green} /><rect x="30" y="20" width="10" height="18" fill={C.brown} /></svg>);
      case "style-heritage":
        return (<svg width="72" height="42" viewBox="0 0 70 40" aria-hidden="true"><rect x="8" y="6" width="54" height="32" fill={C.line} /><path d="M28 38 V24 A7 7 0 0 1 42 24 V38 Z" fill={C.green} /><rect x="12" y="12" width="12" height="14" fill={C.brown} /><rect x="46" y="12" width="12" height="14" fill={C.brown} /></svg>);
      default:
        return null;
    }
  };

  const renderQuestion = (q: Question) => (
    <div key={q.key} style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
        {q.no}. {q.title} {q.sub && <small style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({q.sub})</small>}
      </div>
      {q.kind === "dims" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ fontSize: 12, color: C.muted }}>
            العرض (م)
            <input style={{ ...input, marginTop: 4 }} inputMode="decimal" value={answers.plot_w || ""} onChange={(e) => setAnswer("plot_w", e.target.value.slice(0, 8))} placeholder="10" />
          </label>
          <label style={{ fontSize: 12, color: C.muted }}>
            العمق (م)
            <input style={{ ...input, marginTop: 4 }} inputMode="decimal" value={answers.plot_d || ""} onChange={(e) => setAnswer("plot_d", e.target.value.slice(0, 8))} placeholder="20" />
          </label>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${q.cols}, minmax(0, 1fr))`, gap: 8 }}>
          {q.choices.map((c) => {
            const on = answers[q.key] === c.v;
            return (
              <button key={c.v} type="button" onClick={() => setAnswer(q.key, c.v)} style={{ ...card(on), textAlign: c.hint ? "right" : "center", padding: c.hint ? "10px 12px" : card(on).padding }} aria-pressed={on}>
                {c.icon && <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{icon(c)}</div>}
                {c.hint ? (<><b>{c.label}</b><div style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>{c.hint}</div></>) : c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const errorBox = err ? <div role="alert" style={{ marginTop: 12, color: "#a3402f", fontSize: 13, fontWeight: 700 }}>{err}</div> : null;

  const nav = (label = "التالي", onClick = next, bg?: string) => (
    <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
      {step > 1 && step < DONE && (
        <button type="button" onClick={() => go(step - 1)} style={{ ...btn("#fff"), color: C.brown, border: `1.5px solid ${C.line}`, width: "35%", opacity: 1 }}>السابق</button>
      )}
      <button type="button" onClick={onClick} disabled={busy} style={btn(bg)}>{busy ? "لحظة…" : label}</button>
    </div>
  );

  let body: React.ReactNode;
  if (step === 0) {
    body = (
      <>
        {header("بيت القصيد", "استبيان التصميم المعماري")}
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{greetName ? `أهلاً ${greetName}` : "أهلاً بك"}</div>
          <p style={{ fontSize: 14, margin: "6px 0 0" }}>أجب عن أسئلة قصيرة لنبدأ تصميم بيتك. تستغرق نحو 4 دقائق.</p>
          <div style={{ fontWeight: 700, marginTop: 14 }}>آلية العمل</div>
          <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", fontSize: 14, marginTop: 6 }}>
            نصمم على مراحل، ولا ننتقل لمرحلة قبل موافقتك:
            <ol style={{ margin: "6px 0", paddingInlineStart: 22, listStyle: "decimal" }}>
              <li>الطابق الأرضي</li>
              <li>الطابق الأول</li>
              <li>الواجهة</li>
              <li>المخططات النهائية</li>
            </ol>
            <div style={{ marginTop: 8, background: C.orange, color: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700, textAlign: "center" }}>لا تفوّت عرض التصميم المجاني</div>
          </div>
          {isPublic && (
            <>
              <div style={{ fontWeight: 700, marginTop: 14 }}>بياناتك</div>
              <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                <input style={input} placeholder="الاسم الكامل" value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" />
                <input style={{ ...input, direction: "ltr", textAlign: "right" }} placeholder="07XXXXXXXXX" inputMode="tel" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" />
                <div style={{ fontSize: 12, color: C.muted }}>نعمل داخل محافظة البصرة.</div>
                <div aria-hidden="true" style={{ height: 0, overflow: "hidden" }}>
                  <input tabIndex={-1} autoComplete="off" value={who.website} onChange={(e) => setWho({ ...who, website: e.target.value })} name="website" />
                </div>
              </div>
            </>
          )}
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.green }} />
            اطلعت على آلية العمل وأوافق عليها
          </label>
          {errorBox}
          {nav("ابدأ", start)}
        </div>
      </>
    );
  } else if (step >= 1 && step <= STEPS.length) {
    const s = STEPS[step - 1];
    body = (
      <>
        {header(s.title)}
        <div style={{ padding: "4px 16px 16px" }}>
          {s.questions.map(renderQuestion)}
          {s.note && <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>{s.note}</div>}
          {errorBox}
          {nav()}
        </div>
      </>
    );
  } else if (step === PHOTOS) {
    body = (
      <>
        {header("الصور والملاحظات")}
        <div style={{ padding: "4px 16px 16px" }}>
          {FILE_KINDS.map((k) => {
            const mine = files.filter((f) => f.kind === k.kind);
            const pend = pending.filter((p) => p.kind === k.kind);
            return (
              <div key={k.kind} style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  {k.label} {k.optional && <small style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>(اختيارية)</small>}
                </div>
                {(mine.length > 0 || pend.length > 0) && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6, marginBottom: 8 }}>
                    {mine.map((f) => (
                      <div key={f.fileId} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: C.line }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {f.thumb ? <img src={f.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 11, padding: 6 }}>PDF</div>}
                        <button type="button" aria-label="إزالة" onClick={() => removeStored(f.fileId)} style={{ position: "absolute", top: 3, left: 3, width: 22, height: 22, borderRadius: 11, border: 0, background: "rgba(59,48,38,.75)", color: "#fff", fontSize: 13, lineHeight: "22px", cursor: "pointer" }}>×</button>
                      </div>
                    ))}
                    {pend.map((p) => (
                      <div key={p.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: C.line, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.preview && <img src={p.preview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }} />}
                        <span style={{ position: "relative", fontSize: 11, fontWeight: 700, color: p.error ? "#a3402f" : C.brown, textAlign: "center", padding: 4 }}>
                          {p.error ? "فشل" : "يُرفع…"}
                        </span>
                        {p.error && <button type="button" aria-label="إزالة" onClick={() => setPending((x) => x.filter((y) => y.id !== p.id))} style={{ position: "absolute", top: 3, left: 3, width: 22, height: 22, borderRadius: 11, border: 0, background: "rgba(59,48,38,.75)", color: "#fff", fontSize: 13, cursor: "pointer" }}>×</button>}
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ ...card(false), display: "block", borderStyle: "dashed", padding: 14 }}>
                  + صوّر أو ارفع {mine.length ? "صورة أخرى" : "الصورة"}
                  <input type="file" accept="image/*,application/pdf" multiple={k.kind !== "deed"} style={{ display: "none" }} onChange={(e) => { addFiles(k.kind, e.target.files); e.target.value = ""; }} />
                </label>
              </div>
            );
          })}
          {pending.some((p) => p.error) && <div style={{ fontSize: 12, color: "#a3402f", marginTop: 8 }}>تعذّر رفع بعض الصور. أزلها وأعد المحاولة.</div>}
          <div style={{ fontWeight: 700, fontSize: 15, margin: "16px 0 8px" }}>طلب خاص تريد أن يعرفه المصمم</div>
          <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={answers.notes || ""} onChange={(e) => setAnswer("notes", e.target.value.slice(0, 1500))} placeholder="اكتب ملاحظتك هنا" />
          {errorBox}
          {nav("مراجعة الطلب", () => go(REVIEW), C.orange)}
        </div>
      </>
    );
  } else if (step === REVIEW) {
    body = (
      <>
        {header("المراجعة")}
        <div style={{ padding: "4px 16px 16px" }}>
          <p style={{ fontSize: 13, color: C.muted }}>راجع أجوبتك، واضغط على أي خطوة لتعديلها.</p>
          {STEPS.map((s, i) => (
            <button key={s.title} type="button" onClick={() => go(i + 1)} style={{ ...card(false), textAlign: "right", padding: "10px 12px", marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
              {s.questions.map((q) => (
                <div key={q.key} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ color: C.muted }}>{q.title}</span>
                  <span style={{ fontWeight: 700 }}>
                    {q.kind === "dims" ? (num(answers.plot_w) && num(answers.plot_d) ? `${num(answers.plot_w)} × ${num(answers.plot_d)} م` : "—") : labelOf(q.key, answers[q.key]) || "—"}
                  </span>
                </div>
              ))}
            </button>
          ))}
          <div style={{ ...card(false), textAlign: "right", padding: "10px 12px", marginTop: 8, fontSize: 13 }}>
            <b>الصور:</b> {files.length ? `${files.length} صورة` : "لا توجد"}
            {answers.notes && <div style={{ marginTop: 4 }}><b>ملاحظتك:</b> {answers.notes}</div>}
          </div>
          {errorBox}
          {nav("إرسال الطلب", submit, C.orange)}
        </div>
      </>
    );
  } else {
    body = (
      <>
        {header("بيت القصيد", "استبيان التصميم المعماري")}
        <div style={{ padding: "28px 16px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.green, color: "#fff", fontSize: 30, lineHeight: "56px", margin: "0 auto" }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 12 }}>وصلنا طلبك</div>
          <p style={{ fontSize: 14 }}>سيتواصل معك فريق التصميم في بيت القصيد{phone || who.phone ? ` على الرقم ${phone || normalizePhone(who.phone)}` : ""} لبدء مرحلة الطابق الأرضي.</p>
        </div>
      </>
    );
  }

  return (
    <div ref={topRef} style={{ maxWidth: 480, margin: "0 auto", padding: "12px 12px 40px" }}>
      <div style={{ background: C.beige, borderRadius: 20, overflow: "hidden", color: C.brown, fontFamily: "Almarai, Cairo, sans-serif", boxShadow: "0 1px 0 rgba(0,0,0,.04)" }}>{body}</div>
      {token && step > 0 && step < DONE && (
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 }}>
          {saved === "saving" ? "يُحفظ…" : saved === "error" ? "تعذّر الحفظ، تحقق من الإنترنت" : "يُحفظ تقدمك تلقائياً، ويمكنك الإكمال لاحقاً من الرابط نفسه."}
        </div>
      )}
    </div>
  );
}
