'use client';

import React, { useRef } from 'react';
import { KbdShortcut } from './KbdShortcut';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  shortcut,
  placeholder = 'Rechercher...',
  className = '',
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-16 py-2 bg-surface-base border border-border-default hover:border-border-strong focus:border-accent rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-disabled outline-none transition-all shadow-inner focus:ring-2 focus:ring-accent/20 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />

      {/* Actions / Shortcut Slot */}
      <div className="absolute right-3 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
            title="Effacer la recherche"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : shortcut ? (
          <KbdShortcut shortcut={shortcut} />
        ) : null}
      </div>
    </div>
  );
}
