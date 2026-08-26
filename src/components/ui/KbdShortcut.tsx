import React from 'react';

export interface KbdShortcutProps {
  shortcut: string;
  className?: string;
}

export function KbdShortcut({ shortcut, className = '' }: KbdShortcutProps) {
  // Split keys like "Ctrl+K" or "⌘K"
  const keys = shortcut.includes('+') ? shortcut.split('+') : [shortcut];

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((k, index) => (
        <kbd
          key={index}
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-medium text-text-muted bg-surface-base border border-border-default rounded shadow-xs select-none"
        >
          {k.trim()}
        </kbd>
      ))}
    </span>
  );
}
