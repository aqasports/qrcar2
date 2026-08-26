'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KbdShortcut } from './ui/KbdShortcut';

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
  onOpen?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick navigation shortcuts
  const staticShortcuts: SearchResult[] = [
    { category: 'Actions Rapides', title: 'Créer un Nouvel Ordre de Réparation (OR)', subtitle: 'Ouvrir une fiche intervention ou utiliser un modèle atelier', href: '/admin/actions/new', tag: 'OR' },
    { category: 'Actions Rapides', title: 'Ajouter un Nouveau Véhicule', subtitle: 'Enregistrer une plaque avec décodage VIN', href: '/admin/vehicles', tag: 'AUTO' },
    { category: 'Actions Rapides', title: 'Enregistrer un Nouveau Client', subtitle: 'Ajouter un propriétaire dans le répertoire', href: '/admin/clients', tag: 'PROPRIO' },
    { category: 'Navigation', title: 'Tableau de Bord', subtitle: 'Vue générale et indicateurs clés atelier', href: '/admin' },
    { category: 'Navigation', title: 'Parc Véhicules & Décodage VIN', subtitle: 'Gestion de la flotte et auto-fill VIN', href: '/admin/vehicles' },
    { category: 'Navigation', title: 'Interventions & Ordres de Réparation', subtitle: 'Historique des travaux et actions', href: '/admin/actions' },
    { category: 'Navigation', title: 'Stock & Magasin de Pièces', subtitle: 'Catalogue pièces et alertes de réapprovisionnement', href: '/admin/inventory' },
    { category: 'Navigation', title: 'Facturation & Règlements', subtitle: 'Suivi des encaissements et téléchargement PDF', href: '/admin/invoices' },
    { category: 'Navigation', title: 'Marketplace Pièces B2B', subtitle: 'Achat/vente de pièces détachées inter-garages', href: '/admin/marketplace' },
    { category: 'Navigation', title: 'Base de Connaissances & Pannes DTC', subtitle: 'Recherche de codes défaut et diagnostics OBD-II', href: '/admin/knowledgebase' },
    { category: 'Navigation', title: 'Messagerie Directe Inter-Garages', subtitle: 'Discussions en direct avec vos confrères', href: '/admin/messages' },
    { category: 'Navigation', title: 'Studio Cartes PVC CR-80', subtitle: 'Conception graphique et cartes connectées QR', href: '/admin/cards/studio' },
    { category: 'Navigation', title: 'Commander des Cartes PVC', subtitle: 'Réassort de cartes avec livraison 58 Wilayas Yalidine', href: '/admin/cards/order' },
    { category: 'Navigation', title: 'Annuaire National & Profil SEO', subtitle: 'Visibilité publique et spécialités', href: '/admin/directory' },
    { category: 'Navigation', title: 'Centre de Notifications Multicanal', subtitle: 'SMS Algérie, WhatsApp et alertes clients', href: '/admin/notifications' },
    { category: 'Navigation', title: 'Abonnement Chargily Pay', subtitle: 'Gestion du forfait et paiements BaridiMob / EDAHABIA', href: '/admin/billing' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(staticShortcuts.slice(0, 8));
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const filtered = staticShortcuts.filter(
      (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );

    // If query looks like a DTC code (starts with P, C, B, U or DF)
    if (/^(p|c|b|u|df)[0-9]/i.test(q)) {
      filtered.unshift({
        category: 'Diagnostic DTC',
        title: `Rechercher Code Défaut "${query.toUpperCase()}"`,
        subtitle: 'Accéder aux procédures de diagnostic et solutions validées',
        href: `/admin/knowledgebase?dtc=${encodeURIComponent(query.toUpperCase())}`,
        tag: 'DTC',
      });
    }

    // If query looks like a 17-char VIN
    if (query.trim().length === 17) {
      filtered.unshift({
        category: 'Décodage VIN',
        title: `Décoder VIN "${query.trim().toUpperCase()}"`,
        subtitle: 'Interroger le moteur NHTSA et le cache technique',
        href: `/admin/vehicles?vin=${encodeURIComponent(query.trim().toUpperCase())}`,
        tag: 'VIN 17',
      });
    }

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        handleSelect(selected.href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-surface-raised border border-border-default w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border-subtle flex items-center gap-3 bg-surface-base/60">
          <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher véhicule, client, code DTC (ex: P0300), VIN ou fonction..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-disabled text-sm outline-none font-medium"
          />
          <KbdShortcut shortcut="ESC" />
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-border-subtle/30" role="listbox">
          {results.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs">
              Aucun résultat correspondant à votre recherche.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 border-accent/30 text-text-primary'
                      : 'border-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/20">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold transition truncate mt-0.5 ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
                  </div>

                  <span className={`text-xs font-mono shrink-0 transition-opacity ${isSelected ? 'text-accent opacity-100' : 'text-text-muted opacity-0 group-hover:opacity-100'}`}>
                    Entrée ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-surface-base/80 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted px-5">
          <div className="flex items-center gap-3">
            <span>Utilisez les flèches ↑ ↓ pour naviguer</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Palette de Commandes
          </span>
        </div>
      </div>
    </div>
  );
}
