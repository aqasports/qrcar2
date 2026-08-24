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

interface PartUsed {
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
  const partsTotal = partsUsed.reduce(
    (acc, p) => acc + (p.unit_price_snapshot || 0) * p.quantity,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pièces & Fournitures Consommées</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Total pièces : <span className="font-bold text-text-primary">{partsTotal.toLocaleString()} DZD</span>
          </p>
        </div>
        {role !== 'technician' && (
          <Button variant="primary" size="sm" onClick={onOpenAttachModal}>
            Ajouter une Pièce
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        <Table className="rounded-none border-0 shadow-none">
          <TableHeader>
            <tr>
              <TableHead>Référence / SKU</TableHead>
              <TableHead>Désignation Pièce</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Prix Unitaire</TableHead>
              <TableHead className="text-right">Total HT</TableHead>
              {role !== 'technician' && <TableHead className="text-right">Action</TableHead>}
            </tr>
          </TableHeader>
          <TableBody>
            {partsUsed.length === 0 ? (
              <TableEmptyState
                colSpan={role !== 'technician' ? 6 : 5}
                title="Aucune pièce enregistrée"
                description="Aucune pièce du stock atelier n'a encore été rattachée à cette intervention."
                action={
                  role !== 'technician' ? (
                    <Button variant="secondary" size="sm" onClick={onOpenAttachModal}>
                      Ajouter une Pièce du Stock
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
                      {(p.unit_price_snapshot || 0).toLocaleString()} DZD
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-text-primary">
                      {total.toLocaleString()} DZD
                    </TableCell>
                    {role !== 'technician' && (
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => onRemovePart(p.part_id || p.item_id!)}
                          className="text-text-muted hover:text-danger p-1 rounded transition-colors"
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
