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
  Spinner,
} from '@/components/ui';

const ALL_SPECIALTIES = [
  { id: 'diagnostic', label: 'Diagnostic Électronique' },
  { id: 'injection', label: 'Injection Diesel & Essence' },
  { id: 'boite_auto', label: 'Boîtes Auto & DSG' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'reprogrammation', label: 'Reprogrammation Moteur' },
  { id: 'mecanique', label: 'Mécanique Générale' },
  { id: 'carrosserie', label: 'Carrosserie & Peinture' },
];

export default function AdminDirectorySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState<any>({
    slug: '',
    name: '',
    description: '',
    specialties: ['diagnostic', 'mecanique'],
    brands_serviced: ['Renault', 'Volkswagen', 'Peugeot'],
    opening_hours: {
      sat: '08:00 - 17:00',
      sun: '08:00 - 18:00',
      mon: '08:00 - 18:00',
      tue: '08:00 - 18:00',
      wed: '08:00 - 18:00',
      thu: '08:00 - 18:00',
      fri: 'Fermé',
    },
    wilaya: '16 - Alger',
    city: 'Alger',
    address: '',
    phone: '',
    email: '',
    is_directory_listed: true,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/directory-profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          ...data,
          specialties: Array.isArray(data.specialties) ? data.specialties : JSON.parse(data.specialties || '[]'),
          brands_serviced: Array.isArray(data.brands_serviced) ? data.brands_serviced : JSON.parse(data.brands_serviced || '[]'),
          opening_hours: data.opening_hours || {
            sat: '08:00 - 17:00',
            sun: '08:00 - 18:00',
            mon: '08:00 - 18:00',
            tue: '08:00 - 18:00',
            wed: '08:00 - 18:00',
            thu: '08:00 - 18:00',
            fri: 'Fermé',
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleSpecialty = (id: string) => {
    setProfile((prev: any) => {
      const current = prev.specialties || [];
      const updated = current.includes(id)
        ? current.filter((s: string) => s !== id)
        : [...current, id];
      return { ...prev, specialties: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/organization/directory-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil.');
      }

      setSuccess('Votre profil d’annuaire a été synchronisé et publié avec succès.');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement du profil public de l&apos;atelier...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Profil Annuaire & Visibilité Locale"
        subtitle="Votre page d'établissement public accessible aux automobilistes pour la prise de rendez-vous"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Profil Annuaire' },
        ]}
        actions={
          profile.slug ? (
            <Link href={`/annuaire/${profile.slug}`} target="_blank">
              <Button variant="secondary" size="sm">
                Voir Ma Page Publique ↗
              </Button>
            </Link>
          ) : null
        }
      />

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;Établissement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom Commercial de l'Atelier"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Identifiant URL Unique (Slug)"
              required
              value={profile.slug}
              onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="font-mono"
            />
          </div>

          <Textarea
            label="Présentation de l'Atelier & Équipements"
            rows={3}
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Wilaya"
              value={profile.wilaya}
              onChange={(e) => setProfile({ ...profile, wilaya: e.target.value })}
            >
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={`${w.code} - ${w.name}`}>
                  {w.code} - {w.name}
                </option>
              ))}
            </Select>
            <Input
              label="Commune / Ville"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
            <Input
              label="Téléphone Professionnel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <Input
            label="Adresse Complète"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Specialties Card */}
      <Card>
        <CardHeader>
          <CardTitle>Spécialités Techniques & Prestations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ALL_SPECIALTIES.map((spec) => {
              const isSelected = profile.specialties?.includes(spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleToggleSpecialty(spec.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-white shadow-lg shadow-blue-500/10'
                      : 'bg-surface-base border-border-subtle hover:border-border-default text-text-muted hover:text-text-primary'
                  }`}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Submission */}
      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <Button type="submit" isLoading={saving}>
          Enregistrer le Profil Annuaire
        </Button>
      </div>
    </form>
  );
}
