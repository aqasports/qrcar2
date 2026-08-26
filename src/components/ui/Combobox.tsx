'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner une option...',
  searchPlaceholder = 'Rechercher...',
  label,
  error,
  helperText,
  disabled = false,
  emptyMessage = 'Aucun résultat trouvé.',
  emptyAction,
  className = '',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option && !option.disabled) {
        onChange(option.value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-3.5 py-2.5 bg-surface-base border rounded-xl text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all shadow-inner ${
          error
            ? 'border-rose-500/60 ring-2 ring-rose-500/20'
            : isOpen
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-border-default hover:border-border-strong'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className={`truncate ${selectedOption ? 'text-text-primary font-medium' : 'text-text-disabled'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge}
          <svg
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-overlay border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-border-subtle bg-surface-base/40">
            <div className="relative flex items-center">
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 text-text-muted pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-surface-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-disabled outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Options List */}
          <ul className="max-h-56 overflow-y-auto p-1 divide-y divide-border-subtle/40" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="p-4 text-center space-y-2">
                <p className="text-xs text-text-muted">{emptyMessage}</p>
                {emptyAction && <div>{emptyAction}</div>}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 rounded-lg cursor-pointer text-xs flex items-center justify-between gap-2 transition-colors ${
                      opt.disabled
                        ? 'opacity-40 pointer-events-none'
                        : isSelected
                        ? 'bg-accent/15 text-accent font-semibold'
                        : isHighlighted
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[10px] text-text-muted truncate">{opt.sublabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge}
                      {isSelected && (
                        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}
