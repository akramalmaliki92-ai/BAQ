import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getDesignRequest } from "@/lib/repo/designRequests";
import RequestView from "../request-view";
import ShareLink from "../../projects/[id]/share-link";

export default async function DesignRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const r = await getDesignRequest(id);
  if (!r) notFound();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold">طلب تصميم: {r.name || "—"}</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-0.5">
            <span className="tabular" dir="ltr">{r.phone}</span>
            {r.governorate && ` · ${r.governorate}`} · {r.source === "PUBLIC" ? "الرابط العام" : "رابط مشروع"} ·{" "}
            {r.status === "SUBMITTED" ? `أُرسل ${r.submitted_at?.slice(0, 16).replace("T", " ")}` : "لم يكتمل بعد"}
            {r.notify_status === "failed" && " · تعذّر إرسال تنبيه تيليجرام"}
          </div>
        </div>
        <div className="flex gap-2">
          {r.project_id && (
            <Link href={`/projects/${r.project_id}`} className="rounded-xl text-white font-bold text-sm px-4 py-2.5" style={{ background: "var(--brand-dark)" }}>
              فتح المشروع
            </Link>
          )}
          {r.status === "DRAFT" && <ShareLink path={`/design/${r.token}`} label="نسخ رابط الزبون" />}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
        <RequestView r={r} />
      </div>
    </div>
  );
}
