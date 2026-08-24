'use client';

import React, { useEffect, useState } from 'react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
} from '@/components/ui';

export default function PlatformAdminCardDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingDesign, setRejectingDesign] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cardFlipState, setCardFlipState] = useState<Record<string, 'front' | 'back'>>({});

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/card-designs');
      if (!res.ok) throw new Error('Impossible de charger les modèles de cartes.');
      const list = await res.json();
      setDesigns(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/platform-admin/card-designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejection_reason: reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la validation.');
      }

      await fetchDesigns();
      setRejectingDesign(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleFlip = (id: string) => {
    setCardFlipState((prev) => ({
      ...prev,
      [id]: prev[id] === 'back' ? 'front' : 'back',
    }));
  };

  const filtered = designs.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const pendingCount = designs.filter((d) => d.status === 'submitted').length;

  if (loading && designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement des modèles PVC...</p>
      </div>
    );
  }

  const getDesignBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">BAT Validé Usine</Badge>;
      case 'submitted':
        return <Badge variant="warning" pulse>En Attente BAT</Badge>;
      case 'rejected':
        return <Badge variant="danger">Refusé</Badge>;
      default:
        return <Badge variant="neutral">Brouillon</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Validation Technique des Modèles PVC (BAT Usine)"
        subtitle="Contrôle de conformité pré-impression (gabarit physique CR-80 300 DPI, contrastes QR et marges de coupe)"
        breadcrumbs={[
          { label: 'Platform Admin', href: '/platform-admin' },
          { label: 'BAT Cartes PVC' },
        ]}
        badge={<Badge variant="danger">Super Admin</Badge>}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          type="button"
          onClick={() => setFilter('submitted')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'submitted'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          En Attente ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('approved')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'approved'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Validés
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'rejected'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Refusés
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'all'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Tous les Modèles ({designs.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun modèle de carte dans ce filtre"
          description="Les demandes de validation de cartes soumises par les garages apparaîtront ici."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => {
            const side = cardFlipState[d.id] || 'front';
            return (
              <Card key={d.id} className="flex flex-col justify-between overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm">{d.name}</CardTitle>
                      <span className="text-xs text-text-muted block mt-0.5 font-medium">{d.org_name || 'Atelier'}</span>
                    </div>
                    {getDesignBadge(d.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* CR-80 Live Card Preview */}
                  <div
                    onClick={() => toggleFlip(d.id)}
                    className="relative w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-border-default transition transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: side === 'front' ? d.front_bg_color : d.back_bg_color,
                      color: side === 'front' ? d.front_text_color : d.back_text_color,
                    }}
                  >
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white pointer-events-none">
                      {side === 'front' ? 'Recto' : 'Verso'} (cliquer pour tourner)
                    </div>

                    {side === 'front' ? (
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                            style={{ backgroundColor: d.front_accent_color }}
                          >
                            GP
                          </div>
                          <div>
                            <span className="font-bold text-xs block leading-tight">{d.front_headline}</span>
                            <span className="text-[9px] opacity-75 block">{d.front_subheadline}</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono opacity-60">CARTE D’IDENTITÉ VÉHICULE</div>
                      </div>
                    ) : (
                      <div className="p-4 h-full flex justify-between items-center text-[9px]">
                        <div className="space-y-1">
                          <span className="font-bold block text-text-primary">{d.back_contact_phone}</span>
                          <span className="opacity-80 block line-clamp-2">{d.back_address}</span>
                        </div>
                        <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                          <div className="w-full h-full bg-slate-900 rounded-sm"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {d.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-[11px]">
                      Motif refus : {d.rejection_reason}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
                  {d.status === 'submitted' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoadingId === d.id}
                        onClick={() => handleReview(d.id, 'approve')}
                      >
                        Valider BAT Usine
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejectingDesign(d);
                          setRejectionReason('');
                        }}
                      >
                        Refuser
                      </Button>
                    </>
                  )}
                  {d.status === 'approved' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejectingDesign(d);
                        setRejectionReason('');
                      }}
                    >
                      Révoquer BAT
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectingDesign)}
        onClose={() => setRejectingDesign(null)}
        title="Refus Technique du Modèle PVC"
        description={`Indiquez les corrections à apporter par le garage pour le modèle : ${rejectingDesign?.name}`}
      >
        <div className="space-y-4">
          <Textarea
            label="Motif du Refus Technique (BAT)"
            required
            rows={3}
            placeholder="Logo trop proche du bord (marge de coupe < 3mm), contraste QR code insuffisant, texte illisible..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3">
            <Button
              variant="danger"
              className="flex-1"
              isLoading={actionLoadingId === rejectingDesign?.id}
              onClick={() => rejectingDesign && handleReview(rejectingDesign.id, 'reject', rejectionReason)}
            >
              Confirmer le Refus
            </Button>
            <Button variant="secondary" onClick={() => setRejectingDesign(null)} className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
