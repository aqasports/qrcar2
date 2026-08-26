'use client';

import React from 'react';
import { Card, CurrencyDisplay } from '@/components/ui';

interface CostBreakdownBarProps {
  servicesSubtotal: number;
  partsSubtotal: number;
  laborCost: number;
  onLaborChange?: (val: number) => void;
  hasTax: boolean;
  onHasTaxChange?: (val: boolean) => void;
  taxRate: number;
  onTaxRateChange?: (val: number) => void;
  currency?: string;
  readOnly?: boolean;
}

export function CostBreakdownBar({
  servicesSubtotal,
  partsSubtotal,
  laborCost,
  onLaborChange,
  hasTax,
  onHasTaxChange,
  taxRate = 19.0,
  onTaxRateChange,
  currency = 'DZD',
  readOnly = false,
}: CostBreakdownBarProps) {
  const itemsSubtotal = servicesSubtotal + partsSubtotal;
  const subtotalHT = itemsSubtotal + laborCost;
  const effectiveTaxRate = hasTax ? taxRate : 0;
  const taxAmount = subtotalHT * (effectiveTaxRate / 100);
  const totalTTC = subtotalHT + taxAmount;

  return (
    <Card className="p-4 bg-surface-raised border border-border-default shadow-sm font-sans">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Cost Streams */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {/* Services & Acts */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Prestations & Actes
            </span>
            <span className="text-sm font-semibold font-mono text-text-primary">
              <CurrencyDisplay amount={servicesSubtotal} currency={currency} />
            </span>
          </div>

          {/* Parts & Stock */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Pièces & Consommables
            </span>
            <span className="text-sm font-semibold font-mono text-text-primary">
              <CurrencyDisplay amount={partsSubtotal} currency={currency} />
            </span>
          </div>

          {/* Labor Cost */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                Main d'œuvre
              </span>
            </div>
            {readOnly || !onLaborChange ? (
              <span className="text-sm font-semibold font-mono text-text-primary">
                <CurrencyDisplay amount={laborCost} currency={currency} />
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={laborCost}
                  onChange={(e) => onLaborChange(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 bg-surface-base border border-border-default rounded text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[11px] text-text-muted font-mono">{currency}</span>
              </div>
            )}
          </div>

          {/* Subtotal HT */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Sous-Total HT
            </span>
            <span className="text-sm font-bold font-mono text-text-primary">
              <CurrencyDisplay amount={subtotalHT} currency={currency} />
            </span>
          </div>
        </div>

        {/* Tax Switcher & Grand Total */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-5 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-border-subtle">
          {/* Tax Switcher */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-base border border-border-subtle">
            <div className="flex items-center gap-2">
              {readOnly || !onHasTaxChange ? (
                <span className="text-xs font-medium text-text-secondary">
                  {hasTax ? `TVA (${taxRate}%)` : 'TVA Exonérée (0%)'}
                </span>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasTax}
                    onChange={(e) => onHasTaxChange(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default bg-surface-base text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <span className="text-xs font-medium text-text-primary">
                    {hasTax ? 'TVA' : 'Sans TVA'}
                  </span>
                </label>
              )}

              {hasTax && !readOnly && onTaxRateChange && (
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={taxRate}
                    onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 bg-surface-raised border border-border-default rounded text-[11px] font-mono text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-[11px] text-text-muted">%</span>
                </div>
              )}
            </div>

            <div className="text-right pl-2 border-l border-border-subtle font-mono text-xs text-text-muted">
              {hasTax ? (
                <CurrencyDisplay amount={taxAmount} currency={currency} />
              ) : (
                <span>0 {currency}</span>
              )}
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-accent/10 border border-accent/30 text-right">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                Total Net {hasTax ? 'TTC' : ''}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-accent">
                <CurrencyDisplay amount={totalTTC} currency={currency} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
