'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Spinner,
} from '@/components/ui';

export default function MechanicalSolutionDetailPage() {
  const { id } = useParams() as { id: string };

  const [solution, setSolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  const fetchSolution = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/knowledgebase/solutions/${id}`);
      if (!res.ok) throw new Error('Solution introuvable.');
      const data = await res.json();
      setSolution(data);
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolution();
  }, [id]);

  const handleVote = async () => {
    try {
      setVoting(true);
      const res = await fetch(`/api/knowledgebase/solutions/${id}/vote`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur lors du vote.');
      const data = await res.json();
      setSolution((prev: any) => ({
        ...prev,
        upvotes_count: data.upvotes_count,
        has_user_voted: data.has_voted,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement de la fiche technique...</p>
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <p className="text-sm text-danger font-bold">Cette procédure technique est introuvable.</p>
        <Link href="/admin/knowledgebase">
          <Button variant="secondary" size="sm">
            ← Retour à la Base
          </Button>
        </Link>
      </div>
    );
  }

  const dtcList = Array.isArray(solution.dtc_codes)
    ? solution.dtc_codes
    : typeof solution.dtc_codes === 'string'
    ? JSON.parse(solution.dtc_codes || '[]')
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 font-sans">
      <PageHeader
        title={solution.title}
        subtitle={`Procédure validée pour : ${solution.make || 'Toutes marques'} ${solution.model || ''}`}
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Base de Connaissances', href: '/admin/knowledgebase' },
          { label: 'Fiche Technique' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant={solution.has_user_voted ? 'primary' : 'secondary'}
              size="sm"
              isLoading={voting}
              onClick={handleVote}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill={solution.has_user_voted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              }
            >
              {solution.upvotes_count || 0} Votes Utiles
            </Button>
          </div>
        }
      />

      {/* DTC Codes Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Codes DTC :</span>
        {dtcList.map((dtc: string) => (
          <Badge key={dtc} variant="danger" size="md" className="font-mono">
            {dtc}
          </Badge>
        ))}
      </div>

      {/* Main Solution Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Cause Racine Constatée (Root Cause)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {solution.root_cause || solution.cause}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Procédure de Réparation Étape par Étape</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono bg-surface-base p-4 rounded-xl border border-border-subtle">
              {solution.step_by_step_fix || solution.procedure}
            </p>
          </CardContent>
        </Card>

        {solution.parts_replaced && (
          <Card>
            <CardHeader>
              <CardTitle>3. Pièces Remplacées & Fournitures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-primary text-sm font-medium">
                {solution.parts_replaced}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Author Strip */}
      <div className="p-4 rounded-2xl bg-surface-base border border-border-subtle flex items-center justify-between text-xs">
        <span className="text-text-muted">
          Rédigé par <strong className="text-text-primary">{solution.author_name || 'Chef d’Atelier'}</strong> ({solution.org_name || 'Atelier Partenaire'})
        </span>
        <span className="text-text-muted font-mono">
          Publié le {new Date(solution.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </div>
  );
}
