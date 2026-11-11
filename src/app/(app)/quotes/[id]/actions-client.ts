// أغلفة جهة المتصفح لإجراءات عرض السعر: كل إجراء خادم يُعيد رسالة الخطأ كقيمة (انظر
// src/lib/action-error.ts)، وهنا تُحوَّل تلك القيمة إلى خطأ عادي يحمل النص العربي، فتبقى طريقة
// الاستدعاء في المحرّر كما هي (.catch((e) => alert(e.message))) ويرى المستخدم سبب الرفض الحقيقي.
import * as server from "../actions";
import { isActionError, type ActionError } from "@/lib/action-error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<A extends any[], R>(fn: (...args: A) => Promise<R | ActionError>) {
  return async (...args: A): Promise<Exclude<R, ActionError>> => {
    const result = await fn(...args);
    if (isActionError(result)) throw new Error(result.__baqActionError);
    return result as Exclude<R, ActionError>;
  };
}

export const updateQuoteMetaAction = unwrap(server.updateQuoteMetaAction);
export const addSectionAction = unwrap(server.addSectionAction);
export const renameSectionAction = unwrap(server.renameSectionAction);
export const deleteSectionAction = unwrap(server.deleteSectionAction);
export const reorderSectionsAction = unwrap(server.reorderSectionsAction);
export const addLibraryItemAction = unwrap(server.addLibraryItemAction);
export const addCustomItemAction = unwrap(server.addCustomItemAction);
export const updateItemAction = unwrap(server.updateItemAction);
export const deleteItemAction = unwrap(server.deleteItemAction);
export const copyItemAction = unwrap(server.copyItemAction);
export const reorderItemsAction = unwrap(server.reorderItemsAction);
export const moveItemToSectionAction = unwrap(server.moveItemToSectionAction);
export const saveItemToLibraryAction = unwrap(server.saveItemToLibraryAction);
export const setPaymentsAction = unwrap(server.setPaymentsAction);
export const setExecutionDurationAction = unwrap(server.setExecutionDurationAction);
export const setOverheadCostsAction = unwrap(server.setOverheadCostsAction);
export const sendForReviewAction = unwrap(server.sendForReviewAction);
export const returnForRevisionAction = unwrap(server.returnForRevisionAction);
export const approveQuoteAction = unwrap(server.approveQuoteAction);
export const cancelApprovalAction = unwrap(server.cancelApprovalAction);
export const cancelQuoteAction = unwrap(server.cancelQuoteAction);
export const reopenQuoteAction = unwrap(server.reopenQuoteAction);
