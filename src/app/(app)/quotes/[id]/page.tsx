import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getQuote, getSectionsWithItems, getPayments, getOverheadCosts, getAuditLog } from "@/lib/repo/quotes";
import { listLibraryItems } from "@/lib/repo/library";
import { getCompanySettings } from "@/lib/repo/settings";
import QuoteEditor from "./editor";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const sections = await getSectionsWithItems(id);
  const payments = await getPayments(id);
  const overheadCosts = await getOverheadCosts(id);
  const auditLog = await getAuditLog(id);
  const libraryItems = await listLibraryItems();
  const company = await getCompanySettings();

  return (
    <QuoteEditor
      quote={quote}
      sections={sections}
      payments={payments}
      overheadCosts={overheadCosts}
      auditLog={auditLog}
      libraryItems={libraryItems}
      company={company}
      currentUser={user}
    />
  );
}
