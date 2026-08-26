'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export interface DropdownMenuSection {
  title?: string;
  items: DropdownMenuItem[];
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  sections: DropdownMenuSection[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  trigger,
  sections,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 w-56 bg-surface-overlay border border-border-default rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl`}
          role="menu"
        >
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.title && (
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {section.title}
                </p>
              )}
              {section.items.map((item, iIdx) => (
                <button
                  key={iIdx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2.5 transition-colors text-left ${
                    item.disabled
                      ? 'opacity-40 pointer-events-none'
                      : item.destructive
                      ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                      : 'text-text-primary hover:bg-surface-hover hover:text-accent'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center text-text-muted">{item.icon}</span>}
                    <span className="truncate font-medium">{item.label}</span>
                  </div>
                  {item.badge && <span className="shrink-0">{item.badge}</span>}
                </button>
              ))}
              {sIdx < sections.length - 1 && (
                <div className="my-1 border-t border-border-subtle" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
