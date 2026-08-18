'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  category: string;
  title: string;
  subtitle: string;
  href: string;
  tag?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick navigation shortcuts
  const staticShortcuts: SearchResult[] = [
    { category: 'Navigation', title: 'Tableau de Bord Cockpit', subtitle: 'Vue générale et télémétrie atelier', href: '/admin' },
    { category: 'Navigation', title: 'Parc Véhicules & Décodage VIN', subtitle: 'Gestion de la flotte et auto-fill VIN', href: '/admin/vehicles' },
    { category: 'Navigation', title: 'Interventions & Ordres de Réparation', subtitle: 'Historique des travaux et actions', href: '/admin/actions' },
    { category: 'Navigation', title: 'Marketplace Pièces B2B', subtitle: 'Achat/vente de pièces détachées inter-garages', href: '/admin/marketplace' },
    { category: 'Navigation', title: 'Base de Connaissances & Pannes DTC', subtitle: 'Recherche de codes défaut et diagnostics', href: '/admin/knowledgebase' },
    { category: 'Navigation', title: 'Messagerie Directe Inter-Garages', subtitle: 'Discussions en direct avec vos confrères', href: '/admin/messages' },
    { category: 'Navigation', title: 'Studio Cartes PVC CR-80', subtitle: 'Conception graphique et cartes connectées', href: '/admin/cards/studio' },
    { category: 'Navigation', title: 'Commander des Cartes PVC', subtitle: 'Réassort de cartes avec livraison 58 Wilayas', href: '/admin/cards/order' },
    { category: 'Navigation', title: 'Annuaire National & Profil SEO', subtitle: 'Visibilité publique et spécialités', href: '/admin/directory' },
    { category: 'Navigation', title: 'Centre de Notifications Multicanal', subtitle: 'SMS Algérie, WhatsApp et alertes clients', href: '/admin/notifications' },
    { category: 'Navigation', title: 'Abonnement Chargily Pay', subtitle: 'Gestion du forfait et paiements BaridiMob', href: '/admin/billing' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(staticShortcuts.slice(0, 6));
      return;
    }

    const q = query.toLowerCase();
    const filtered = staticShortcuts.filter(
      (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
    );

    // If query looks like a DTC code (starts with P, C, B, U or DF)
    if (/^(p|c|b|u|df)[0-9]/i.test(q)) {
      filtered.unshift({
        category: 'Diagnostic DTC',
        title: `Rechercher Code Défaut "${query.toUpperCase()}"`,
        subtitle: 'Accéder aux procédures de résolution validées',
        href: `/admin/knowledgebase?dtc=${encodeURIComponent(query.toUpperCase())}`,
        tag: 'DTC',
      });
    }

    // If query looks like a 17-char VIN
    if (query.trim().length === 17) {
      filtered.unshift({
        category: 'Décodage VIN',
        title: `Décoder VIN "${query.trim().toUpperCase()}"`,
        subtitle: 'Interroger le moteur NHTSA & Cache Local',
        href: `/admin/vehicles?vin=${encodeURIComponent(query.trim().toUpperCase())}`,
        tag: 'VIN 17',
      });
    }

    setResults(filtered);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Rechercher véhicule, client, code DTC (ex: P0300), VIN ou fonction..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none font-medium"
          />
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucun résultat correspondant à votre recherche.
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.href)}
                className="w-full text-left p-3.5 rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/30 border border-transparent transition flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {item.category}
                    </span>
                    {item.tag && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition truncate mt-0.5">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                </div>

                <span className="text-slate-600 group-hover:text-blue-400 text-xs font-mono shrink-0">
                  Entrée &rarr;
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 px-5">
          <div className="flex items-center gap-3">
            <span>Naviguer avec la souris ou taper pour filtrer</span>
          </div>
          <span className="font-mono text-[10px]">GARAGE PRO COMMAND STATION</span>
        </div>
      </div>
    </div>
  );
}
