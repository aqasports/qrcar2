'use client';

import React, { useState, KeyboardEvent } from 'react';

export interface ChipItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface ChipInputProps {
  chips: ChipItem[];
  onChange: (chips: ChipItem[]) => void;
  suggestions?: ChipItem[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function ChipInput({
  chips,
  onChange,
  suggestions = [],
  placeholder = 'Ajouter et appuyer sur Entrée...',
  label,
  error,
  helperText,
  disabled = false,
  className = '',
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      // Check if already in chips
      if (chips.some((c) => c.label.toLowerCase() === trimmed.toLowerCase())) {
        setInputValue('');
        return;
      }

      // Check matching suggestion or create free chip
      const matchingSuggestion = suggestions.find(
        (s) => s.label.toLowerCase() === trimmed.toLowerCase()
      );

      const newChip: ChipItem = matchingSuggestion || {
        id: `chip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        label: trimmed,
      };

      onChange([...chips, newChip]);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  const removeChip = (idToRemove: string) => {
    onChange(chips.filter((c) => c.id !== idToRemove));
  };

  const addSuggestion = (suggestion: ChipItem) => {
    if (!chips.some((c) => c.id === suggestion.id)) {
      onChange([...chips, suggestion]);
    }
    setInputValue('');
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !chips.some((c) => c.id === s.id) &&
      s.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        className={`min-h-[42px] p-1.5 flex flex-wrap items-center gap-1.5 bg-surface-base border rounded-xl transition-all shadow-inner relative ${
          error
            ? 'border-rose-500/60 ring-2 ring-rose-500/20'
            : isFocused
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-border-default hover:border-border-strong'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* Render Selected Chips */}
        {chips.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border-strong text-text-primary group shadow-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <span>{chip.label}</span>
            {chip.sublabel && (
              <span className="text-[10px] text-text-muted">({chip.sublabel})</span>
            )}
            <button
              type="button"
              onClick={() => removeChip(chip.id)}
              className="p-0.5 rounded text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Supprimer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Input for typing */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={chips.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-disabled outline-none px-2 py-1"
          disabled={disabled}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && inputValue && filteredSuggestions.length > 0 && (
        <div className="p-1 mt-1 bg-surface-overlay border border-border-default rounded-xl shadow-2xl space-y-0.5 max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={() => addSuggestion(suggestion)}
              className="w-full px-3 py-1.5 text-left text-xs rounded-lg text-text-primary hover:bg-surface-hover hover:text-accent flex items-center justify-between transition-colors"
            >
              <span className="font-medium">{suggestion.label}</span>
              {suggestion.sublabel && (
                <span className="text-[10px] text-text-muted">{suggestion.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}
