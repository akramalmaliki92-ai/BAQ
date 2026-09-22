// ترقيم عروض الأسعار: BQ-QTN-YYYY-0001 — تسلسل ذري لكل سنة، لا يتكرر أبداً حتى مع الاستخدام المتزامن.
//
// ملاحظة على تحويل PostgreSQL: النسخة السابقة (node:sqlite) كانت تستخدم معاملة صريحة
// (db.exec("BEGIN IMMEDIATE") / COMMIT / ROLLBACK) عبر اتصال واحد متزامن. طبقة db الجديدة
// (src/lib/db/client.ts) لا تملك دالة exec إطلاقاً، وهي مبنية على Pool من عدة اتصالات — فتنفيذ
// BEGIN/UPDATE/COMMIT كثلاث استدعاءات prepare().run() منفصلة قد يوزَّع كل استدعاء على اتصال
// مختلف من المجمّع، مما يُبطل معنى المعاملة تماماً ولا يحقق الذرية المطلوبة أصلاً. لذلك استُبدلت
// بعملية UPSERT ذرية واحدة (INSERT ... ON CONFLICT ... RETURNING) تُنفَّذ عبر استعلام واحد على
// اتصال واحد من المجمّع، وتحافظ على نفس الضمان الموصوف أعلاه (تسلسل لا يتكرر حتى مع التزامن)
// بالاعتماد على قفل الصف الذري الذي يوفره Postgres لعمليات UPSERT.
import { db } from "@/lib/db/client";

export async function nextQuoteNumber(prefix = "BQ-QTN"): Promise<string> {
  const year = new Date().getFullYear();
  const row = (await db
    .prepare(
      `INSERT INTO quote_number_counters (year, last_seq) VALUES (?, 1)
       ON CONFLICT (year) DO UPDATE SET last_seq = quote_number_counters.last_seq + 1
       RETURNING last_seq`
    )
    .get(year)) as { last_seq: number } | undefined;
  const nextSeq = row!.last_seq;
  const seqStr = String(nextSeq).padStart(4, "0");
  return `${prefix}-${year}-${seqStr}`;
}
