import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Button,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface PartUsed {
  item_id?: string;
  part_id: string;
  quantity: number;
  unit_price_snapshot?: number;
  name: string;
  sku: string;
  unit: string;
}

interface ActionPartsTableProps {
  partsUsed: PartUsed[];
  onOpenAttachModal: () => void;
  onRemovePart: (partId: string) => void;
  role?: string;
}

export function ActionPartsTable({
  partsUsed,
  onOpenAttachModal,
  onRemovePart,
  role,
}: ActionPartsTableProps) {
  const { t } = useI18n();

  const partsTotal = partsUsed.reduce(
    (acc, p) => acc + (p.unit_price_snapshot || 0) * p.quantity,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t.inventory.title}</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Total : <span className="font-bold text-text-primary">{partsTotal.toLocaleString()} {t.common.currency}</span>
          </p>
        </div>
        {role !== 'technician' && (
          <Button variant="primary" size="sm" onClick={onOpenAttachModal}>
            {t.inventory.addPart}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        <Table className="rounded-none border-0 shadow-none">
          <TableHeader>
            <tr>
              <TableHead>{t.inventory.reference}</TableHead>
              <TableHead>{t.inventory.name}</TableHead>
              <TableHead className="text-right">{t.inventory.stockQty}</TableHead>
              <TableHead className="text-right">{t.inventory.salePrice}</TableHead>
              <TableHead className="text-right">{t.invoices.totalTTC}</TableHead>
              {role !== 'technician' && <TableHead className="text-right">{t.common.actions_label}</TableHead>}
            </tr>
          </TableHeader>
          <TableBody>
            {partsUsed.length === 0 ? (
              <TableEmptyState
                colSpan={role !== 'technician' ? 6 : 5}
                title={t.common.empty}
                description={t.common.noData}
                action={
                  role !== 'technician' ? (
                    <Button variant="secondary" size="sm" onClick={onOpenAttachModal}>
                      {t.inventory.addPart}
                    </Button>
                  ) : null
                }
              />
            ) : (
              partsUsed.map((p) => {
                const total = (p.unit_price_snapshot || 0) * p.quantity;
                return (
                  <TableRow key={p.part_id || p.item_id}>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-bold text-text-primary">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {p.quantity} {p.unit || 'u'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-secondary">
                      {(p.unit_price_snapshot || 0).toLocaleString()} {t.common.currency}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-text-primary">
                      {total.toLocaleString()} {t.common.currency}
                    </TableCell>
                    {role !== 'technician' && (
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => onRemovePart(p.part_id || p.item_id!)}
                          className="text-text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
