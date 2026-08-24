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

export default function MyMarketplaceListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketplace/listings?mine_only=true');
      if (!res.ok) throw new Error('Impossible de charger vos annonces.');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Erreur de mise à jour.');
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression.');
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">En Vente</Badge>;
      case 'sold':
        return <Badge variant="info">Vendu</Badge>;
      case 'reserved':
        return <Badge variant="warning">Réservé</Badge>;
      case 'archived':
        return <Badge variant="neutral">Archivé</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Mes Pièces en Vente sur le Réseau"
        subtitle="Gestion des offres déposées par votre atelier sur la place de marché inter-garages"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Marketplace', href: '/admin/marketplace' },
          { label: 'Mes Annonces' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/marketplace/inquiries">
              <Button variant="secondary" size="sm">
                Demandes Reçues
              </Button>
            </Link>
            <Link href="/admin/marketplace/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Nouvelle Annonce
              </Button>
            </Link>
          </div>
        }
      />

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Désignation Pièce</TableHead>
            <TableHead>Réf. OEM</TableHead>
            <TableHead className="text-right">Prix HT</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement de vos annonces..." />
          ) : listings.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucune annonce publiée"
              description="Vous n'avez actuellement aucune pièce proposée à la vente sur le réseau B2B."
              action={
                <Link href="/admin/marketplace/new">
                  <Button variant="primary" size="sm">
                    Déposer une Première Annonce
                  </Button>
                </Link>
              }
            />
          ) : (
            listings.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-text-primary">
                  {item.title}
                </TableCell>
                <TableCell className="font-mono text-xs text-text-muted">
                  {item.oem_number || '—'}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">
                  {Number(item.price).toLocaleString()} DZD
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {item.quantity} u
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'active' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoadingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'sold')}
                      >
                        Marquer Vendu
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoadingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'active')}
                      >
                        Remettre en Vente
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Supprimer
                    </Button>
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
