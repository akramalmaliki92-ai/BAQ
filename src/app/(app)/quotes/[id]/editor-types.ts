import type { Role } from "@/lib/auth/types";
import type { QuoteRow, SectionWithItems, PaymentRow, OverheadCostRow, AuditRow } from "@/lib/repo/quotes";
import type { LibraryItemRow } from "@/lib/repo/library";
import type { CompanySettings } from "@/lib/repo/settings";

export interface EditorProps {
  quote: QuoteRow;
  sections: SectionWithItems[];
  payments: PaymentRow[];
  overheadCosts: OverheadCostRow[];
  auditLog: AuditRow[];
  libraryItems: LibraryItemRow[];
  company: CompanySettings;
  currentUser: { id: string; name: string; role: Role };
}
