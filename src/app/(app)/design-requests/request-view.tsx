import { STEPS, labelOf, num } from "@/lib/design/questions";
import { type DesignRequestRow, parseAnswers, parseFiles } from "@/lib/repo/designRequests";
import { driveFolderUrl } from "@/lib/design/n8n";

// عرض أجوبة طلب التصميم وصوره (يُستعمل في صفحة الطلب وصفحة المشروع)
export default function RequestView({ r }: { r: DesignRequestRow }) {
  const a = parseAnswers(r);
  const files = parseFiles(r);
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl border border-[var(--border)] p-3">
            <div className="text-xs font-bold text-[var(--foreground-muted)] mb-1.5">{s.title}</div>
            {s.questions.map((q) => (
              <div key={q.key} className="flex justify-between gap-3 py-0.5">
                <span className="text-[var(--foreground-muted)]">{q.title}</span>
                <span className="font-bold text-left">
                  {q.kind === "dims" ? (num(a.plot_w) ? `${num(a.plot_w)} × ${num(a.plot_d)} م` : "—") : labelOf(q.key, a[q.key]) || "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {a.notes && (
        <div className="rounded-xl border border-[var(--border)] p-3">
          <div className="text-xs font-bold text-[var(--foreground-muted)] mb-1">ملاحظة الزبون</div>
          <div className="whitespace-pre-wrap">{a.notes}</div>
        </div>
      )}
      <div className="rounded-xl border border-[var(--border)] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-[var(--foreground-muted)]">الصور ({files.length})</div>
          {r.drive_folder_id && (
            <a href={driveFolderUrl(r.drive_folder_id)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>
              فتح مجلد Drive ↗
            </a>
          )}
        </div>
        {files.length === 0 ? (
          <div className="text-[var(--foreground-muted)]">لم تُرفع صور.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <a key={f.fileId} href={f.link} target="_blank" rel="noopener noreferrer" title={f.name} className="block w-24">
                {f.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.thumb} alt={f.name} className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" />
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-[var(--border)] flex items-center justify-center text-xs">PDF</div>
                )}
                <div className="text-[11px] text-[var(--foreground-muted)] truncate mt-0.5">{f.name}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
