'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

const CATEGORIES = [
  { id: 'all', label: 'Toutes les Catégories' },
  { id: 'motorisation', label: 'Moteur & Injection' },
  { id: 'freinage', label: 'Système de Freinage' },
  { id: 'transmission', label: 'Boîte & Transmission' },
  { id: 'suspension', label: 'Suspension & Direction' },
  { id: 'electronique', label: 'Électronique & Calculateurs' },
  { id: 'carrosserie', label: 'Carrosserie & Vitrage' },
  { id: 'eclairage', label: 'Optiques & Éclairage' },
  { id: 'climatisation', label: 'Climatisation & Chauffage' },
];

export default function MarketplaceBrowsePage() {
  const { t } = useI18n();

  const CONDITIONS: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'neutral' }> = {
    new_oem: { label: t.marketplace.conditionNew, variant: 'success' },
    new_aftermarket: { label: 'Neuf Adaptable Certifié', variant: 'info' },
    used_tested: { label: t.marketplace.conditionUsed, variant: 'warning' },
    refurbished: { label: t.marketplace.conditionRefurbished, variant: 'neutral' },
  };

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [wilaya, setWilaya] = useState('all');

  // Inquiry modal
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');
  const [inquiryError, setInquiryError] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (condition !== 'all') params.set('condition', condition);
      if (wilaya !== 'all') params.set('wilaya', wilaya);

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger les annonces.');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, condition, wilaya]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    try {
      setSendingInquiry(true);
      setInquiryError('');
      setInquirySuccess('');

      const res = await fetch('/api/marketplace/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: selectedListing.id,
          message: inquiryMsg,
          proposed_price: proposedPrice ? parseFloat(proposedPrice) : null,
          buyer_phone: buyerPhone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’envoi de la demande.');

      setInquirySuccess('Votre demande a été transmise instantanément à l’atelier vendeur !');
      setTimeout(() => {
        setSelectedListing(null);
        setInquiryMsg('');
        setProposedPrice('');
        setBuyerPhone('');
        setInquirySuccess('');
      }, 1500);
    } catch (err: any) {
      setInquiryError(err.message || 'Erreur');
    } finally {
      setSendingInquiry(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.marketplace.title}
        subtitle={t.marketplace.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.sidebar.marketplace },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/admin/marketplace/my-listings">
              <Button variant="secondary" size="sm">
                Mes Annonces
              </Button>
            </Link>
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
                {t.marketplace.publishListing}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-surface-raised border border-border-subtle grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder={t.marketplace.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>

        <Select
          value={wilaya}
          onChange={(e) => setWilaya(e.target.value)}
        >
          <option value="all">{t.marketplace.allWilayas}</option>
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w.code} value={w.name}>
              {w.code} - {w.name}
            </option>
          ))}
        </Select>
      </form>

      {/* Grid of Listings */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">{t.common.loading}</p>
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title={t.common.empty}
          description={t.marketplace.noListings}
          action={
            <Link href="/admin/marketplace/new">
              <Button variant="primary" size="sm">
                {t.marketplace.publishListing}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const cond = CONDITIONS[item.condition] || { label: item.condition, variant: 'neutral' };
            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={cond.variant}>{cond.label}</Badge>
                      <span className="text-[11px] font-mono text-text-muted">
                        {item.wilaya || 'Algérie'}
                      </span>
                    </div>
                    <CardTitle className="mt-2 line-clamp-1">{item.title}</CardTitle>
                    {item.part_number && (
                      <span className="text-[11px] font-mono text-text-muted block">
                        Réf. {item.part_number}
                      </span>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {item.description || 'Pièce disponible en stock atelier.'}
                    </p>

                    <div className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-text-muted block">Atelier Vendeur</span>
                        <span className="text-xs font-bold text-text-primary block">{item.org_name || 'Garage Partenaire'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-text-muted block">{t.common.quantity}</span>
                        <span className="text-xs font-mono font-bold text-text-primary">{item.quantity} u</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black font-mono text-accent">
                      {Number(item.price).toLocaleString()} {t.common.currency}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedListing(item);
                      setInquiryMsg('');
                      setProposedPrice('');
                      setInquiryError('');
                      setInquirySuccess('');
                    }}
                  >
                    {t.marketplace.contactSeller}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contact / Inquiry Modal */}
      <Modal
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        title={t.marketplace.contactSeller}
        description={selectedListing ? `${selectedListing.title} (${selectedListing.price?.toLocaleString()} ${t.common.currency})` : ''}
      >
        <form onSubmit={handleSendInquiry} className="space-y-4">
          {inquiryError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {inquiryError}
            </div>
          )}
          {inquirySuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              {inquirySuccess}
            </div>
          )}

          <Textarea
            label="Votre Message ou Question Technique"
            required
            rows={3}
            placeholder="Disponibilité immédiate, compatibilité avec châssis, expédition Yalidine..."
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Proposition Tarifaire (${t.common.currency}, Optionnel)`}
              type="number"
              placeholder={selectedListing?.price?.toString()}
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
            />
            <Input
              label={t.clients.phone}
              type="tel"
              placeholder="0550 12 34 56"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={sendingInquiry} className="flex-1">
              {t.messages.send}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSelectedListing(null)} className="flex-1">
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
