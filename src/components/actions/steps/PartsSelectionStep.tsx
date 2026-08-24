import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@/components/ui';

interface CatalogPart {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity_in_stock: number;
  sale_price: number;
  unit: string;
}

interface SelectedPart {
  part_id: string;
  quantity: number;
  name: string;
  price: number;
  sku: string;
  unit: string;
}

interface PartsSelectionStepProps {
  catalogParts: CatalogPart[];
  selectedParts: SelectedPart[];
  onAddPart: (part: CatalogPart) => void;
  onRemovePart: (partId: string) => void;
  onUpdateQty: (partId: string, qty: number) => void;
  laborCost: number;
}

export function PartsSelectionStep({
  catalogParts,
  selectedParts,
  onAddPart,
  onRemovePart,
  onUpdateQty,
  laborCost,
}: PartsSelectionStepProps) {
  const [search, setSearch] = useState('');

  const filteredParts = catalogParts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const partsTotal = selectedParts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const totalEstimation = laborCost + partsTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Pièces & Fournitures Consommées</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Catalog Search & Add */}
        <div className="space-y-3">
          <Input
            placeholder="Rechercher une pièce par nom ou référence SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <div className="max-h-48 overflow-y-auto divide-y divide-border-subtle bg-surface-base rounded-xl border border-border-subtle">
              {filteredParts.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  Aucune pièce trouvée dans le stock atelier.
                </div>
              ) : (
                filteredParts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between hover:bg-surface-overlay/50 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-text-primary block">{p.name}</span>
                      <span className="text-[10px] text-text-muted block font-mono">
                        [{p.sku}] — Stock: {p.quantity_in_stock} {p.unit || 'u'} — {p.sale_price.toLocaleString()} DZD
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={p.quantity_in_stock <= 0}
                      onClick={() => {
                        onAddPart(p);
                        setSearch('');
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Parts List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Pièces Rattachées ({selectedParts.length})
          </span>

          {selectedParts.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border-subtle rounded-xl">
              Aucune pièce rattachée pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedParts.map((p) => (
                <div
                  key={p.part_id}
                  className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-text-primary block truncate">{p.name}</span>
                    <span className="text-[10px] text-text-muted font-mono block">
                      {p.sku} — {p.price.toLocaleString()} DZD / {p.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(p.part_id, Math.max(1, p.quantity - 1))}
                        className="w-6 h-6 rounded bg-surface-overlay border border-border-default flex items-center justify-center text-text-primary text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs">{p.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(p.part_id, p.quantity + 1)}
                        className="w-6 h-6 rounded bg-surface-overlay border border-border-default flex items-center justify-center text-text-primary text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-24 text-right font-mono font-bold text-xs text-text-primary">
                      {(p.price * p.quantity).toLocaleString()} DZD
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemovePart(p.part_id)}
                      className="text-text-muted hover:text-danger p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Summary Banner */}
        <div className="p-4 rounded-xl bg-surface-base border border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <span className="text-text-muted block">Main d&apos;œuvre : <span className="font-bold text-text-primary font-mono">{laborCost.toLocaleString()} DZD</span></span>
            <span className="text-text-muted block">Total pièces : <span className="font-bold text-text-primary font-mono">{partsTotal.toLocaleString()} DZD</span></span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-text-muted block text-[11px] uppercase font-bold tracking-wider">Total Estimé TTC</span>
            <span className="text-lg font-black font-mono text-accent">{totalEstimation.toLocaleString()} DZD</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
