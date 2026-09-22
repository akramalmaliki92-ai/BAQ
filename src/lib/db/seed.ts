// بيانات تجريبية واقعية لتوضيح عمل النظام — كلها مُعلَّمة is_demo=1 ويمكن حذفها لاحقاً من شاشة
// المستخدمين/الإعدادات. يُشغَّل عبر: npx tsx src/lib/db/seed.ts
import { db } from "./client";
import { createUser } from "@/lib/repo/users";
import { createClient } from "@/lib/repo/clients";
import { createProject } from "@/lib/repo/projects";
import { createLibraryItem } from "@/lib/repo/library";
import {
  createQuote,
  addSection,
  addItemFromLibrary,
  addCustomItem,
  updateItem,
  setPayments,
  updateQuoteMeta,
  sendForReview,
} from "@/lib/repo/quotes";

async function main() {
  const existing = (await db.prepare("SELECT COUNT(*) c FROM users").get()) as { c: number };
  if (existing.c > 0) {
    console.log("توجد بيانات مسبقاً — إلغاء التشغيل لتفادي التكرار. احذف قاعدة البيانات (data/app.db) للبدء من جديد.");
    return;
  }

  console.log("إنشاء المستخدمين التجريبيين...");
  const admin = await createUser(
    { name: "مدير النظام", email: "admin@baq.local", password: "123456", role: "ADMIN" },
    true
  );
  const manager = await createUser(
    { name: "أحمد المدير", email: "manager@baq.local", password: "123456", role: "MANAGER" },
    true
  );
  const preparer = await createUser(
    { name: "سارة معدّة التندرات", email: "preparer@baq.local", password: "123456", role: "PREPARER" },
    true
  );

  console.log("إنشاء عميل ومشروع تجريبيين...");
  const client = await createClient(
    {
      name: "شركة نجم البصرة العقارية",
      contact_person: "م. علي حسين",
      phone: "07701234567",
      email: "info@example-client.iq",
      address: "البصرة - العشار",
      tax_number: "",
      notes: "عميل تجريبي بغرض توضيح عمل النظام",
    },
    admin.id,
    true
  );

  const project = await createProject(
    {
      name: "تجهيز وتشطيب فيلا العشار",
      client_id: client.id,
      location: "البصرة - حي العشار - قرب حديقة الأمة",
      description: "أعمال تشطيبات داخلية كاملة لفيلا سكنية من طابقين",
      manager_user_id: manager.id,
      default_currency: "IQD",
      status: "ACTIVE",
      internal_notes: "مشروع تجريبي",
    },
    preparer.id,
    true
  );

  console.log("تعبئة مكتبة الفقرات...");
  // فقرات فعلية من ملف تسعيرة الشركة الأصلي (أعمال التبليط)
  const tiling = [
    ["أعمال تبليط الموزاييك", "م2", 28000],
    ["أعمال تبليط الغرانيت للأرضيات", "م2", 65000],
    ["أعمال تبليط الغرانيت للجدران", "م2", 70000],
    ["أعمال تبليط السيراميك للأرضيات", "م2", 32000],
    ["أعمال تبليط السيراميك للجدران", "م2", 30000],
    ["أعمال وزرات السيراميك للجدران", "م2", 27000],
    [
      "إزالة الأرضيات والجدران (موزاييك، غرانيت، سيراميك، مرمر) مع رفع ونقل الأنقاض إلى خارج موقع العمل",
      "م2",
      6000,
    ],
  ] as const;
  for (const [name, unit, cost] of tiling) {
    await createLibraryItem(
      { name, unit, main_category: "أعمال التبليط", default_unit_cost: cost, default_margin_pct: 20 },
      true
    );
  }

  const gypsum = [
    ["سقف مستعار من الألمنيوم خفيف الوزن", "م2", 35000],
    ["تكسية بألواح الجبس بورد أقل من 10 ملم مع المعجون والدهان", "م2", 22000],
    ["تكسية بألواح الجبس بورد أكثر من 10 ملم مع المعجون والدهان", "م2", 27000],
  ] as const;
  for (const [name, unit, cost] of gypsum) {
    await createLibraryItem(
      { name, unit, main_category: "أعمال الأسقف والجبس بورد", default_unit_cost: cost, default_margin_pct: 20 },
      true
    );
  }

  const electrical = [
    ["تمديد نقطة إنارة كاملة", "نقطة", 15000],
    ["تمديد نقطة مفتاح/قاطع", "نقطة", 12000],
    ["تمديد نقطة بريز عادية", "نقطة", 13000],
    ["تركيب لوحة توزيع فرعية 12 خط", "عدد", 180000],
  ] as const;
  for (const [name, unit, cost] of electrical) {
    await createLibraryItem(
      { name, unit, main_category: "الأعمال الكهربائية", default_unit_cost: cost, default_margin_pct: 25 },
      true
    );
  }

  const plumbing = [
    ["تمديد تغذية وتصريف حمام كامل", "عدد", 250000],
    ["تركيب خلاطات ومغاسل درجة أولى", "عدد", 120000],
    ["تمديد نقطة صحية عادية", "نقطة", 35000],
  ] as const;
  for (const [name, unit, cost] of plumbing) {
    await createLibraryItem(
      { name, unit, main_category: "الأعمال الصحية", default_unit_cost: cost, default_margin_pct: 22 },
      true
    );
  }

  const paint = [
    ["دهان معجون + وجهين بلاستيك درجة أولى للجدران والأسقف", "م2", 9000],
    ["دهان واجهات خارجية عازل للطقس", "م2", 14000],
  ] as const;
  for (const [name, unit, cost] of paint) {
    await createLibraryItem(
      { name, unit, main_category: "أعمال الدهانات", default_unit_cost: cost, default_margin_pct: 20 },
      true
    );
  }

  console.log("إنشاء تندر تجريبي بعدة أقسام...");
  const libraryRows = (await db.prepare("SELECT id, name, main_category FROM library_items").all()) as {
    id: string;
    name: string;
    main_category: string;
  }[];
  const byCategory = (cat: string) => libraryRows.filter((r) => r.main_category === cat);

  const quote = await createQuote(project.id, preparer.id, true);
  await updateQuoteMeta(quote.id, {
    title: "عرض سعر تشطيبات فيلا العشار",
    execution_duration: "45 يوم عمل",
  });

  const secTiling = await addSection(quote.id, "أعمال التبليط");
  const t1 = await addItemFromLibrary(secTiling, byCategory("أعمال التبليط")[0].id, 120);
  await updateItem(t1, { qty: 120, description: "موزاييك درجة أولى، مقاس 40×40، مع فرشة رمل وتخانة مونة موحدة" });
  const t2 = await addItemFromLibrary(secTiling, byCategory("أعمال التبليط")[3].id, 200);
  await updateItem(t2, { qty: 200, description: "سيراميك مستورد درجة أولى مع ديدرة حسب اختيار العميل" });

  const secGypsum = await addSection(quote.id, "أعمال الأسقف والجبس بورد");
  const g1 = await addItemFromLibrary(secGypsum, byCategory("أعمال الأسقف والجبس بورد")[0].id, 180);
  await updateItem(g1, { qty: 180, description: "هيكل ألمنيوم مجلفن مع ألواح جبس بورد مقاوم للرطوبة ودهان معجون نهائي" });

  const secElec = await addSection(quote.id, "الأعمال الكهربائية");
  const e1 = await addItemFromLibrary(secElec, byCategory("الأعمال الكهربائية")[0].id, 60);
  await updateItem(e1, { qty: 60, description: "تمديد كامل من اللوحة الفرعية حتى نقطة الإنارة مع العلبة والمفتاح" });
  const e2 = await addItemFromLibrary(secElec, byCategory("الأعمال الكهربائية")[2].id, 40);
  await updateItem(e2, { qty: 40, description: "بريز عادي 16 أمبير مع سلك نحاسي 2.5 ملم مزدوج العزل" });

  const secPaint = await addSection(quote.id, "أعمال الدهانات");
  const p1 = await addItemFromLibrary(secPaint, byCategory("أعمال الدهانات")[0].id, 420);
  await updateItem(p1, { qty: 420, description: "معجون كامل + صنفرة + وجهين بلاستيك مطفي درجة أولى" });
  // فقرة مخصّصة غير موجودة في المكتبة
  await addCustomItem(secPaint, {
    name: "دهان ديكوري خاص للصالة الرئيسية (حسب طلب العميل)",
    unit: "م2",
    qty: 35,
    unit_cost: 18000,
    margin_pct: 25,
  });

  await setPayments(quote.id, [
    { label: "الدفعة الأولى (عند التوقيع)", pct: 30 },
    { label: "الدفعة الثانية (منتصف التنفيذ)", pct: 40 },
    { label: "الدفعة الثالثة (الاستلام النهائي)", pct: 30 },
  ]);

  await sendForReview(quote.id, preparer.id);

  console.log("\n=== تمت تعبئة البيانات التجريبية بنجاح ===");
  console.log("حسابات الدخول (كلمة المرور للجميع: 123456):");
  console.log("  مسؤول النظام : admin@baq.local");
  console.log("  مدير         : manager@baq.local");
  console.log("  معدّ تندر    : preparer@baq.local");
  console.log(`\nتندر تجريبي: ${quote.number} (بانتظار مراجعة المدير)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
