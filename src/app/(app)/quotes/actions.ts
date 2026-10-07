"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, ApiError } from "@/lib/auth/guard";
import { canEditMarginOrDiscount, canApprove } from "@/lib/auth/types";
import {
  createQuote,
  getQuote,
  isEditable,
  updateQuoteMeta,
  addSection,
  renameSection,
  deleteSection,
  reorderSections,
  addItemFromLibrary,
  addCustomItem,
  updateItem,
  deleteItem,
  copyItem,
  reorderItems,
  moveItemToSection,
  getItem,
  attachLibraryItemId,
  setPayments,
  setOverheadCosts,
  sendForReview,
  returnForRevision,
  approveQuote,
  cancelApproval,
  cancelQuote,
  reopenQuote,
  recordPriceEdit,
  recordExport,
  getSectionsWithItems,
  type QuoteMetaInput,
  type CustomItemInput,
  type ItemUpdateInput,
} from "@/lib/repo/quotes";
import { createLibraryItem } from "@/lib/repo/library";

async function assertEditable(quoteId: string) {
  const user = await requireUser();
  const quote = await getQuote(quoteId);
  if (!quote) throw new ApiError(404, "عرض السعر غير موجود");
  if (!isEditable(quote.status)) {
    throw new ApiError(403, "لا يمكن تعديل عرض السعر في حالته الحالية");
  }
  return { user, quote };
}

export async function createQuoteAction(projectId: string, executionDurationDays: number): Promise<string> {
  const user = await requireUser();
  const quote = await createQuote(projectId, user.id, executionDurationDays);
  return quote.id;
}

export async function updateQuoteMetaAction(quoteId: string, input: QuoteMetaInput): Promise<void> {
  const { user } = await assertEditable(quoteId);
  if ((input.discount_value != null || input.discount_type) && !canEditMarginOrDiscount(user.role)) {
    throw new ApiError(403, "لا تملك صلاحية تعديل الخصم");
  }
  await updateQuoteMeta(quoteId, input);
  if (input.discount_value != null || input.discount_type) {
    await recordPriceEdit(quoteId, user.id, `تعديل الخصم إلى ${input.discount_value ?? ""} (${input.discount_type ?? ""})`);
  }
  revalidatePath(`/quotes/${quoteId}`);
}

export async function addSectionAction(quoteId: string, name: string): Promise<string> {
  await assertEditable(quoteId);
  const id = await addSection(quoteId, name || "قسم جديد");
  revalidatePath(`/quotes/${quoteId}`);
  return id;
}

export async function renameSectionAction(quoteId: string, sectionId: string, name: string): Promise<void> {
  await assertEditable(quoteId);
  await renameSection(sectionId, name);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteSectionAction(quoteId: string, sectionId: string): Promise<void> {
  await assertEditable(quoteId);
  await deleteSection(sectionId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function reorderSectionsAction(quoteId: string, orderedIds: string[]): Promise<void> {
  await assertEditable(quoteId);
  await reorderSections(quoteId, orderedIds);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function addLibraryItemAction(quoteId: string, sectionId: string, libraryItemId: string): Promise<string> {
  await assertEditable(quoteId);
  const id = await addItemFromLibrary(sectionId, libraryItemId, 1);
  revalidatePath(`/quotes/${quoteId}`);
  return id;
}

export async function addCustomItemAction(quoteId: string, sectionId: string, input: CustomItemInput): Promise<string> {
  await assertEditable(quoteId);
  const id = await addCustomItem(sectionId, input);
  revalidatePath(`/quotes/${quoteId}`);
  return id;
}

export async function updateItemAction(quoteId: string, itemId: string, input: ItemUpdateInput): Promise<void> {
  const { user } = await assertEditable(quoteId);
  if (input.manual_unit_price !== undefined && !canEditMarginOrDiscount(user.role)) {
    throw new ApiError(403, "لا تملك صلاحية تعديل السعر يدوياً");
  }
  await updateItem(itemId, input);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteItemAction(quoteId: string, itemId: string): Promise<void> {
  await assertEditable(quoteId);
  await deleteItem(itemId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function copyItemAction(quoteId: string, itemId: string): Promise<void> {
  await assertEditable(quoteId);
  await copyItem(itemId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function reorderItemsAction(quoteId: string, sectionId: string, orderedIds: string[]): Promise<void> {
  await assertEditable(quoteId);
  await reorderItems(sectionId, orderedIds);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function moveItemToSectionAction(quoteId: string, itemId: string, targetSectionId: string): Promise<void> {
  await assertEditable(quoteId);
  await moveItemToSection(itemId, targetSectionId);
  revalidatePath(`/quotes/${quoteId}`);
}

// حفظ فقرة مُدخلة يدوياً داخل عرض سعر إلى مكتبة الفقرات المشتركة، لإعادة استخدامها لاحقاً في عروض
// أخرى دون كتابتها من جديد. متاحة لأي مستخدم يحرر العرض (وليس فقط ADMIN/MANAGER كإدارة المكتبة
// الكاملة) لأن معدّ التندر هو غالباً من يلاحظ أن فقرة تستحق الإضافة أثناء إعداده العرض، والإضافة
// هنا لا تُعدّل أو تحذف أي فقرة موجودة في المكتبة، فقط تُنشئ فقرة جديدة.
export async function saveItemToLibraryAction(quoteId: string, itemId: string): Promise<string> {
  await assertEditable(quoteId);
  const item = await getItem(itemId);
  if (!item) throw new ApiError(404, "الفقرة غير موجودة");
  if (item.library_item_id) throw new ApiError(400, "هذه الفقرة مرتبطة بمكتبة الفقرات بالفعل");
  const lib = await createLibraryItem({
    code: item.code || undefined,
    name: item.name || "فقرة بلا اسم",
    description: item.description,
    unit: item.unit,
    default_unit_cost: item.unit_cost,
    default_margin_pct: item.margin_pct,
  });
  await attachLibraryItemId(itemId, lib.id);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/library");
  return lib.id;
}

export async function setPaymentsAction(
  quoteId: string,
  payments: { label: string; pct: number }[]
): Promise<void> {
  await assertEditable(quoteId);
  await setPayments(quoteId, payments);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function setOverheadCostsAction(
  quoteId: string,
  items: { label: string; days: number; daily_rate: number }[]
): Promise<void> {
  await assertEditable(quoteId);
  await setOverheadCosts(quoteId, items);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function sendForReviewAction(quoteId: string): Promise<void> {
  const { user } = await assertEditable(quoteId);
  const sections = await getSectionsWithItems(quoteId);
  const hasItems = sections.some((s) => s.items.length > 0);
  if (!hasItems) throw new ApiError(400, "لا يمكن إرسال عرض سعر بلا فقرات");
  await sendForReview(quoteId, user.id);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function returnForRevisionAction(quoteId: string, note: string): Promise<void> {
  const user = await requireUser();
  if (!canApprove(user.role)) throw new ApiError(403, "لا تملك صلاحية إعادة العرض للتعديل");
  if (!note || !note.trim()) throw new ApiError(400, "يجب كتابة ملاحظة توضح سبب الإعادة");
  await returnForRevision(quoteId, user.id, note.trim());
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function approveQuoteAction(quoteId: string): Promise<void> {
  const user = await requireUser();
  if (!canApprove(user.role)) throw new ApiError(403, "لا تملك صلاحية اعتماد عروض الأسعار");
  await approveQuote(quoteId, user.id);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function cancelApprovalAction(quoteId: string, reason: string): Promise<void> {
  const user = await requireUser();
  if (!canApprove(user.role)) throw new ApiError(403, "لا تملك صلاحية إلغاء الاعتماد");
  if (!reason || !reason.trim()) throw new ApiError(400, "يجب كتابة سبب إلغاء الاعتماد");
  await cancelApproval(quoteId, user.id, reason.trim());
  revalidatePath(`/quotes/${quoteId}`);
}

export async function cancelQuoteAction(quoteId: string, reason: string): Promise<void> {
  const user = await requireUser();
  if (!canApprove(user.role)) throw new ApiError(403, "لا تملك صلاحية إلغاء عرض السعر");
  await cancelQuote(quoteId, user.id, reason.trim());
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function reopenQuoteAction(quoteId: string, reason: string): Promise<void> {
  const user = await requireUser();
  if (!canApprove(user.role)) throw new ApiError(403, "لا تملك صلاحية استعادة عرض سعر ملغى");
  const quote = await getQuote(quoteId);
  if (!quote) throw new ApiError(404, "عرض السعر غير موجود");
  if (quote.status !== "CANCELLED") throw new ApiError(400, "عرض السعر ليس ملغى أصلاً");
  await reopenQuote(quoteId, user.id, reason.trim() || "استعادة عرض سعر ملغى للتعديل");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function recordExportAction(quoteId: string, note: string): Promise<void> {
  const user = await requireUser();
  await recordExport(quoteId, user.id, note);
}

export async function createQuoteAndRedirect(projectId: string, executionDurationDays: number): Promise<void> {
  const id = await createQuoteAction(projectId, executionDurationDays);
  redirect(`/quotes/${id}`);
}
