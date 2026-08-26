'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import FlippablePvcCard from '@/components/FlippablePvcCard';
import {
  PageHeader,
  Card as UiCard,
  CardHeader,
  CardTitle,
  CardContent,
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
  Input,
  Select,
} from '@/components/ui';

interface PvcCardItem {
  id: string;
  token: string;
  serial_label: string;
  status: 'unassigned' | 'active' | 'revoked' | 'lost';
  vehicle_id: string | null;
  plate_number?: string;
  make?: string;
  model?: string;
  linked_at: string | null;
  revoked_at: string | null;
}

export default function CardsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [cards, setCards] = useState<PvcCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchCount, setBatchCount] = useState('24');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState<'3d' | 'table'>('3d');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<PvcCardItem | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setCards(rawList);
        if (rawList.length > 0 && !selectedPreviewCard) {
          setSelectedPreviewCard(rawList[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(batchCount, 10) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenError(data.error || 'Erreur lors de la génération du lot');
      } else {
        setSuccessMsg(data.message);
        fetchCards();
      }
    } catch (err) {
      setGenError('Impossible de contacter le serveur.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    if (!statusFilter) return true;
    return c.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active / Liée</Badge>;
      case 'unassigned':
        return <Badge variant="info">En Stock (Vierge)</Badge>;
      case 'revoked':
        return <Badge variant="danger">Révoquée</Badge>;
      case 'lost':
        return <Badge variant="warning">Perdue</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Passeports & Cartes PVC Connectées"
        subtitle="Gestion du stock physique de cartes, impression planches A4 et personnalisation studio"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Cartes PVC' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/admin/cards/studio">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                }
              >
                Studio Graphique PVC
              </Button>
            </Link>

            <Link href="/admin/cards/order">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
              >
                Commander Cartes Pro
              </Button>
            </Link>

            <a
              href="/api/cards/print?status=unassigned"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                }
              >
                Imprimer Planche A4
              </Button>
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Batch Generator & 3D Preview */}
        <div className="space-y-6 lg:col-span-1">
          {/* 3D Preview Card */}
          <UiCard>
            <CardHeader>
              <CardTitle>Aperçu Virtuel Holographique</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 bg-surface-base">
              {selectedPreviewCard ? (
                <FlippablePvcCard
                  token={selectedPreviewCard.token}
                  serialLabel={selectedPreviewCard.serial_label}
                  status={selectedPreviewCard.status}
                  vehiclePlate={selectedPreviewCard.plate_number}
                  vehicleMakeModel={
                    selectedPreviewCard.make
                      ? `${selectedPreviewCard.make} ${selectedPreviewCard.model}`
                      : undefined
                  }
                  size="md"
                  showControls={true}
                />
              ) : (
                <div className="text-center py-12 text-xs text-text-muted">
                  Sélectionnez une carte pour visualiser son rendu.
                </div>
              )}
            </CardContent>
          </UiCard>

          {/* Batch Generator */}
          {role !== 'technician' && (
            <UiCard>
              <CardHeader>
                <CardTitle>Générateur de Lot de Cartes</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateBatch} className="space-y-4">
                  {genError && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
                      {genError}
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                      {successMsg}
                    </div>
                  )}

                  <Select
                    label="Nombre de cartes vierges à générer"
                    value={batchCount}
                    onChange={(e) => setBatchCount(e.target.value)}
                  >
                    <option value="8">8 cartes (1 page A4 standard)</option>
                    <option value="16">16 cartes (2 pages A4)</option>
                    <option value="24">24 cartes (3 pages A4)</option>
                    <option value="48">48 cartes (6 pages A4)</option>
                    <option value="96">96 cartes (Paquet Atelier)</option>
                  </Select>

                  <Button type="submit" isLoading={generating} className="w-full">
                    Générer le Lot de Cartes
                  </Button>
                </form>
              </CardContent>
            </UiCard>
          )}
        </div>

        {/* Right Column: Cards Table & Filter */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-xs w-full">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts ({cards.length})</option>
                <option value="unassigned">Cartes Vierges en Stock</option>
                <option value="active">Cartes Actives (Liées)</option>
                <option value="revoked">Cartes Révoquées</option>
              </Select>
            </div>

            <span className="text-xs text-text-muted font-mono font-bold">
              {filteredCards.length} carte(s) affichée(s)
            </span>
          </div>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>Numéro de Série</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Véhicule Assigné</TableHead>
                <TableHead>Date d&apos;Association</TableHead>
                <TableHead className="text-right">Aperçu</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState colSpan={5} message="Chargement des cartes PVC..." />
              ) : filteredCards.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  title="Aucune carte dans ce filtre"
                  description="Générez un lot de cartes vierges pour approvisionner votre stock atelier."
                />
              ) : (
                filteredCards.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => setSelectedPreviewCard(c)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono font-bold text-text-primary">
                      {c.serial_label}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>
                      {c.plate_number ? (
                        <Link
                          href={`/admin/vehicles/${c.vehicle_id}`}
                          className="font-mono text-xs text-accent hover:underline font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.plate_number} ({c.make} {c.model})
                        </Link>
                      ) : (
                        <span className="text-text-muted text-xs">Non liée</span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-muted text-xs whitespace-nowrap">
                      {c.linked_at ? new Date(c.linked_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreviewCard(c);
                        }}
                      >
                        Visualiser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
