// طبقة الوصول لقاعدة البيانات — نسخة PostgreSQL (Supabase) عبر حزمة "pg" مباشرة (اتصال Postgres
// خام، وليس REST)، لأن كل طبقة repo/*.ts مبنية على SQL خام بعلامات استفهام "?" كرموز بديلة —
// هذا الغلاف (shim) يحوّل "?" إلى "$1, $2, ..." تلقائياً وينفّذها عبر مجمّع اتصالات (Pool)، حتى
// تبقى كل ملفات repo/*.ts كما هي تماماً بلا أي تعديل في نصوص SQL نفسها.
//
// الفرق الجوهري عن النسخة المحلية (node:sqlite): Postgres عبر الشبكة، فكل استعلام أصبح غير
// متزامن (Promise) بدل متزامن — لذا يجب استخدام await في كل مكان يستدعي دوال طبقة repo.
import { Pool, type QueryResultRow } from "pg";
import fs from "node:fs";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __baqPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __baqSchemaReady: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "متغيّر البيئة DATABASE_URL غير موجود — يجب ضبطه برابط اتصال قاعدة بيانات Supabase (Postgres)."
    );
  }
  return new Pool({
    connectionString,
    // اتصالات Supabase تتطلب SSL؛ نقبل الشهادة دون تحقق صارم لأن الاتصال يمر عبر رابط Supabase
    // الرسمي المُعطى من لوحة التحكم مباشرة (وليس عنواناً عاماً غير موثوق).
    ssl: { rejectUnauthorized: false },
  });
}

const pool: Pool = globalThis.__baqPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__baqPool = pool;
}

// يضمن تطبيق المخطط (schema) مرة واحدة فقط لكل عملية تشغيل — ينفَّذ عند أول استعلام فعلي.
function ensureSchema(): Promise<void> {
  if (!globalThis.__baqSchemaReady) {
    globalThis.__baqSchemaReady = (async () => {
      const schemaPath = path.join(process.cwd(), "src/lib/db/schema.postgres.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");
      await pool.query(schema);
      const row = await pool.query("SELECT id FROM company WHERE id = 1");
      if (row.rowCount === 0) {
        await pool.query("INSERT INTO company (id) VALUES (1)");
      }
    })();
  }
  return globalThis.__baqSchemaReady;
}

// يحوّل "?" إلى "$1, $2, ..." بالترتيب — كافٍ تماماً لأنماط SQL المستخدمة في هذا المشروع
// (لا توجد علامات استفهام داخل نصوص/قيم ثابتة في الاستعلامات نفسها).
function toPgSql(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export interface PreparedStatement {
  all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T[]>;
  get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T | undefined>;
  run(...params: unknown[]): Promise<void>;
}

function prepare(sql: string): PreparedStatement {
  const pgSql = toPgSql(sql);
  return {
    async all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T[]> {
      await ensureSchema();
      const res = await pool.query<T>(pgSql, params);
      return res.rows;
    },
    async get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T | undefined> {
      await ensureSchema();
      const res = await pool.query<T>(pgSql, params);
      return res.rows[0];
    },
    async run(...params: unknown[]): Promise<void> {
      await ensureSchema();
      await pool.query(pgSql, params);
    },
  };
}

export const db = { prepare };

export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}${t}${rnd}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
