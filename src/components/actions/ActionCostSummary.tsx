import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface InvoiceSummary {
  id?: string;
  invoice_number?: string;
  total?: number;
  status?: string;
}

interface ActionCostSummaryProps {
  laborCost: number;
  partsUsed: Array<{ quantity: number; unit_price_snapshot?: number }>;
  invoice: InvoiceSummary | null;
}

export function ActionCostSummary({
  laborCost,
  partsUsed,
  invoice,
}: ActionCostSummaryProps) {
  const { t } = useI18n();

  const partsTotal = partsUsed.reduce(
    (acc, p) => acc + (p.unit_price_snapshot || 0) * p.quantity,
    0
  );
  const grandTotal = laborCost + partsTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.actions.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 font-sans">
        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span>{t.actions.laborCost}</span>
          <span className="font-mono font-bold text-text-primary">
            {laborCost.toLocaleString()} {t.common.currency}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span>{t.inventory.title} ({partsUsed.length})</span>
          <span className="font-mono font-bold text-text-primary">
            {partsTotal.toLocaleString()} {t.common.currency}
          </span>
        </div>

        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">{t.invoices.totalTTC}</span>
          <span className="text-lg sm:text-xl font-black font-mono text-accent">
            {grandTotal.toLocaleString()} {t.common.currency}
          </span>
        </div>

        {invoice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
            <span>{t.invoices.invoiceNumber}</span>
            <span className="font-bold font-mono">{invoice.invoice_number}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
