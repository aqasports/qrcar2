'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Spinner,
} from '@/components/ui';

export default function WorkshopSettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    brand_color_primary: '#0f172a',
    brand_color_secondary: '#3b82f6',
    locale: 'fr',
    currency: 'DZD',
    timezone: 'Africa/Algiers',
    address: '',
    phone: '',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/branding');
      if (!res.ok) throw new Error('Impossible de charger les paramètres.');
      const data = await res.json();
      setFormData({
        name: data.name || '',
        logo_url: data.logo_url || '',
        brand_color_primary: data.brand_color_primary || '#0f172a',
        brand_color_secondary: data.brand_color_secondary || '#3b82f6',
        locale: data.locale || 'fr',
        currency: data.currency || 'DZD',
        timezone: data.timezone || 'Africa/Algiers',
        address: data.address || '',
        phone: data.phone || '',
      });
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/organization/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      }

      setSuccess(true);
      if (formData.locale !== locale) {
        setLocale(formData.locale as any);
      }
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement des paramètres d&apos;atelier...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Paramètres de l'Atelier"
        subtitle="Identité de l'entreprise, coordonnées de facturation, logo et préférences linguistiques"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Paramètres' },
        ]}
      />

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          Paramètres enregistrés avec succès !
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Identité & Coordonnées Commerciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Raison Sociale de l'Atelier"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Téléphone d'Atelier"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Adresse de l'Atelier"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label="URL du Logo de l'Établissement"
            placeholder="https://..."
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Regional & System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences Régionales & Langue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Langue de l'Interface"
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
            >
              <option value="fr">Français</option>
              <option value="ar">العربية (Arabe)</option>
              <option value="en">English</option>
            </Select>

            <Select
              label="Devise Comptable"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="DZD">Dinar Algérien (DZD)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </Select>

            <Select
              label="Fuseau Horaire"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="Africa/Algiers">Afrique / Alger (UTC+1)</option>
              <option value="Europe/Paris">Europe / Paris (UTC+1/+2)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Submission */}
      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <Button type="submit" isLoading={saving}>
          Enregistrer les Paramètres
        </Button>
      </div>
    </form>
  );
}
