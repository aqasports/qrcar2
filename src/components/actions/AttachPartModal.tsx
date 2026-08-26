import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface CatalogPartOption {
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
  const { t } = useI18n();
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
      title={t.inventory.addPart}
      description={t.inventory.subtitle}
    >
      <form onSubmit={onAttachPart} className="space-y-4 font-sans">
        {attachError && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
            {attachError}
          </div>
        )}

        <Input
          placeholder={t.inventory.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          label={t.inventory.name}
          required
          value={partToAttachId}
          onChange={(e) => setPartToAttachId(e.target.value)}
        >
          <option value="">-- {t.inventory.category} --</option>
          {filteredParts.map((p) => (
            <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
              {p.name} [{p.sku}] — {t.inventory.stockQty}: {p.quantity_in_stock} {p.unit || 'u'} — {p.sale_price.toLocaleString()} {t.common.currency}
            </option>
          ))}
        </Select>

        <Input
          label={t.inventory.stockQty}
          type="number"
          min="1"
          required
          value={attachQty}
          onChange={(e) => setAttachQty(e.target.value)}
        />

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isAttaching} className="flex-1">
            {t.common.save}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
