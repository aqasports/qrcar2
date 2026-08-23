'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DeveloperDocsPage() {
  const [activeSection, setActiveSection] = useState<'auth' | 'rest' | 'graphql' | 'webhooks' | 'sandbox'>('auth');
  const [sandboxEndpoint, setSandboxEndpoint] = useState('/api/public/v1/me');
  const [sandboxMethod, setSandboxMethod] = useState('GET');
  const [sandboxToken, setSandboxToken] = useState('qrc_live_sampletoken_123456');
  const [sandboxBody, setSandboxBody] = useState('{}');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const handleTestCall = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      const options: RequestInit = {
        method: sandboxMethod,
        headers: {
          Authorization: `Bearer ${sandboxToken}`,
          'Content-Type': 'application/json',
        },
      };
      if (sandboxMethod !== 'GET') {
        options.body = sandboxBody;
      }

      const res = await fetch(sandboxEndpoint, options);
      const data = await res.json();
      setSandboxResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setSandboxResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs">
            QR
          </div>
          <div>
            <span className="font-black tracking-tight text-slate-100 text-sm">qrCar Developer Hub</span>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.0-Production
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/api"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            Gérer mes Clés d'API &rarr;
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">Documentation API</span>

          {[
            { id: 'auth', label: '1. Authentification & Sécurité' },
            { id: 'rest', label: '2. API REST v1' },
            { id: 'graphql', label: '3. API GraphQL' },
            { id: 'webhooks', label: '4. Webhooks & Signatures' },
            { id: 'sandbox', label: '5. Sandbox & Testeur Live' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-6 border-t border-slate-800/80 px-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quotas & Limites</span>
            <p className="text-[11px] text-slate-400">Starter: 100 req/min (10k/mois)</p>
            <p className="text-[11px] text-slate-400">Pro: 500 req/min (100k/mois)</p>
            <p className="text-[11px] text-slate-400">Enterprise: 2000 req/min (1M/mois)</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-8">
          {/* 1. AUTHENTICATION */}
          {activeSection === 'auth' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">
                  Authentification Bearer & Permissions (Scopes)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Toutes les requêtes adressées à l'API publique requièrent un jeton Bearer généré depuis le cockpit d'atelier.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300">Format du Header HTTP</span>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-blue-400 font-mono text-xs border border-slate-800">
                  Authorization: Bearer qrc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </pre>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Scopes de permissions granulaires :</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { scope: 'read_vehicles', desc: 'Consulter les véhicules, cartes grises et kilométrages' },
                    { scope: 'write_vehicles', desc: 'Créer et modifier des fiches véhicules' },
                    { scope: 'read_actions', desc: 'Consulter l\'historique des réparations' },
                    { scope: 'write_actions', desc: 'Ouvrir et valider les ordres de réparation' },
                    { scope: 'read_inventory', desc: 'Consulter le catalogue de pièces et alertes stock' },
                    { scope: 'write_inventory', desc: 'Ajuster les quantités et réassorts de pièces' },
                    { scope: 'read_invoices', desc: 'Consulter les devis et factures d\'atelier' },
                    { scope: 'read_clients', desc: 'Consulter les données clients et contacts' },
                    { scope: 'manage_webhooks', desc: 'Créer et configurer des récepteurs webhooks' },
                  ].map((s) => (
                    <div key={s.scope} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <code className="text-xs font-mono font-bold text-emerald-400">{s.scope}</code>
                      <p className="text-[11px] text-slate-400">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. REST API */}
          {activeSection === 'rest' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">Endpoints REST v1</h2>
                <p className="text-xs text-slate-400 mt-1">Endpoints versionnés et strictement isolés par tenant (Row Level Security).</p>
              </div>

              <div className="space-y-4">
                {[
                  { method: 'GET', path: '/api/public/v1/me', desc: 'Vérifier la validité de la clé API, le plan d\'abonnement et les scopes accordés.' },
                  { method: 'GET', path: '/api/public/v1/vehicles', desc: 'Lister la flotte de véhicules de l\'atelier avec recherche matricule/marque.' },
                  { method: 'POST', path: '/api/public/v1/vehicles', desc: 'Enregistrer un nouveau véhicule (déclenche l\'événement vehicle.created).' },
                  { method: 'GET', path: '/api/public/v1/actions', desc: 'Lister les ordres de réparation avec filtre par véhicule et statut.' },
                  { method: 'POST', path: '/api/public/v1/actions', desc: 'Créer une intervention avec déduction automatique des pièces associées.' },
                  { method: 'POST', path: '/api/public/v1/actions/[id]/complete', desc: 'Clôturer un ordre de réparation (déclenche action.completed).' },
                  { method: 'GET', path: '/api/public/v1/parts', desc: 'Consulter le stock et filtrer par pièces sous seuil critique.' },
                  { method: 'PATCH', path: '/api/public/v1/parts/[id]/stock', desc: 'Ajuster manuellement le stock pièce.' },
                  { method: 'GET', path: '/api/public/v1/invoices', desc: 'Lister les factures avec détails des pièces et main d\'œuvre.' },
                ].map((ep, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                        ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-bold text-slate-200">{ep.path}</code>
                    </div>
                    <p className="text-xs text-slate-400">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GRAPHQL API */}
          {activeSection === 'graphql' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">API GraphQL</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Exécutez des requêtes et mutations optimisées sur l'endpoint unique <code className="text-purple-400 font-mono">POST /api/public/v1/graphql</code>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300">Exemple de Requête Query</span>
                <pre className="p-4 rounded-xl bg-slate-950 text-purple-300 font-mono text-xs border border-slate-800 overflow-x-auto">
{`query GetVehiclesAndParts {
  me {
    appName
    scopes
    organization {
      name
      plan
    }
  }
  vehicles(limit: 10) {
    id
    plateNumber
    make
    model
    currentMileage
  }
  parts(lowStockOnly: true) {
    id
    name
    quantityInStock
    minStockThreshold
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* 4. WEBHOOK SIGNATURES */}
          {activeSection === 'webhooks' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">Vérification des Signatures Webhooks</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chaque requête outbound est signée avec un condensat HMAC-SHA256 inclus dans le header <code className="text-amber-400 font-mono">X-QrCar-Signature</code>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Exemple de Vérification en Node.js</span>
                  <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 overflow-x-auto">
{`const crypto = require('crypto');

function verifyQrCarWebhook(rawPayload, signatureHeader, signingSecret) {
  const computed = crypto
    .createHmac('sha256', signingSecret)
    .update(rawPayload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
}`}
                  </pre>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Exemple de Vérification en Python</span>
                  <pre className="p-4 rounded-xl bg-slate-950 text-cyan-400 font-mono text-xs border border-slate-800 overflow-x-auto">
{`import hmac
import hashlib

def verify_qrcar_webhook(raw_payload: bytes, signature_header: str, signing_secret: str) -> bool:
    computed = hmac.new(
        signing_secret.encode('utf-8'),
        raw_payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(computed, signature_header)`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 5. SANDBOX & TESTER */}
          {activeSection === 'sandbox' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">Sandbox & Testeur Interactif</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Testez en direct les requêtes API avec votre clé d'API personnelle ou une clé de test.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Méthode</label>
                    <select
                      value={sandboxMethod}
                      onChange={(e) => setSandboxMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Chemin Endpoint</label>
                    <input
                      type="text"
                      value={sandboxEndpoint}
                      onChange={(e) => setSandboxEndpoint(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Bearer Token</label>
                  <input
                    type="text"
                    value={sandboxToken}
                    onChange={(e) => setSandboxToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                {sandboxMethod !== 'GET' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Corps JSON (Body)</label>
                    <textarea
                      rows={3}
                      value={sandboxBody}
                      onChange={(e) => setSandboxBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100"
                    />
                  </div>
                )}

                <button
                  onClick={handleTestCall}
                  disabled={sandboxLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {sandboxLoading ? 'Exécution de la requête...' : 'Envoyer la Requête de Test'}
                </button>

                {sandboxResponse && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Réponse JSON reçue :</span>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
                      {sandboxResponse}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
