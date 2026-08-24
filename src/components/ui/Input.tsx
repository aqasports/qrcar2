import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-text-muted flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`w-full bg-surface-base border ${
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-border-default focus:border-accent focus:ring-accent/20'
            } rounded-xl ${leftIcon ? 'pl-10' : 'px-3.5'} ${
              rightIcon ? 'pr-10' : 'px-3.5'
            } py-2.5 text-xs sm:text-sm text-text-primary placeholder-text-muted/60 outline-none transition-all duration-150 focus:ring-2 disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 pointer-events-none text-text-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-danger font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className = '', id, required, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={`w-full bg-surface-base border ${
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-border-default focus:border-accent focus:ring-accent/20'
            } rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-text-primary outline-none transition-all duration-150 focus:ring-2 appearance-none disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-[11px] text-danger font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={areaId}
            className="block text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          required={required}
          className={`w-full bg-surface-base border ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-border-default focus:border-accent focus:ring-accent/20'
          } rounded-xl p-3.5 text-xs sm:text-sm text-text-primary placeholder-text-muted/60 outline-none transition-all duration-150 focus:ring-2 disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-danger font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
