'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  Spinner,
  Tabs,
} from '@/components/ui';
import { CardImageAdder, CardImageSettings } from '@/components/cards/CardImageAdder';
import { PvcDemandModal } from '@/components/cards/PvcDemandModal';

interface CardDesign {
  id?: string;
  name: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  layout_preset: string;
  front_logo_url: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  front_image_position: 'header_logo' | 'top_right' | 'center_emblem' | 'background_watermark' | 'custom_badge';
  front_image_opacity: number;
  front_image_scale: number;
  back_image_position: 'header_logo' | 'top_right' | 'center_emblem' | 'background_watermark' | 'custom_badge';
  back_image_opacity: number;
  back_image_scale: number;
  front_rendered_preview_url?: string | null;
  back_rendered_preview_url?: string | null;
  front_headline: string;
  front_subheadline: string;
  front_bg_color: string;
  front_accent_color: string;
  front_text_color: string;
  back_bg_color: string;
  back_text_color: string;
  back_contact_phone: string;
  back_address: string;
  back_emergency_text: string;
  is_white_label: boolean;
  rejection_reason?: string | null;
  submission_notes?: string | null;
  contact_email?: string | null;
  requested_batch_quantity?: number;
}

const PRESETS = [
  {
    id: 'modern_slate',
    name: 'Modern Slate',
    front_bg: '#0f172a',
    front_accent: '#3b82f6',
    front_text: '#ffffff',
    back_bg: '#0f172a',
    back_text: '#94a3b8',
  },
  {
    id: 'carbon_fiber',
    name: 'Carbon High-Tech',
    front_bg: '#18181b',
    front_accent: '#ef4444',
    front_text: '#f4f4f5',
    back_bg: '#18181b',
    back_text: '#a1a1aa',
  },
  {
    id: 'gold_luxury',
    name: 'Executive Gold',
    front_bg: '#1c1917',
    front_accent: '#eab308',
    front_text: '#fef08a',
    back_bg: '#1c1917',
    back_text: '#d6d3d1',
  },
  {
    id: 'classic_automotive',
    name: 'Classic Workshop',
    front_bg: '#022c22',
    front_accent: '#10b981',
    front_text: '#ecfdf5',
    back_bg: '#022c22',
    back_text: '#a7f3d0',
  },
  {
    id: 'clean_minimal',
    name: 'Clean Monochrome',
    front_bg: '#1e293b',
    front_accent: '#64748b',
    front_text: '#f8fafc',
    back_bg: '#1e293b',
    back_text: '#94a3b8',
  },
];

export default function CardStudioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [showSafeMargin, setShowSafeMargin] = useState(true);
  const [studioTier, setStudioTier] = useState<'template' | 'full' | 'full_whitelabel'>('full');
  const [activeTab, setActiveTab] = useState('images');
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  const [currentDesign, setCurrentDesign] = useState<CardDesign>({
    name: 'Modèle Principal Atelier',
    status: 'draft',
    layout_preset: 'modern_slate',
    front_logo_url: '',
    front_image_url: '',
    back_image_url: '',
    front_image_position: 'header_logo',
    front_image_opacity: 1.0,
    front_image_scale: 100,
    back_image_position: 'background_watermark',
    back_image_opacity: 0.2,
    back_image_scale: 80,
    front_headline: 'GARAGE AUTO PRECISION',
    front_subheadline: 'Passeport d’Entretien & Diagnostic Véhicule',
    front_bg_color: '#0f172a',
    front_accent_color: '#3b82f6',
    front_text_color: '#ffffff',
    back_bg_color: '#0f172a',
    back_text_color: '#94a3b8',
    back_contact_phone: '0550 12 34 56',
    back_address: 'Route Nationale 5, Bab Ezzouar, Alger',
    back_emergency_text: 'Assistance & Dépannage Atelier 24/7',
    is_white_label: false,
    requested_batch_quantity: 100,
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const planRes = await fetch('/api/billing');
      if (planRes.ok) {
        const planData = await planRes.json();
        setStudioTier(planData?.details?.plan?.cardStudioTier || 'full');
      }

      const res = await fetch('/api/cards/designs');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setDesigns(list);
          if (list.length > 0) {
            const first = list[0];
            setCurrentDesign({
              ...first,
              front_image_position: first.front_image_position || 'header_logo',
              front_image_opacity: parseFloat(first.front_image_opacity) || 1.0,
              front_image_scale: parseInt(first.front_image_scale, 10) || 100,
              back_image_position: first.back_image_position || 'background_watermark',
              back_image_opacity: parseFloat(first.back_image_opacity) || 0.2,
              back_image_scale: parseInt(first.back_image_scale, 10) || 80,
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCurrentDesign((prev) => ({
      ...prev,
      layout_preset: preset.id,
      front_bg_color: preset.front_bg,
      front_accent_color: preset.front_accent,
      front_text_color: preset.front_text,
      back_bg_color: preset.back_bg,
      back_text_color: preset.back_text,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const url = currentDesign.id ? `/api/cards/designs/${currentDesign.id}` : '/api/cards/designs';
      const method = currentDesign.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDesign),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de sauvegarde.');

      setCurrentDesign(data);
      setSuccess('Modèle de carte enregistré avec succès en mode brouillon.');
      fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemandSuccess = (result: any) => {
    setSuccess(`Demande ${result.demandId || ''} transmise avec succès à notre atelier de production !`);
    if (result.design) {
      setCurrentDesign(result.design);
    }
    fetchInitialData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement du Studio PVC...</p>
      </div>
    );
  }

  const isReadOnly = currentDesign.status === 'submitted' || currentDesign.status === 'approved';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">BAT Validé pour impression</Badge>;
      case 'submitted':
        return <Badge variant="info" pulse>En validation usine</Badge>;
      case 'rejected':
        return <Badge variant="danger">Refusé</Badge>;
      default:
        return <Badge variant="neutral">Brouillon</Badge>;
    }
  };

  const currentFrontImage = currentDesign.front_image_url || currentDesign.front_logo_url;
  const currentBackImage = currentDesign.back_image_url;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 font-sans">
      <PageHeader
        title="Studio Design Cartes PVC (Format CR-80)"
        subtitle="Personnalisation physique haute fidélité (85.6mm × 53.98mm à 300 DPI) avec téléversement distant d'images et protocole d'impression usine."
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Cartes PVC', href: '/admin/cards' },
          { label: 'Studio Graphique' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {getStatusBadge(currentDesign.status)}

            {!isReadOnly && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={saving}
                >
                  Enregistrer Brouillon
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!currentDesign.id) {
                      handleSave().then(() => setShowDemandModal(true));
                    } else {
                      setShowDemandModal(true);
                    }
                  }}
                  leftIcon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  }
                >
                  Transmettre Demande Usine (BAT)
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}

      {currentDesign.status === 'rejected' && currentDesign.rejection_reason && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs space-y-1">
          <span className="font-bold block">Motif du Refus Technique par l'Atelier d'Impression :</span>
          <p>{currentDesign.rejection_reason}</p>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive CR-80 Card Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-surface-raised border border-border-subtle p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSide === 'front' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Recto (Face Principale)
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSide === 'back' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Verso (QR & Coordonnées)
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSafeMargin}
                onChange={(e) => setShowSafeMargin(e.target.checked)}
                className="rounded border-border-default bg-surface-base text-accent"
              />
              <span>Zone Sûre 3mm</span>
            </label>
          </div>

          {/* CR-80 Physical Card Canvas */}
          <div
            ref={cardRef}
            className="relative w-full aspect-[85.6/53.98] rounded-3xl shadow-2xl overflow-hidden border-2 border-border-default transition-all select-none"
          >
            {/* Safe Zone Overlay */}
            {showSafeMargin && (
              <div className="absolute inset-3.5 border border-dashed border-cyan-400/40 rounded-2xl pointer-events-none z-30 flex items-start justify-end p-2">
                <span className="text-[8px] font-mono text-cyan-400/70 uppercase tracking-widest font-bold">
                  Gabarit Usine CR-80
                </span>
              </div>
            )}

            {/* FRONT FACE */}
            {activeSide === 'front' && (
              <div
                className="w-full h-full p-6 flex flex-col justify-between relative overflow-hidden transition-colors"
                style={{
                  backgroundColor: currentDesign.front_bg_color,
                  color: currentDesign.front_text_color,
                }}
              >
                {/* Background Watermark Image if selected */}
                {currentFrontImage && currentDesign.front_image_position === 'background_watermark' && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                    style={{ opacity: currentDesign.front_image_opacity }}
                  >
                    <img
                      src={currentFrontImage}
                      alt="Watermark"
                      className="max-w-none object-contain"
                      style={{
                        width: `${currentDesign.front_image_scale * 2.5}%`,
                        maxHeight: '180%',
                      }}
                    />
                  </div>
                )}

                {/* Accent Glow */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none z-0"
                  style={{ backgroundColor: currentDesign.front_accent_color }}
                />

                {/* Front Header */}
                <div className="flex items-start justify-between z-10 relative">
                  <div className="flex items-center gap-3">
                    {/* Header Logo or Center Emblem */}
                    {currentFrontImage && currentDesign.front_image_position === 'header_logo' ? (
                      <div
                        className="rounded-xl overflow-hidden flex items-center justify-center bg-white/5 p-1 backdrop-blur-sm border border-white/10"
                        style={{
                          width: `${(currentDesign.front_image_scale / 100) * 48}px`,
                          height: `${(currentDesign.front_image_scale / 100) * 48}px`,
                          opacity: currentDesign.front_image_opacity,
                        }}
                      >
                        <img
                          src={currentFrontImage}
                          alt="Logo Atelier"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : currentFrontImage && currentDesign.front_image_position === 'top_right' ? null : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm shrink-0"
                        style={{ backgroundColor: currentDesign.front_accent_color }}
                      >
                        GP
                      </div>
                    )}

                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight leading-tight">
                        {currentDesign.front_headline || 'NOM DE VOTRE ATELIER'}
                      </h3>
                      <p className="text-[10px] opacity-75 font-medium mt-0.5">
                        {currentDesign.front_subheadline || 'Passeport d’Entretien Numérique'}
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Area (Smart Card Chip or Custom Logo) */}
                  <div className="flex items-center gap-2">
                    {currentFrontImage && currentDesign.front_image_position === 'top_right' && (
                      <div
                        className="rounded-xl overflow-hidden flex items-center justify-center p-1"
                        style={{
                          width: `${(currentDesign.front_image_scale / 100) * 44}px`,
                          height: `${(currentDesign.front_image_scale / 100) * 44}px`,
                          opacity: currentDesign.front_image_opacity,
                        }}
                      >
                        <img
                          src={currentFrontImage}
                          alt="Badge"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Gold Smart Chip */}
                    <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border border-amber-300 shadow-inner flex items-center justify-center shrink-0">
                      <div className="w-6 h-5 border border-amber-700/50 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-amber-700/40 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Emblem Placement */}
                {currentFrontImage && currentDesign.front_image_position === 'center_emblem' && (
                  <div
                    className="flex items-center justify-center z-10 my-auto"
                    style={{ opacity: currentDesign.front_image_opacity }}
                  >
                    <img
                      src={currentFrontImage}
                      alt="Emblème"
                      className="object-contain"
                      style={{
                        width: `${(currentDesign.front_image_scale / 100) * 72}px`,
                        maxHeight: '64px',
                      }}
                    />
                  </div>
                )}

                {/* Front Footer */}
                <div className="flex items-end justify-between z-10 relative">
                  <div>
                    <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest block">
                      CARTE D’IDENTITÉ VÉHICULE
                    </span>
                    <span className="text-xs font-mono font-bold tracking-wider opacity-90">
                      TOKEN: 7F8A-99B2-E401
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentFrontImage && currentDesign.front_image_position === 'custom_badge' && (
                      <img
                        src={currentFrontImage}
                        alt="Badge"
                        className="object-contain mr-1"
                        style={{
                          width: `${(currentDesign.front_image_scale / 100) * 36}px`,
                          maxHeight: '36px',
                          opacity: currentDesign.front_image_opacity,
                        }}
                      />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider">NFC Connecté</span>
                  </div>
                </div>
              </div>
            )}

            {/* BACK FACE */}
            {activeSide === 'back' && (
              <div
                className="w-full h-full p-6 flex flex-row justify-between items-center relative overflow-hidden transition-colors"
                style={{
                  backgroundColor: currentDesign.back_bg_color,
                  color: currentDesign.back_text_color,
                }}
              >
                {/* Back Watermark Image if present */}
                {currentBackImage && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                    style={{ opacity: currentDesign.back_image_opacity }}
                  >
                    <img
                      src={currentBackImage}
                      alt="Back Watermark"
                      className="max-w-none object-contain"
                      style={{
                        width: `${currentDesign.back_image_scale * 2.5}%`,
                        maxHeight: '180%',
                      }}
                    />
                  </div>
                )}

                <div className="w-[58%] h-full flex flex-col justify-between z-10 relative">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                      Scannez pour accéder à l'historique
                    </span>
                    <p className="text-[9px] opacity-80 leading-relaxed">
                      {currentDesign.back_address || 'Adresse de l’atelier et localisation.'}
                    </p>
                  </div>

                  <div>
                    <div className="text-[9px] font-semibold opacity-75">Tél. Atelier & RDV :</div>
                    <div className="text-sm font-mono font-bold">
                      {currentDesign.back_contact_phone || '0550 00 00 00'}
                    </div>
                    {currentDesign.back_emergency_text && (
                      <div className="text-[8px] text-amber-400 mt-1 font-medium">
                        {currentDesign.back_emergency_text}
                      </div>
                    )}
                  </div>

                  <div className="text-[8px] opacity-50 font-mono">
                    {currentDesign.is_white_label ? 'CERTIFIED SMART VEHICLE' : 'POWERED BY GARAGE PRO'}
                  </div>
                </div>

                <div className="w-[38%] flex flex-col items-center justify-center z-10 relative">
                  <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                    <div className="w-full h-full bg-surface-base rounded-lg p-1.5 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white"></div>
                        </div>
                        <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white"></div>
                        </div>
                        <div className="text-[5px] text-white font-mono font-bold">QR PASS</div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-text-muted mt-1.5 uppercase tracking-wider">
                    Jeton Unique
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controls & Image Adder (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Tabs
            variant="pills"
            activeKey={activeTab}
            onChange={setActiveTab}
            tabs={[
              { key: 'images', label: 'Images & Logo Usine' },
              { key: 'texts', label: 'Textes & Coordonnées' },
              { key: 'presets', label: 'Préréglages Styles' },
            ]}
          />

          {/* TAB 1: Images & Logos (Third-party Upload) */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              {/* Front Image / Logo Adder */}
              <CardImageAdder
                side="front"
                title="Visuel & Logo Recto (Face Principale)"
                description="Téléversez votre logo d'atelier ou emblème. Il sera hébergé sur serveur distant pour la fabrication."
                disabled={isReadOnly}
                imageSettings={{
                  url: currentDesign.front_image_url || currentDesign.front_logo_url,
                  position: currentDesign.front_image_position,
                  opacity: currentDesign.front_image_opacity,
                  scale: currentDesign.front_image_scale,
                }}
                onChange={(settings) =>
                  setCurrentDesign((prev) => ({
                    ...prev,
                    front_image_url: settings.url,
                    front_logo_url: settings.url,
                    front_image_position: settings.position,
                    front_image_opacity: settings.opacity,
                    front_image_scale: settings.scale,
                  }))
                }
              />

              {/* Back Image / Watermark Adder */}
              <CardImageAdder
                side="back"
                title="Filigrane & Logo Verso (Optionnel)"
                description="Ajoutez un filigrane subtil ou un sceau au verso sans gêner la lisibilité du QR Code."
                disabled={isReadOnly}
                imageSettings={{
                  url: currentDesign.back_image_url,
                  position: currentDesign.back_image_position,
                  opacity: currentDesign.back_image_opacity,
                  scale: currentDesign.back_image_scale,
                }}
                onChange={(settings) =>
                  setCurrentDesign((prev) => ({
                    ...prev,
                    back_image_url: settings.url,
                    back_image_position: settings.position,
                    back_image_opacity: settings.opacity,
                    back_image_scale: settings.scale,
                  }))
                }
              />
            </div>
          )}

          {/* TAB 2: Texts & Information */}
          {activeTab === 'texts' && (
            <Card className="border border-border-default">
              <CardHeader>
                <CardTitle>Informations Imprimées sur la Carte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nom du Modèle de Carte"
                  required
                  disabled={isReadOnly}
                  value={currentDesign.name}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, name: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="En-tête Recto"
                    disabled={isReadOnly}
                    value={currentDesign.front_headline}
                    onChange={(e) => setCurrentDesign({ ...currentDesign, front_headline: e.target.value })}
                  />
                  <Input
                    label="Sous-titre Recto"
                    disabled={isReadOnly}
                    value={currentDesign.front_subheadline}
                    onChange={(e) => setCurrentDesign({ ...currentDesign, front_subheadline: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Téléphone Verso"
                    disabled={isReadOnly}
                    value={currentDesign.back_contact_phone}
                    onChange={(e) => setCurrentDesign({ ...currentDesign, back_contact_phone: e.target.value })}
                  />
                  <Input
                    label="Texte Assistance / Urgence"
                    disabled={isReadOnly}
                    value={currentDesign.back_emergency_text}
                    onChange={(e) => setCurrentDesign({ ...currentDesign, back_emergency_text: e.target.value })}
                  />
                </div>

                <Input
                  label="Adresse Imprimée"
                  disabled={isReadOnly}
                  value={currentDesign.back_address}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, back_address: e.target.value })}
                />
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Presets & Colors */}
          {activeTab === 'presets' && (
            <Card className="border border-border-default">
              <CardHeader>
                <CardTitle>Styles & Nuanciers Préréglés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESETS.map((preset) => {
                    const selected = currentDesign.layout_preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          selected
                            ? 'border-accent bg-accent/15 text-white shadow-lg shadow-blue-500/10'
                            : 'border-border-subtle bg-surface-base text-text-muted hover:border-border-default'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.front_accent }}
                          />
                          <span className="text-xs font-bold">{preset.name}</span>
                        </div>
                        {selected && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PVC Demand Transmission Modal */}
      {currentDesign.id && (
        <PvcDemandModal
          isOpen={showDemandModal}
          onClose={() => setShowDemandModal(false)}
          designId={currentDesign.id}
          designName={currentDesign.name}
          onSuccess={handleDemandSuccess}
          defaultEmail={currentDesign.contact_email || ''}
        />
      )}
    </div>
  );
}
