import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

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
  const partsTotal = partsUsed.reduce(
    (acc, p) => acc + (p.unit_price_snapshot || 0) * p.quantity,
    0
  );
  const grandTotal = laborCost + partsTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilan Financier de l&apos;Opération</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span>Main d&apos;œuvre atelier</span>
          <span className="font-mono font-bold text-text-primary">
            {laborCost.toLocaleString()} DZD
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span>Total pièces consommées ({partsUsed.length})</span>
          <span className="font-mono font-bold text-text-primary">
            {partsTotal.toLocaleString()} DZD
          </span>
        </div>

        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Total Estimation TTC</span>
          <span className="text-lg sm:text-xl font-black font-mono text-accent">
            {grandTotal.toLocaleString()} DZD
          </span>
        </div>

        {invoice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
            <span>Facture associée</span>
            <span className="font-bold font-mono">{invoice.invoice_number}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
