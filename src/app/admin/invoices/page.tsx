'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Badge,
  Button,
} from '@/components/ui';

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  plate_number: string;
  client_name: string;
  action_type: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && role !== 'technician') {
      fetchInvoices();
    }
  }, [role]);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Impossible de mettre à jour le statut de la facture');
      } else {
        fetchInvoices();
      }
    } catch (err) {
      alert('Erreur réseau lors de la mise à jour.');
    } finally {
      setUpdatingId('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Réglée</Badge>;
      case 'issued':
        return <Badge variant="warning">Émise / En attente</Badge>;
      case 'draft':
        return <Badge variant="neutral">Brouillon</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Annulée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (role === 'technician') {
    return (
      <div className="text-danger p-8 text-center bg-surface-raised border border-danger/20 rounded-2xl max-w-xl mx-auto space-y-2">
        <h3 className="font-bold">Accès Restreint</h3>
        <p className="text-xs text-text-muted">
          La gestion de la facturation et des règlements est réservée aux chefs d&apos;atelier et administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Facturation & Règlements"
        subtitle="Suivi des factures de réparations, états d'encaissement et exports comptables"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Factures' },
        ]}
      />

      {/* Invoices Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Numéro Facture</TableHead>
            <TableHead>Client & Véhicule</TableHead>
            <TableHead>Type d&apos;Intervention</TableHead>
            <TableHead className="text-right">Montant HT</TableHead>
            <TableHead className="text-right">TVA (19%)</TableHead>
            <TableHead className="text-right">Total TTC</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={8} message="Chargement des factures atelier..." />
          ) : invoices.length === 0 ? (
            <TableEmptyState
              colSpan={8}
              title="Aucune facture émise"
              description="Les factures sont générées directement depuis les ordres de réparation terminés."
              action={
                <Link href="/admin/actions">
                  <Button variant="primary" size="sm">
                    Consulter les Interventions
                  </Button>
                </Link>
              }
            />
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono font-bold text-text-primary">
                  {inv.invoice_number}
                </TableCell>
                <TableCell>
                  <span className="font-bold text-text-primary block">{inv.client_name}</span>
                  <span className="text-text-muted font-mono text-xs block">{inv.plate_number}</span>
                </TableCell>
                <TableCell className="capitalize text-text-secondary">
                  {inv.action_type}
                </TableCell>
                <TableCell className="text-right font-mono text-text-muted">
                  {Number(inv.subtotal).toLocaleString()} DZD
                </TableCell>
                <TableCell className="text-right font-mono text-text-muted">
                  {Number(inv.tax_amount).toLocaleString()} DZD
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">
                  {Number(inv.total).toLocaleString()} DZD
                </TableCell>
                <TableCell>{getStatusBadge(inv.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {inv.status !== 'paid' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={updatingId === inv.id}
                        onClick={() => handleUpdateStatus(inv.id, 'paid')}
                      >
                        Encaisser
                      </Button>
                    )}
                    <a
                      href={`/api/invoices/${inv.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-accent hover:text-accent-hover p-1.5 rounded hover:bg-surface-overlay transition-colors"
                      title="Télécharger PDF"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
