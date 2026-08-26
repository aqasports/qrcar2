'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Spinner,
  EmptyState,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

const POPULAR_DTC = [
  'P0300', 'P0420', 'P0299', 'P0101', 'P0401', 'P0171', 'DF053', 'DF025', 'U0100', 'P2002'
];

export default function KnowledgebaseBrowsePage() {
  const { t } = useI18n();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dtcFilter, setDtcFilter] = useState('');
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dtcFilter) params.set('dtc', dtcFilter);
      if (search) params.set('search', search);
      if (make !== 'all') params.set('make', make);

      const res = await fetch(`/api/knowledgebase/solutions?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger les solutions.');
      const data = await res.json();
      setSolutions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [dtcFilter, make]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSolutions();
  };

  const handleVote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setVotingId(id);
      const res = await fetch(`/api/knowledgebase/solutions/${id}/vote`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Erreur de vote.');
      const data = await res.json();

      setSolutions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, upvotes_count: data.upvotes_count, has_user_voted: data.has_voted }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.knowledgebase.title}
        subtitle={t.knowledgebase.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.sidebar.knowledgebase },
        ]}
        actions={
          <Link href="/admin/knowledgebase/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.knowledgebase.shareSolution}
            </Button>
          </Link>
        }
      />

      {/* Quick DTC Filter Strip */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mr-2">
              {t.knowledgebase.popularCodes}
            </span>
            <button
              type="button"
              onClick={() => setDtcFilter('')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                dtcFilter === ''
                  ? 'bg-accent text-white'
                  : 'bg-surface-base border border-border-subtle text-text-muted hover:text-text-primary'
              }`}
            >
              {t.common.all}
            </button>
            {POPULAR_DTC.map((dtc) => (
              <button
                key={dtc}
                type="button"
                onClick={() => setDtcFilter(dtc === dtcFilter ? '' : dtc)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  dtcFilter === dtc
                    ? 'bg-accent text-white shadow-lg shadow-blue-500/20'
                    : 'bg-surface-base border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default'
                }`}
              >
                {dtc}
              </button>
            ))}
          </div>

          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder={t.knowledgebase.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              {t.common.search}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Solutions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">{t.common.loading}</p>
        </div>
      ) : solutions.length === 0 ? (
        <EmptyState
          title={t.common.empty}
          description={t.knowledgebase.noSolutions}
          action={
            <Link href="/admin/knowledgebase/new">
              <Button variant="primary" size="sm">
                {t.knowledgebase.shareSolution}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between hover:border-accent/40 transition-colors">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {item.dtc_code ? (
                      <Badge variant="danger" className="font-mono">
                        {item.dtc_code}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Diagnostic Général</Badge>
                    )}
                    <span className="text-[11px] font-mono text-text-muted">
                      {item.make ? `${item.make} ${item.model || ''}` : 'Universel'}
                    </span>
                  </div>

                  <CardTitle className="mt-2 line-clamp-2">
                    <Link href={`/admin/knowledgebase/${item.id}`} className="hover:text-accent transition-colors">
                      {item.title}
                    </Link>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {item.cause || item.procedure}
                  </p>

                  <div className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Auteur</span>
                      <span className="font-bold text-text-primary block">{item.author_name || 'Chef d’Atelier'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Atelier</span>
                      <span className="text-text-secondary block truncate max-w-[120px]">{item.org_name || 'Réseau Pro'}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border-subtle flex items-center justify-between">
                <Button
                  variant={item.has_user_voted ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={(e) => handleVote(e, item.id)}
                  leftIcon={
                    <svg className="w-3.5 h-3.5" fill={item.has_user_voted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  }
                >
                  {item.upvotes_count || 0} {t.knowledgebase.helpfulVotes}
                </Button>

                <Link
                  href={`/admin/knowledgebase/${item.id}`}
                  className="text-xs font-bold text-accent hover:text-accent-hover"
                >
                  {t.knowledgebase.readGuide}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
