'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function MarketplaceInquiriesPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/marketplace/inquiries?type=${tab}`);
      if (!res.ok) throw new Error('Impossible de charger les demandes.');
      const data = await res.json();
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [tab]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Erreur de mise à jour.');
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getInquiryBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success">Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="danger">Refusée</Badge>;
      case 'pending':
        return <Badge variant="warning" pulse>En Attente</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Négociations & Demandes de Pièces"
        subtitle="Historique des sollicitations de prix et échanges directs entre garages"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Marketplace', href: '/admin/marketplace' },
          { label: 'Demandes' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/marketplace">
              <Button variant="secondary" size="sm">
                ← Catalogue
              </Button>
            </Link>
            <Link href="/admin/marketplace/my-listings">
              <Button variant="secondary" size="sm">
                Mes Annonces
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            tab === 'received'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Demandes Reçues (Mes Ventes)
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            tab === 'sent'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Demandes Envoyées (Mes Achats)
        </button>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Pièce / Annonce</TableHead>
            <TableHead>{tab === 'received' ? 'Acheteur' : 'Vendeur'}</TableHead>
            <TableHead className="text-right">Offre Proposée</TableHead>
            <TableHead>Message & Contact</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement des demandes..." />
          ) : inquiries.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucune demande répertoriée"
              description={
                tab === 'received'
                  ? 'Aucun acheteur ne vous a encore contacté pour vos pièces en vente.'
                  : 'Vous n’avez émis aucune demande de pièce récemment.'
              }
            />
          ) : (
            inquiries.map((inq) => (
              <TableRow key={inq.id}>
                <TableCell className="font-bold text-text-primary">
                  {inq.listing_title}
                </TableCell>
                <TableCell className="font-semibold text-text-secondary">
                  {tab === 'received' ? inq.buyer_org_name || 'Garage Acheteur' : inq.seller_org_name || 'Garage Vendeur'}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">
                  {inq.proposed_price ? `${Number(inq.proposed_price).toLocaleString()} DZD` : 'Prix Catalogue'}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-text-secondary line-clamp-1 block">{inq.message}</span>
                  {inq.buyer_phone && (
                    <span className="text-[11px] font-mono text-text-muted block mt-0.5">{inq.buyer_phone}</span>
                  )}
                </TableCell>
                <TableCell>{getInquiryBadge(inq.status)}</TableCell>
                <TableCell className="text-right">
                  {tab === 'received' && inq.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoadingId === inq.id}
                        onClick={() => handleUpdateStatus(inq.id, 'accepted')}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoadingId === inq.id}
                        onClick={() => handleUpdateStatus(inq.id, 'rejected')}
                      >
                        Refuser
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted font-mono">
                      {new Date(inq.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
