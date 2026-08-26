'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Badge, Spinner } from '@/components/ui';

interface PvcDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId: string;
  designName: string;
  frontCanvasSvg?: string;
  backCanvasSvg?: string;
  onSuccess: (result: any) => void;
  defaultEmail?: string;
}

export function PvcDemandModal({
  isOpen,
  onClose,
  designId,
  designName,
  frontCanvasSvg,
  backCanvasSvg,
  onSuccess,
  defaultEmail = '',
}: PvcDemandModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [batchQuantity, setBatchQuantity] = useState('100');
  const [preferredFinish, setPreferredFinish] = useState<'Matte Silk' | 'Gloss UV' | 'Metallic Satin' | 'Brushed Carbon'>('Matte Silk');
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [safeZoneConfirmed, setSafeZoneConfirmed] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeZoneConfirmed) {
      setError('Veuillez confirmer que les éléments respectent les marges de sécurité.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Package SVGs into Data URIs if provided
      let frontRenderedBase64: string | undefined = undefined;
      let backRenderedBase64: string | undefined = undefined;

      if (frontCanvasSvg) {
        frontRenderedBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(frontCanvasSvg)))}`;
      }
      if (backCanvasSvg) {
        backRenderedBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(backCanvasSvg)))}`;
      }

      const payload = {
        requested_batch_quantity: parseInt(batchQuantity, 10) || 100,
        preferred_finish: preferredFinish,
        contact_email: contactEmail.trim(),
        submission_notes: submissionNotes.trim(),
        front_rendered_base64: frontRenderedBase64,
        back_rendered_base64: backRenderedBase64,
      };

      const res = await fetch(`/api/cards/designs/${designId}/demand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la transmission du protocole.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transmission du Protocole d'Impression PVC Usine (BAT)"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans">
        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Technical Specs Card */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Gabarit Industriel Standardisé : {designName}
            </span>
            <Badge variant="info">CR-80 ISO/IEC 7810</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-surface-base border border-border-subtle">
              <span className="text-text-muted block text-[10px]">Dimensions</span>
              <span className="font-bold text-text-primary">85.6 × 53.98 mm</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-base border border-border-subtle">
              <span className="text-text-muted block text-[10px]">Résolution</span>
              <span className="font-bold text-text-primary">300 DPI (HD)</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-base border border-border-subtle">
              <span className="text-text-muted block text-[10px]">Bord Perdu</span>
              <span className="font-bold text-accent">+3.0 mm</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-base border border-border-subtle">
              <span className="text-text-muted block text-[10px]">Puce Intégrée</span>
              <span className="font-bold text-emerald-400">NFC NTAG213</span>
            </div>
          </div>
        </div>

        {/* Batch Volume & Finish Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Volume de Cartes Souhaité
            </label>
            <select
              value={batchQuantity}
              onChange={(e) => setBatchQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="50">50 Cartes PVC Physiques (Lot Démarrage)</option>
              <option value="100">100 Cartes PVC Physiques (Recommandé Atelier)</option>
              <option value="250">250 Cartes PVC Physiques (Tarif Préférentiel)</option>
              <option value="500">500 Cartes PVC Physiques (Grand Atelier)</option>
              <option value="1000">1000 Cartes PVC Physiques (Réseau / Flotte)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Finition de Surface Plastique
            </label>
            <select
              value={preferredFinish}
              onChange={(e) => setPreferredFinish(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="Matte Silk">Soyeux Mat (Anti-reflets & anti-traces)</option>
              <option value="Gloss UV">Brillant Vernis UV Haute Protection</option>
              <option value="Metallic Satin">Satiné Effet Métallisé</option>
              <option value="Brushed Carbon">Texture Carbone Technique</option>
            </select>
          </div>
        </div>

        {/* Notification Coordinates */}
        <div>
          <Input
            type="email"
            label="Email pour Réception du Bon à Tirer (BAT)"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="atelier@exemple.com"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Instructions Spécifiques pour l'Atelier d'Impression
          </label>
          <textarea
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            rows={2}
            placeholder="Précisions de teinte, positionnement particulier, consignes de livraison..."
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Safe Zone Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-base border border-border-subtle cursor-pointer select-none">
          <input
            type="checkbox"
            checked={safeZoneConfirmed}
            onChange={(e) => setSafeZoneConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-border-default bg-surface-raised text-accent"
          />
          <span className="text-[11px] text-text-secondary leading-relaxed">
            Je confirme que l'ensemble des textes, logos et visuels se situent à l'intérieur de la zone sûre (marge de 3 mm) et ne masquent pas l'espace réservé au QR Code.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Transmettre le Protocole Usine →
          </Button>
        </div>
      </form>
    </Modal>
  );
}
