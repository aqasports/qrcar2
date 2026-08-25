import React from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';

export interface InvoiceMeta {
  id?: string;
  invoice_number?: string;
  status?: string;
  total?: number | string;
}

export interface ActionHeaderData {
  id: string;
  type: string;
  plate_number?: string;
  make?: string;
  model?: string;
  vehicle_id?: string;
  status: string;
}

interface ActionHeaderProps {
  action: ActionHeaderData;
  invoice: InvoiceMeta | null;
  onGenerateInvoice: () => void;
  onDeleteAction: () => void;
  generatingInvoice: boolean;
  role?: string;
}

export function ActionHeader({
  action,
  invoice,
  onGenerateInvoice,
  onDeleteAction,
  generatingInvoice,
  role,
}: ActionHeaderProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Terminée</Badge>;
      case 'invoiced':
        return <Badge variant="info">Facturée</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>En Atelier</Badge>;
      case 'open':
        return <Badge variant="warning">Ouverte</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/actions" className="hover:text-text-primary transition-colors">
            Ordres de Réparation
          </Link>
          <span className="text-text-disabled">/</span>
          <Link href={`/admin/vehicles/${action.vehicle_id || ''}`} className="hover:text-text-primary transition-colors font-mono">
            {action.plate_number || 'Véhicule'}
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-primary font-medium">Intervention #{action.id.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight capitalize">
            {action.type} {action.make || action.model ? `— ${action.make || ''} ${action.model || ''}` : ''}
          </h1>
          {getStatusBadge(action.status)}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {invoice ? (
          <Link href={`/admin/invoices`}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Facture {invoice.invoice_number}{invoice.total !== undefined ? ` (${Number(invoice.total).toLocaleString()} DZD)` : ''}
            </Button>
          </Link>
        ) : (
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerateInvoice}
              isLoading={generatingInvoice}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              }
            >
              Générer la Facture
            </Button>
          )
        )}

        {(role === 'owner' || role === 'manager' || role === 'super_admin') && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDeleteAction}
            leftIcon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
