'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Modal, CurrencyDisplay, Input } from '@/components/ui';
import { InlineEditCell } from './InlineEditCell';

export interface RepairOrderLineItem {
  id: string;
  name: string;
  description?: string | null;
  item_type: 'service' | 'part' | 'labor' | 'inspection' | string;
  quantity: number;
  unit_price: number;
  unit?: string;
  linked_part_id?: string | null;
  unit_price_snapshot?: number | null;
  linked_part_name?: string | null;
  linked_part_sku?: string | null;
  linked_part_stock?: number | null;
  is_required?: boolean;
}

export interface CatalogPartOption {
  id: string;
  name: string;
  sku: string;
  sale_price: number;
  quantity_in_stock: number;
  unit?: string;
  category?: string;
}

interface RepairOrderLineItemsProps {
  items: RepairOrderLineItem[];
  onUpdateItem: (id: string, updates: Partial<RepairOrderLineItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: Omit<RepairOrderLineItem, 'id'>) => void;
  catalogParts?: CatalogPartOption[];
  currency?: string;
  readOnly?: boolean;
}

export function RepairOrderLineItems({
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  catalogParts = [],
  currency = 'DZD',
  readOnly = false,
}: RepairOrderLineItemsProps) {
  // Modal states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);

  // New Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('2500');
  const [newServiceQty, setNewServiceQty] = useState('1');
  const [newServiceUnit, setNewServiceUnit] = useState('forfait');
  const [newServiceType, setNewServiceType] = useState<'service' | 'labor' | 'inspection'>('service');

  // Part Picker Search State
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState('1');
  const [selectedPartCustomPrice, setSelectedPartCustomPrice] = useState('');

  const filteredParts = catalogParts.filter(
    (p) =>
      p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(partSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(partSearch.toLowerCase()))
  );

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    onAddItem({
      name: newServiceName.trim(),
      description: newServiceDescription.trim() || undefined,
      item_type: newServiceType,
      unit_price: parseFloat(newServicePrice) || 0,
      quantity: parseFloat(newServiceQty) || 1,
      unit: newServiceUnit,
    });

    setNewServiceName('');
    setNewServiceDescription('');
    setNewServicePrice('2500');
    setNewServiceQty('1');
    setNewServiceUnit('forfait');
    setShowAddServiceModal(false);
  };

  const handleSelectPart = (part: CatalogPartOption) => {
    setSelectedPartId(part.id);
    setSelectedPartCustomPrice(String(part.sale_price || '0'));
  };

  const handleAddSelectedPart = (e: React.FormEvent) => {
    e.preventDefault();
    const part = catalogParts.find((p) => p.id === selectedPartId);
    if (!part) return;

    const price = selectedPartCustomPrice !== '' ? parseFloat(selectedPartCustomPrice) || 0 : part.sale_price;

    onAddItem({
      name: part.name,
      description: `Réf SKU: ${part.sku}`,
      item_type: 'part',
      unit_price: price,
      quantity: parseFloat(selectedPartQty) || 1,
      unit: part.unit || 'u',
      linked_part_id: part.id,
      unit_price_snapshot: part.sale_price,
      linked_part_name: part.name,
      linked_part_sku: part.sku,
      linked_part_stock: part.quantity_in_stock,
    });

    setSelectedPartId('');
    setSelectedPartQty('1');
    setSelectedPartCustomPrice('');
    setPartSearch('');
    setShowAddPartModal(false);
  };

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'labor':
        return <Badge variant="info">Main d'œuvre</Badge>;
      case 'part':
        return <Badge variant="warning">Pièce Stock</Badge>;
      case 'inspection':
        return <Badge variant="neutral">Contrôle</Badge>;
      case 'service':
      default:
        return <Badge variant="info">Prestation</Badge>;
    }
  };

  return (
    <Card className="p-5 space-y-4 font-sans border border-border-default">
      {/* Header with Quick Add Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Actes, Prestations & Pièces ({items.length})
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Personnalisez les lignes, ajustez les quantités et modifiez les tarifs en un clic.
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setShowAddServiceModal(true)}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              + Prestation / Acte
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setShowAddPartModal(true)}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            >
              + Pièce du Stock
            </Button>
          </div>
        )}
      </div>

      {/* Lines Table */}
      {items.length === 0 ? (
        <div className="py-8 text-center bg-surface-base/50 rounded-xl border border-dashed border-border-default space-y-2">
          <p className="text-xs text-text-muted">Aucun acte ou pièce sur cet ordre de réparation.</p>
          {!readOnly && (
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddServiceModal(true)}>
                + Ajouter une prestation
              </Button>
              <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddPartModal(true)}>
                + Ajouter une pièce
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Désignation des Travaux / Pièce</th>
                <th className="py-2.5 px-3 w-28 text-center">Quantité</th>
                <th className="py-2.5 px-3 w-36 text-right">Prix Unitaire</th>
                <th className="py-2.5 px-3 w-32 text-right">Total Ligne</th>
                {!readOnly && <th className="py-2.5 px-3 w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60 text-xs">
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unit_price;
                const isPart = item.item_type === 'part' || Boolean(item.linked_part_id);
                const hasLowStock = isPart && item.linked_part_stock !== undefined && item.linked_part_stock !== null && item.linked_part_stock < item.quantity;

                return (
                  <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors group">
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-text-muted font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3">
                      {getItemTypeBadge(item.item_type)}
                    </td>

                    {/* Name & Notes */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {readOnly ? (
                          <span className="font-semibold text-text-primary block">{item.name}</span>
                        ) : (
                          <InlineEditCell
                            value={item.name}
                            onSave={(val) => onUpdateItem(item.id, { name: val })}
                            className="font-semibold text-text-primary block"
                          />
                        )}

                        {item.description && (
                          <span className="text-[11px] text-text-muted block truncate max-w-sm">
                            {item.description}
                          </span>
                        )}

                        {isPart && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.linked_part_sku && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-base border border-border-subtle text-text-muted">
                                SKU: {item.linked_part_sku}
                              </span>
                            )}
                            {item.linked_part_stock !== undefined && item.linked_part_stock !== null && (
                              <span className={`text-[10px] font-medium ${hasLowStock ? 'text-danger font-bold' : 'text-text-muted'}`}>
                                Stock dispo : {item.linked_part_stock} {item.unit || 'u'}
                                {hasLowStock && ' (Insuffisant)'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quantity & Unit */}
                    <td className="py-3 px-3 text-center">
                      {readOnly ? (
                        <span className="font-mono font-semibold text-text-primary">
                          {item.quantity} {item.unit || 'u'}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <InlineEditCell
                            type="number"
                            min={0.1}
                            step={item.unit === 'h' || item.unit === 'L' ? '0.1' : '1'}
                            value={item.quantity}
                            onSave={(val) => onUpdateItem(item.id, { quantity: parseFloat(val) || 1 })}
                            className="font-mono font-bold text-center"
                          />
                          <span className="text-[11px] text-text-muted font-mono">{item.unit || 'u'}</span>
                        </div>
                      )}
                    </td>

                    {/* Unit Price (Editable) */}
                    <td className="py-3 px-3 text-right">
                      {readOnly ? (
                        <span className="font-mono font-semibold text-text-primary">
                          <CurrencyDisplay amount={item.unit_price} currency={currency} />
                        </span>
                      ) : (
                        <InlineEditCell
                          type="number"
                          min={0}
                          step={100}
                          value={item.unit_price}
                          onSave={(val) => onUpdateItem(item.id, { unit_price: parseFloat(val) || 0 })}
                          suffix={` ${currency}`}
                          className="font-mono font-semibold text-right"
                        />
                      )}
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                      <CurrencyDisplay amount={lineTotal} currency={currency} />
                    </td>

                    {/* Action */}
                    {!readOnly && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-60 group-hover:opacity-100"
                          title="Supprimer la ligne"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Add Custom Service */}
      <Modal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Ajouter une Prestation / Acte Atelier"
        size="md"
      >
        <form onSubmit={handleCreateService} className="space-y-4 font-sans">
          <Input
            label="Désignation de la prestation"
            placeholder="Ex: Remplacement rotule de direction droite, Forfait Diagnostic..."
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Type de prestation
              </label>
              <select
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="service">Prestation Atelier</option>
                <option value="labor">Main d'œuvre</option>
                <option value="inspection">Contrôle / Diagnostic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Unité
              </label>
              <select
                value={newServiceUnit}
                onChange={(e) => setNewServiceUnit(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="forfait">Forfait</option>
                <option value="h">Heure (h)</option>
                <option value="u">Unité (u)</option>
                <option value="set">Jeu / Kit</option>
                <option value="roue">Par Roue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Prix Unitaire (DZD)"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              min="0"
              step="100"
              required
            />
            <Input
              type="number"
              label="Quantité"
              value={newServiceQty}
              onChange={(e) => setNewServiceQty(e.target.value)}
              min="0.1"
              step="0.5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Notes / Précisions techniques (Optionnel)
            </label>
            <textarea
              value={newServiceDescription}
              onChange={(e) => setNewServiceDescription(e.target.value)}
              rows={2}
              placeholder="Détails sur l'intervention ou la procédure suivie..."
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddServiceModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Ajouter la prestation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Inventory Part */}
      <Modal
        isOpen={showAddPartModal}
        onClose={() => setShowAddPartModal(false)}
        title="Sélectionner une Pièce du Stock"
        size="lg"
      >
        <form onSubmit={handleAddSelectedPart} className="space-y-4 font-sans">
          <Input
            placeholder="Rechercher par nom de pièce, référence SKU, catégorie..."
            value={partSearch}
            onChange={(e) => setPartSearch(e.target.value)}
            leftIcon={
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* Parts List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-border-subtle rounded-xl p-2 bg-surface-base/40">
            {filteredParts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">Aucune pièce trouvée dans le stock.</p>
            ) : (
              filteredParts.map((p) => {
                const isSelected = p.id === selectedPartId;
                const isOutOfStock = p.quantity_in_stock <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPart(p)}
                    className={`w-full p-2.5 rounded-lg text-left transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-accent/10 border-accent/60 text-text-primary'
                        : 'bg-surface-base border-border-subtle hover:border-border-default text-text-secondary'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-text-primary block">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">SKU: {p.sku}</span>
                        {p.category && (
                          <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface-raised">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-accent block">
                        <CurrencyDisplay amount={p.sale_price} currency={currency} />
                      </span>
                      <span className={`text-[10px] ${isOutOfStock ? 'text-danger font-bold' : 'text-text-muted'}`}>
                        Stock: {p.quantity_in_stock} {p.unit || 'u'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Part Overrides */}
          {selectedPartId && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-surface-raised rounded-xl border border-border-default">
              <Input
                type="number"
                label="Quantité à consommer"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(e.target.value)}
                min="1"
                required
              />
              <Input
                type="number"
                label={`Tarif unitaire (${currency})`}
                value={selectedPartCustomPrice}
                onChange={(e) => setSelectedPartCustomPrice(e.target.value)}
                min="0"
                step="50"
                helperText="Vous pouvez ajuster le tarif pour cet OR"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddPartModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!selectedPartId}>
              Attacher la pièce
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
