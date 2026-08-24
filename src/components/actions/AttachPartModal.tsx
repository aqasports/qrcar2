import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CatalogPartOption {
  id: string;
  name: string;
  sku: string;
  quantity_in_stock: number;
  sale_price: number;
  unit?: string;
}

interface AttachPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogParts: CatalogPartOption[];
  onAttachPart: (e: React.FormEvent) => void;
  isAttaching: boolean;
  attachError: string;
  partToAttachId: string;
  setPartToAttachId: (id: string) => void;
  attachQty: string;
  setAttachQty: (qty: string) => void;
}

export function AttachPartModal({
  isOpen,
  onClose,
  catalogParts,
  onAttachPart,
  isAttaching,
  attachError,
  partToAttachId,
  setPartToAttachId,
  attachQty,
  setAttachQty,
}: AttachPartModalProps) {
  const [search, setSearch] = useState('');

  const filteredParts = catalogParts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une Pièce du Stock"
      description="Sélectionnez un article du catalogue atelier pour l'imputer à cette intervention."
    >
      <form onSubmit={onAttachPart} className="space-y-4">
        {attachError && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
            {attachError}
          </div>
        )}

        <Input
          placeholder="Rechercher une pièce par nom ou référence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          label="Pièce en Stock"
          required
          value={partToAttachId}
          onChange={(e) => setPartToAttachId(e.target.value)}
        >
          <option value="">-- Choisir une référence --</option>
          {filteredParts.map((p) => (
            <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
              {p.name} [{p.sku}] — Stock: {p.quantity_in_stock} {p.unit || 'u'} — {p.sale_price.toLocaleString()} DZD
            </option>
          ))}
        </Select>

        <Input
          label="Quantité à Consommer"
          type="number"
          min="1"
          required
          value={attachQty}
          onChange={(e) => setAttachQty(e.target.value)}
        />

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isAttaching} className="flex-1">
            Imputer la Pièce
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
