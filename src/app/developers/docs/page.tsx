'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Card } from '@/components/ui';

export default function DeveloperDocsPage() {
  const [activeTab, setActiveTab] = useState<'auth' | 'rest' | 'graphql' | 'webhooks' | 'sandbox'>('auth');
  const [sandboxEndpoint, setSandboxEndpoint] = useState('/api/public/v1/me');
  const [sandboxMethod, setSandboxMethod] = useState('GET');
  const [sandboxKey, setSandboxKey] = useState('gmp_live_samplekey123');
  const [sandboxBody, setSandboxBody] = useState('{}');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const runSandboxTest = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      const options: RequestInit = {
        method: sandboxMethod,
        headers: {
          Authorization: `Bearer ${sandboxKey}`,
          'Content-Type': 'application/json',
        },
      };
      if (sandboxMethod !== 'GET') {
        options.body = sandboxBody;
      }
      const res = await fetch(sandboxEndpoint, options);
      const text = await res.text();
      try {
        setSandboxResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setSandboxResponse(text);
      }
    } catch (err: any) {
      setSandboxResponse(`Erreur réseau: ${err.message}`);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-sans">
      {/* Navbar */}
      <header className="border-b border-border-subtle bg-surface-raised/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center font-mono font-bold text-white text-xs shadow-md">
            API
          </div>
          <div>
            <span className="font-black tracking-tight text-text-primary text-sm">qrCar Developer Hub</span>
            <span className="text-[10px] text-accent font-mono ml-2">REST & GraphQL v1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/api"
            className="text-xs font-bold text-text-muted hover:text-text-primary transition"
          >
            Gérer mes Clés API
          </Link>
          <Link href="/admin">
            <Button variant="secondary" size="sm">
              Console Cockpit
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3">Documentation API</span>
          <nav className="space-y-1">
            {[
              { id: 'auth', label: '1. Authentification & Clés' },
              { id: 'rest', label: '2. Endpoints REST v1' },
              { id: 'graphql', label: '3. Schéma GraphQL' },
              { id: 'webhooks', label: '4. Signatures Webhooks' },
              { id: 'sandbox', label: '5. Console Interactive' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-accent/15 border border-accent/30 text-accent font-black'
                    : 'text-text-muted hover:bg-surface-raised hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-border-subtle px-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Quotas & Limites</span>
            <p className="text-[11px] text-text-secondary">Starter: 100 req/min (10k/mois)</p>
            <p className="text-[11px] text-text-secondary">Pro: 500 req/min (100k/mois)</p>
            <p className="text-[11px] text-text-secondary">Enterprise: 2000 req/min (1M/mois)</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-8">
          {activeTab === 'auth' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">Authentification Bearer Token</h2>
                <p className="text-xs text-text-muted mt-1">
                  Toutes les requêtes API doivent inclure votre clé secrète sous le header HTTP Authorization.
                </p>
              </div>

              <Card className="p-5 space-y-3">
                <span className="text-xs font-bold text-text-secondary">Format du Header HTTP</span>
                <pre className="p-3.5 rounded-xl bg-surface-base text-accent font-mono text-xs border border-border-subtle">
                  Authorization: Bearer gmp_live_xxxxxxxxxxxxxxxxxxxxxxxx
                </pre>
              </Card>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-primary">Scopes de permissions granulaires :</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { scope: 'read:vehicles', desc: 'Lecture du parc automobile et fiches techniques' },
                    { scope: 'write:vehicles', desc: 'Création et mise à jour des véhicules' },
                    { scope: 'read:actions', desc: 'Lecture de l’historique d’interventions' },
                    { scope: 'write:actions', desc: 'Création et clôture d’ordres de réparation' },
                    { scope: 'read:stock', desc: 'Consultation du stock de pièces et alertes' },
                    { scope: 'write:stock', desc: 'Ajustement et sorties magasin de pièces' },
                    { scope: 'read:invoices', desc: 'Consultation des factures et règlements' },
                    { scope: 'write:invoices', desc: 'Émission et validation de devis/factures' },
                  ].map((s) => (
                    <Card key={s.scope} className="p-3.5 space-y-1">
                      <code className="text-xs font-mono font-bold text-accent">{s.scope}</code>
                      <p className="text-[11px] text-text-muted">{s.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'rest' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">Endpoints REST v1</h2>
                <p className="text-xs text-text-muted mt-1">Endpoints versionnés et strictement isolés par tenant (Row Level Security).</p>
              </div>

              <div className="space-y-3">
                {[
                  { m: 'GET', path: '/api/public/v1/me', desc: 'Informations sur l’organisation et limites de quota' },
                  { m: 'GET', path: '/api/public/v1/vehicles', desc: 'Lister les véhicules du parc avec filtres' },
                  { m: 'POST', path: '/api/public/v1/vehicles', desc: 'Créer un nouveau véhicule' },
                  { m: 'GET', path: '/api/public/v1/vehicles/:id', desc: 'Fiche détaillée d’un véhicule et passeport QR' },
                  { m: 'GET', path: '/api/public/v1/actions', desc: 'Lister les interventions atelier' },
                  { m: 'POST', path: '/api/public/v1/actions', desc: 'Créer un ordre de réparation' },
                  { m: 'POST', path: '/api/public/v1/actions/:id/complete', desc: 'Clôturer un ordre de réparation' },
                  { m: 'GET', path: '/api/public/v1/parts', desc: 'Consulter l’inventaire du magasin de pièces' },
                  { m: 'POST', path: '/api/public/v1/parts/:id/stock', desc: 'Ajuster la quantité en stock d’une pièce' },
                  { m: 'GET', path: '/api/public/v1/invoices', desc: 'Lister les factures émises' },
                ].map((ep, i) => (
                  <Card key={i} className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                        ep.m === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {ep.m}
                      </span>
                      <code className="text-xs font-mono font-bold text-text-primary">{ep.path}</code>
                    </div>
                    <p className="text-xs text-text-muted">{ep.desc}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'graphql' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">API GraphQL</h2>
                <p className="text-xs text-text-muted mt-1">
                  Exécutez des requêtes composites flexibles via notre endpoint unique <code>/api/public/v1/graphql</code>.
                </p>
              </div>

              <Card className="p-5 space-y-3">
                <span className="text-xs font-bold text-text-secondary">Exemple de Requête Query</span>
                <pre className="p-4 rounded-xl bg-surface-base text-purple-300 font-mono text-xs border border-border-subtle overflow-x-auto">
{`query GetGarageVehicles {
  organization {
    name
    plan_slug
  }
  vehicles(limit: 10) {
    id
    plate_number
    make
    model
    current_mileage
    actions {
      id
      type
      description
      status
    }
  }
}`}
                </pre>
              </Card>
            </section>
          )}

          {activeTab === 'webhooks' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">Vérification des Signatures Webhooks</h2>
                <p className="text-xs text-text-muted mt-1">
                  Chaque payload envoyé à vos endpoints webhooks contient une signature HMAC SHA-256 dans le header <code>x-gmp-signature</code>.
                </p>
              </div>

              <Card className="p-5 space-y-2">
                <span className="text-xs font-bold text-text-secondary">Exemple de Vérification en Node.js</span>
                <pre className="p-4 rounded-xl bg-surface-base text-emerald-400 font-mono text-xs border border-border-subtle overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payloadRaw, signatureHeader, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadRaw);
  const calculated = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(signatureHeader));
}`}
                </pre>
              </Card>
            </section>
          )}

          {activeTab === 'sandbox' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">Sandbox & Testeur Interactif</h2>
                <p className="text-xs text-text-muted mt-1">
                  Testez en direct les endpoints REST avec vos clés d’API.
                </p>
              </div>

              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">Méthode</label>
                    <select
                      value={sandboxMethod}
                      onChange={(e) => setSandboxMethod(e.target.value)}
                      className="w-full bg-surface-base border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary font-bold"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-text-muted block mb-1">Chemin Endpoint</label>
                    <input
                      type="text"
                      value={sandboxEndpoint}
                      onChange={(e) => setSandboxEndpoint(e.target.value)}
                      className="w-full bg-surface-base border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-mono text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-muted block mb-1">Bearer Token</label>
                  <input
                    type="text"
                    value={sandboxKey}
                    onChange={(e) => setSandboxKey(e.target.value)}
                    className="w-full bg-surface-base border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-mono text-text-primary"
                  />
                </div>

                {sandboxMethod === 'POST' && (
                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">Corps JSON (Body)</label>
                    <textarea
                      rows={3}
                      value={sandboxBody}
                      onChange={(e) => setSandboxBody(e.target.value)}
                      className="w-full bg-surface-base border border-border-subtle rounded-xl p-3 text-xs font-mono text-text-primary"
                    />
                  </div>
                )}

                <Button
                  onClick={runSandboxTest}
                  isLoading={sandboxLoading}
                  variant="primary"
                  size="md"
                >
                  Envoyer la Requête de Test
                </Button>

                {sandboxResponse && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-bold text-text-muted font-mono">Réponse JSON reçue :</span>
                    <pre className="p-4 rounded-xl bg-surface-base border border-border-subtle font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
                      {sandboxResponse}
                    </pre>
                  </div>
                )}
              </Card>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
