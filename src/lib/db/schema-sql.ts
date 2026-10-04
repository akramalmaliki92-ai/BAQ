// نفس محتوى schema.postgres.sql لكن كنص مضمّن (inline) داخل الكود بدل قراءته من القرص عبر
// fs.readFileSync في وقت التشغيل — على بيئة Vercel الخادمية (serverless)، تتبّع الملفات
// (output file tracing) قد لا يضمّن ملفات تُقرأ بمسار ديناميكي ضمن حزمة الدالة المنشورة، فيفشل
// القرص بخطأ ENOENT رغم عمله محلياً. تضمين النص كثابت JS يضمن تضمينه تلقائياً في كل حزمة.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name_ar TEXT NOT NULL DEFAULT 'شركة بيت القصيد للمقاولات والتجارة العامة',
  name_en TEXT NOT NULL DEFAULT 'Bait Al Qasid General Contracting & Trading Co.',
  logo_data_url TEXT,
  address TEXT NOT NULL DEFAULT 'البصرة - شارع 14 تموز - بداية شارع المقاولين',
  phone TEXT NOT NULL DEFAULT '07713777313',
  email TEXT NOT NULL DEFAULT 'info@baytalqasid.iq',
  website TEXT NOT NULL DEFAULT 'www.baytalqasid.iq',
  tax_number TEXT DEFAULT '',
  bank_info TEXT DEFAULT '',
  default_currency TEXT NOT NULL DEFAULT 'IQD',
  default_margin_pct REAL NOT NULL DEFAULT 20,
  min_margin_pct REAL NOT NULL DEFAULT 10,
  default_validity_days INTEGER NOT NULL DEFAULT 14,
  default_payment_terms TEXT NOT NULL DEFAULT 'دفعة أولى عند التوقيع، والباقي حسب مراحل الإنجاز.',
  general_terms TEXT NOT NULL DEFAULT '',
  intro_text TEXT NOT NULL DEFAULT 'يسر شركة بيت القصيد أن تتقدم لكم بعرض السعر التالي وفق المواصفات المطلوبة.',
  outro_text TEXT NOT NULL DEFAULT 'نشكر لكم ثقتكم، وفي انتظار ملاحظاتكم للمباشرة بالتنفيذ.',
  quote_prefix TEXT NOT NULL DEFAULT 'BQ-QTN',
  accent_color TEXT NOT NULL DEFAULT '#74816F',
  accent_light TEXT NOT NULL DEFAULT '#F6E8D2',
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','MANAGER','PREPARER')),
  active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  tax_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  manager_user_id TEXT REFERENCES users(id),
  default_currency TEXT NOT NULL DEFAULT 'IQD',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ON_HOLD','CLOSED')),
  internal_notes TEXT DEFAULT '',
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  main_category TEXT NOT NULL DEFAULT '',
  sub_category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'عدد',
  default_unit_cost REAL NOT NULL DEFAULT 0,
  default_margin_pct REAL NOT NULL DEFAULT 20,
  currency TEXT NOT NULL DEFAULT 'IQD',
  cost_updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  internal_notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS quote_number_counters (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT 'عرض سعر',
  intro_text TEXT DEFAULT '',
  outro_text TEXT DEFAULT '',
  issue_date TEXT NOT NULL,
  valid_until TEXT,
  currency TEXT NOT NULL DEFAULT 'IQD',
  execution_duration TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','NEEDS_REVISION','APPROVED','CANCELLED')),
  discount_type TEXT NOT NULL DEFAULT 'PERCENT' CHECK (discount_type IN ('PERCENT','FIXED')),
  discount_value REAL NOT NULL DEFAULT 0,
  tax_enabled INTEGER NOT NULL DEFAULT 0,
  tax_pct REAL NOT NULL DEFAULT 0,
  min_margin_pct REAL,
  hide_unit_price INTEGER NOT NULL DEFAULT 0,
  distribute_overhead INTEGER NOT NULL DEFAULT 0,
  contract_type TEXT NOT NULL DEFAULT 'LUMP_SUM' CHECK (contract_type IN ('LUMP_SUM','COST_PLUS','AREA_BASED')),
  cost_plus_fee_pct REAL NOT NULL DEFAULT 35,
  total_area_sqm REAL NOT NULL DEFAULT 0,
  price_per_sqm REAL NOT NULL DEFAULT 0,
  execution_duration_days INTEGER NOT NULL DEFAULT 0,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  revision_note TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS quote_sections (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES quote_sections(id) ON DELETE CASCADE,
  library_item_id TEXT REFERENCES library_items(id),
  code TEXT DEFAULT '',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'عدد',
  qty REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  margin_pct REAL NOT NULL DEFAULT 20,
  manual_unit_price REAL,
  internal_note TEXT DEFAULT '',
  client_note TEXT DEFAULT '',
  hidden_from_client INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_payments (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  pct REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- مصاريف ونفقات المشروع الداخلية (مهندس الموقع، المشرف، أيام العمل...) — لا تظهر للعميل إطلاقاً.
CREATE TABLE IF NOT EXISTS quote_overhead_costs (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  days REAL NOT NULL DEFAULT 0,
  daily_rate REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_audit_log (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE INDEX IF NOT EXISTS idx_quote_items_section ON quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_quote_sections_quote ON quote_sections(quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_quote ON quote_audit_log(quote_id);
CREATE INDEX IF NOT EXISTS idx_overhead_quote ON quote_overhead_costs(quote_id);

-- روابط المشروع: النموذج ثلاثي الأبعاد (للفريق وللزبون) وملف المشروع — تُضاف بأمان إن لم تكن موجودة
ALTER TABLE projects ADD COLUMN IF NOT EXISTS model_url TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_model_url TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_file_url TEXT DEFAULT '';

-- ===== خط الإنتاج: مكتبة المخططات، ونماذج المشاريع ونسخها، ومراحل المنهجية =====
CREATE TABLE IF NOT EXISTS plan_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'HOUSE' CHECK (kind IN ('HOUSE','APARTMENT','BUILDING','VILLA','OTHER')),
  plot_w REAL NOT NULL DEFAULT 0,
  plot_d REAL NOT NULL DEFAULT 0,
  floors INTEGER NOT NULL DEFAULT 1,
  built_area REAL NOT NULL DEFAULT 0,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  source TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  model_js TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS project_models (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES plan_templates(id),
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

CREATE TABLE IF NOT EXISTS model_versions (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES project_models(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1,
  note TEXT DEFAULT '',
  model_js TEXT NOT NULL,
  created_by TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  UNIQUE (model_id, version)
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS stages_json TEXT DEFAULT '{}';
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_model_versions_model ON model_versions(model_id);
`;
