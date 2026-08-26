'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui';

export interface WorkshopBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_main: boolean;
}

interface BranchSwitcherProps {
  planSlug?: string;
  currentBranchId?: string;
  onBranchChange?: (branchId: string | null) => void;
}

export function BranchSwitcher({
  planSlug = 'starter',
  currentBranchId,
  onBranchChange,
}: BranchSwitcherProps) {
  const [branches, setBranches] = useState<WorkshopBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(currentBranchId || null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Default main branch fallback if none in DB
    setBranches([
      { id: 'main', name: 'Atelier Principal', address: 'Site Central', is_main: true },
    ]);
  }, []);

  const isMultiBranchAllowed = planSlug === 'pro' || planSlug === 'enterprise';
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleSelect = (branchId: string | null) => {
    setSelectedBranchId(branchId);
    setIsOpen(false);
    if (onBranchChange) {
      onBranchChange(branchId);
    }
  };

  return (
    <div className="relative font-sans">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-base hover:bg-surface-raised border border-white/[0.08] hover:border-white/[0.15] text-xs font-semibold text-text-primary transition select-none"
      >
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="truncate max-w-[130px] sm:max-w-[160px]">
          {selectedBranchId === null && branches.length > 1
            ? 'Toutes les succursales'
            : activeBranch?.name || 'Atelier Principal'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 p-2 rounded-2xl bg-surface-raised border border-border-default shadow-2xl z-50 space-y-1">
            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-border-subtle">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Succursales Atelier
              </span>
              {isMultiBranchAllowed ? (
                <Badge variant="info">Multi-Sites</Badge>
              ) : (
                <Badge variant="neutral">Monosite</Badge>
              )}
            </div>

            {isMultiBranchAllowed && branches.length > 1 && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                  selectedBranchId === null
                    ? 'bg-accent/15 text-accent font-bold'
                    : 'text-text-secondary hover:bg-surface-base hover:text-text-primary'
                }`}
              >
                <span>Vue Consolidée (Toutes)</span>
                {selectedBranchId === null && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}

            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id || (selectedBranchId === null && b.is_main && branches.length === 1);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-text-secondary hover:bg-surface-base hover:text-text-primary'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <span className="block truncate font-semibold">{b.name}</span>
                    {b.address && <span className="block text-[10px] text-text-muted truncate">{b.address}</span>}
                  </div>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
