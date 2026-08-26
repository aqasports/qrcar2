'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InlineEditCellProps {
  value: string | number;
  onSave: (val: string) => void;
  type?: 'text' | 'number';
  suffix?: string;
  prefix?: string;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number | string;
  disabled?: boolean;
}

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  suffix = '',
  prefix = '',
  className = '',
  placeholder = '',
  min,
  step,
  disabled = false,
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentVal !== String(value)) {
      onSave(currentVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      if (currentVal !== String(value)) {
        onSave(currentVal);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentVal(String(value ?? ''));
    }
  };

  if (disabled) {
    return (
      <span className={`text-text-primary text-xs ${className}`}>
        {prefix}{value}{suffix}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {prefix && <span className="text-text-muted text-xs">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          min={min}
          step={step}
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-w-[70px] px-2 py-1 bg-surface-base border border-accent rounded text-text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {suffix && <span className="text-text-muted text-xs">{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Cliquer pour modifier"
      className={`group/cell inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded hover:bg-surface-hover/80 transition-colors text-left font-sans text-xs ${className}`}
    >
      <span className="text-text-primary">
        {prefix}{value !== undefined && value !== '' ? value : placeholder}{suffix}
      </span>
      <svg
        className="w-3 h-3 text-text-muted opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
