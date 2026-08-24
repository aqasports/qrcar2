'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Spinner,
} from '@/components/ui';

const CATEGORIES = [
  { id: 'motorisation', label: 'Moteur & Injection' },
  { id: 'freinage', label: 'Système de Freinage' },
  { id: 'transmission', label: 'Boîte & Transmission' },
  { id: 'suspension', label: 'Suspension & Direction' },
  { id: 'electronique', label: 'Électronique & Calculateurs' },
  { id: 'carrosserie', label: 'Carrosserie & Vitrage' },
  { id: 'eclairage', label: 'Optiques & Éclairage' },
  { id: 'climatisation', label: 'Climatisation & Chauffage' },
];

const CONDITIONS = [
  { id: 'new_oem', label: 'Neuf Origine Constructeur (OEM)' },
  { id: 'new_aftermarket', label: 'Neuf Adaptable Certifié' },
  { id: 'used_tested', label: 'Occasion Testée & Garantie' },
  { id: 'refurbished', label: 'Reconditionné Atelier' },
];

export default function NewMarketplaceListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quotaDetails, setQuotaDetails] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    oem_number: '',
    category: 'motorisation',
    condition: 'used_tested',
    compatibility_makes: '',
    compatibility_models: '',
    compatibility_years: '',
    price: '',
    quantity: '1',
    location_wilaya: '16 - Alger',
    description: '',
  });

  useEffect(() => {
    async function checkPlan() {
      try {
        setLoading(true);
        const res = await fetch('/api/billing');
        if (res.ok) {
          const data = await res.json();
          setQuotaDetails(data?.details?.plan);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkPlan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');

      router.push('/admin/marketplace/my-listings');
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Vérification des droits de publication...</p>
      </div>
    );
  }

  const maxListings = quotaDetails?.marketplaceListingsPerMonth ?? 0;
  const isStarterBlocked = maxListings === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Publier une Pièce sur la Place de Marché"
        subtitle="Vendez vos pièces neuves, occasions testées ou surstocks aux autres ateliers professionnels"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Marketplace', href: '/admin/marketplace' },
          { label: 'Nouvelle Annonce' },
        ]}
      />

      {isStarterBlocked && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-4">
          <span>
            Le forfait <strong>Starter</strong> permet uniquement d&apos;acheter des pièces. Pour publier et vendre, passez au forfait <strong>Pro</strong>.
          </span>
          <Link href="/admin/billing">
            <Button variant="primary" size="sm">
              Débloquer Vendeur Pro
            </Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>1. Identification & Spécifications de la Pièce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Titre de l'Annonce"
              required
              placeholder="ex. Turbo Garrett 1.6 HDI 110ch Reconditionné"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              label="Référence Constructeur / OEM"
              placeholder="ex. 0375N0 / 753420-5005S"
              value={formData.oem_number}
              onChange={(e) => setFormData({ ...formData, oem_number: e.target.value.toUpperCase() })}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Catégorie Mécanique"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>

            <Select
              label="État de la Pièce"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Prix de Vente HT (DZD)"
              type="number"
              required
              placeholder="ex. 45000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Input
              label="Quantité Disponible"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <Select
              label="Wilaya de Stockage"
              value={formData.location_wilaya}
              onChange={(e) => setFormData({ ...formData, location_wilaya: e.target.value })}
            >
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={`${w.code} - ${w.name}`}>
                  {w.code} - {w.name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description Détaillée & Conditions de Garantie"
            rows={4}
            placeholder="Origine, kilométrage d'extraction, test sur banc d'essai, conditions d'échange standard..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link href="/admin/marketplace">
          <Button variant="secondary">
            Annuler
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isStarterBlocked}
          isLoading={submitting}
        >
          Publier l&apos;Annonce B2B
        </Button>
      </div>
    </form>
  );
}
