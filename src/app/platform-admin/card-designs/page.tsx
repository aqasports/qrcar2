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
  const [selectedInspectDesign, setSelectedInspectDesign] = useState<any | null>(null);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/card-designs');
      if (!res.ok) throw new Error('Impossible de charger les modèles de cartes.');
      const list = await res.json();
      if (Array.isArray(list)) setDesigns(list);
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
      if (selectedInspectDesign?.id === id) {
        setSelectedInspectDesign(null);
      }
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
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
        subtitle="Contrôle de conformité pré-impression (gabarit physique CR-80 300 DPI, contrastes QR, logos distants et marges de coupe)"
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
          En Attente BAT ({pendingCount})
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
          description="Les demandes de validation de cartes soumises par les ateliers apparaîtront ici avec leurs visuels hébergés."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => {
            const side = cardFlipState[d.id] || 'front';
            const frontImg = d.front_image_url || d.front_logo_url;
            const backImg = d.back_image_url;
            const demandPkg = typeof d.demand_package === 'string' ? JSON.parse(d.demand_package || '{}') : d.demand_package || {};

            return (
              <Card key={d.id} className="flex flex-col justify-between overflow-hidden border border-border-default">
                <CardHeader className="pb-3 border-b border-border-subtle bg-surface-raised/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-text-primary">{d.name}</CardTitle>
                      <span className="text-xs text-accent block mt-0.5 font-semibold">
                        {d.org_name || 'Atelier'}
                      </span>
                    </div>
                    {getDesignBadge(d.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4">
                  {/* CR-80 Live Card Preview */}
                  <div
                    onClick={() => toggleFlip(d.id)}
                    className="relative w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-border-default transition transform hover:scale-[1.01]"
                    style={{
                      backgroundColor: side === 'front' ? d.front_bg_color : d.back_bg_color,
                      color: side === 'front' ? d.front_text_color : d.back_text_color,
                    }}
                  >
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white pointer-events-none z-20">
                      {side === 'front' ? 'Recto' : 'Verso'} (cliquer pour tourner)
                    </div>

                    {side === 'front' ? (
                      <div className="p-4 h-full flex flex-col justify-between relative overflow-hidden">
                        {/* Watermark */}
                        {frontImg && d.front_image_position === 'background_watermark' && (
                          <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                            style={{ opacity: parseFloat(d.front_image_opacity) || 0.2 }}
                          >
                            <img src={frontImg} alt="Watermark" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 z-10">
                          {frontImg && d.front_image_position !== 'background_watermark' ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 p-0.5">
                              <img src={frontImg} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                              style={{ backgroundColor: d.front_accent_color }}
                            >
                              GP
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs block leading-tight">{d.front_headline || 'Atelier'}</span>
                            <span className="text-[9px] opacity-75 block">{d.front_subheadline || 'Passeport Véhicule'}</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono opacity-60 z-10">CARTE D’IDENTITÉ VÉHICULE (CR-80)</div>
                      </div>
                    ) : (
                      <div className="p-4 h-full flex justify-between items-center text-[9px] relative overflow-hidden">
                        {backImg && (
                          <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                            style={{ opacity: parseFloat(d.back_image_opacity) || 0.2 }}
                          >
                            <img src={backImg} alt="Watermark Back" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="space-y-1 z-10 max-w-[60%]">
                          <span className="font-bold block text-text-primary">{d.back_contact_phone || 'Non renseigné'}</span>
                          <span className="opacity-80 block line-clamp-2">{d.back_address || 'Adresse atelier'}</span>
                        </div>
                        <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center z-10 shadow">
                          <div className="w-full h-full bg-surface-base rounded-sm flex items-center justify-center text-[6px] text-white font-mono">
                            QR
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Production specs summary */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2.5 rounded-xl bg-surface-base border border-border-subtle">
                    <div>
                      <span className="text-text-muted block">Lot Demandé :</span>
                      <span className="font-bold text-text-primary">{d.requested_batch_quantity || 100} cartes</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Logo Distant :</span>
                      <span className="font-bold text-accent">
                        {frontImg ? 'Hébergé CDN' : 'Non fourni'}
                      </span>
                    </div>
                  </div>

                  {d.submission_notes && (
                    <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-[11px] text-text-secondary">
                      <span className="font-bold text-text-primary block text-[10px] uppercase">Notes Atelier :</span>
                      <p className="mt-0.5">{d.submission_notes}</p>
                    </div>
                  )}

                  {d.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-[11px]">
                      Motif refus : {d.rejection_reason}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-3 border-t border-border-subtle bg-surface-base flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setSelectedInspectDesign(d)}
                  >
                    Détails Protocole
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {d.status === 'submitted' && (
                      <>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => {
                            setRejectingDesign(d);
                            setRejectionReason('');
                          }}
                        >
                          Refuser
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          isLoading={actionLoadingId === d.id}
                          onClick={() => handleReview(d.id, 'approve')}
                        >
                          Valider BAT
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Protocol Inspector Modal */}
      {selectedInspectDesign && (
        <Modal
          isOpen={Boolean(selectedInspectDesign)}
          onClose={() => setSelectedInspectDesign(null)}
          title={`Protocole d'Impression Usine : ${selectedInspectDesign.name}`}
          size="lg"
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-default flex items-center justify-between">
              <div>
                <span className="font-bold text-text-primary text-sm block">{selectedInspectDesign.org_name}</span>
                <span className="text-[11px] text-text-muted">Formule : {selectedInspectDesign.plan_name || 'Standard'}</span>
              </div>
              {getDesignBadge(selectedInspectDesign.status)}
            </div>

            {/* Third-Party Hosted Images Section */}
            <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-2">
              <span className="font-bold text-text-primary uppercase text-[10px] tracking-wider block">
                Actifs Graphiques Hébergés sur Serveur Distant (CDN)
              </span>

              <div className="space-y-2">
                {(selectedInspectDesign.front_image_url || selectedInspectDesign.front_logo_url) && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-raised border border-border-subtle">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedInspectDesign.front_image_url || selectedInspectDesign.front_logo_url}
                        alt="Logo"
                        className="w-8 h-8 object-contain rounded bg-black/20 p-0.5"
                      />
                      <span className="font-mono text-[11px] truncate max-w-[280px]">
                        {selectedInspectDesign.front_image_url || selectedInspectDesign.front_logo_url}
                      </span>
                    </div>
                    <a
                      href={selectedInspectDesign.front_image_url || selectedInspectDesign.front_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-accent/15 text-accent font-bold text-[11px] hover:bg-accent/25 transition"
                    >
                      Ouvrir / Télécharger HD ↗
                    </a>
                  </div>
                )}

                {selectedInspectDesign.back_image_url && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-raised border border-border-subtle">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedInspectDesign.back_image_url}
                        alt="Watermark"
                        className="w-8 h-8 object-contain rounded bg-black/20 p-0.5"
                      />
                      <span className="font-mono text-[11px] truncate max-w-[280px]">
                        {selectedInspectDesign.back_image_url}
                      </span>
                    </div>
                    <a
                      href={selectedInspectDesign.back_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-accent/15 text-accent font-bold text-[11px] hover:bg-accent/25 transition"
                    >
                      Ouvrir HD ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions in Inspector */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <Button variant="secondary" size="sm" onClick={() => setSelectedInspectDesign(null)}>
                Fermer
              </Button>
              {selectedInspectDesign.status === 'submitted' && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setRejectingDesign(selectedInspectDesign);
                      setRejectionReason('');
                    }}
                  >
                    Refuser
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReview(selectedInspectDesign.id, 'approve')}
                  >
                    Valider BAT Usine
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingDesign && (
        <Modal
          isOpen={Boolean(rejectingDesign)}
          onClose={() => setRejectingDesign(null)}
          title="Refuser le Modèle (Motif Technique)"
          size="md"
        >
          <div className="space-y-4 font-sans">
            <p className="text-xs text-text-muted">
              Indiquez la raison du refus (résolution image insuffisante, texte hors zone sûre, contraste insuffisant) pour que l'atelier puisse corriger son modèle.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Motif du Refus
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Le logo importé déborde de la marge de sécurité de 3mm. Veuillez le redimensionner."
                rows={3}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button variant="secondary" size="sm" onClick={() => setRejectingDesign(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectionReason.trim()}
                onClick={() => handleReview(rejectingDesign.id, 'reject', rejectionReason)}
              >
                Confirmer le Refus
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
