'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Textarea,
} from '@/components/ui';

export default function NewMechanicalSolutionPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    dtc_codes: '',
    make: 'Renault',
    model: '',
    engine_code: '',
    years: '',
    diagnostic_tool: '',
    symptoms: '',
    root_cause: '',
    step_by_step_fix: '',
    parts_replaced: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/knowledgebase/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');

      router.push(`/admin/knowledgebase`);
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Publier une Procédure Technique (Code DTC)"
        subtitle="Partagez un diagnostic éprouvé, une cause racine et une méthode de réparation avec la communauté"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Base de Connaissances', href: '/admin/knowledgebase' },
          { label: 'Nouvelle Fiche' },
        ]}
      />

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>1. Identification de la Panne & Véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Titre de la Panne & Symptôme Majeur"
            required
            placeholder="ex. Perte de puissance et mode dégradé avec voyant injection sur 1.5 dCi"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            label="Codes Défauts DTC Associés (séparés par des virgules)"
            required
            placeholder="ex. P0303, DF053, P0203"
            value={formData.dtc_codes}
            onChange={(e) => setFormData({ ...formData, dtc_codes: e.target.value.toUpperCase() })}
            className="font-mono font-bold text-accent"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Marque Constructeur"
              required
              placeholder="ex. Renault, Peugeot, VW"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            />
            <Input
              label="Modèle"
              placeholder="ex. Clio 4, 308, Golf 7"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            <Input
              label="Motorisation / Code Moteur"
              placeholder="ex. K9K 1.5 dCi 90ch"
              value={formData.engine_code}
              onChange={(e) => setFormData({ ...formData, engine_code: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Diagnostic & Procédure de Réparation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Symptômes Constatés à la Réception"
            rows={2}
            placeholder="Fumée noire à l'accélération, ralenti instable, démarrage difficile à froid..."
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          />

          <Textarea
            label="Cause Racine Identifiée (Root Cause)"
            required
            rows={3}
            placeholder="Origine réelle de la défaillance : faisceau pincé, électrovanne bloquée, fuite d'air après débitmètre..."
            value={formData.root_cause}
            onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
          />

          <Textarea
            label="Procédure de Dépannage Étape par Étape"
            required
            rows={4}
            placeholder="1. Contrôle à l'oscilloscope... 2. Démontage et nettoyage... 3. Calibrage avec l'outil de diagnostic..."
            value={formData.step_by_step_fix}
            onChange={(e) => setFormData({ ...formData, step_by_step_fix: e.target.value })}
          />

          <Input
            label="Pièces / Fournitures Remplacées"
            placeholder="ex. Électrovanne de turbo, joint cuivre injecteur n°3..."
            value={formData.parts_replaced}
            onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link href="/admin/knowledgebase">
          <Button variant="secondary">
            Annuler
          </Button>
        </Link>
        <Button
          type="submit"
          isLoading={submitting}
        >
          Publier la Fiche Technique
        </Button>
      </div>
    </form>
  );
}
