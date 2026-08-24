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
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-danger ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`w-full rounded-xl linear-input text-xs sm:text-sm text-text-primary placeholder:text-text-disabled outline-none transition duration-150 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 sm:py-2.5 ${
              error
                ? 'border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger'
                : 'focus:border-accent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-[11px] text-danger font-medium mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{helperText}</p>
        )}
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
  ({ label, error, helperText, className = '', id, required, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-danger ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={`w-full appearance-none rounded-xl linear-input text-xs sm:text-sm text-text-primary outline-none transition duration-150 px-3.5 py-2.5 sm:py-2.5 pr-10 cursor-pointer ${
              error
                ? 'border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger'
                : 'focus:border-accent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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

        {error && <p className="text-[11px] text-danger font-medium mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{helperText}</p>
        )}
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
  ({ label, error, helperText, className = '', id, required, disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-danger ml-1 font-bold">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`w-full rounded-xl linear-input text-xs sm:text-sm text-text-primary placeholder:text-text-disabled outline-none transition duration-150 px-3.5 py-2.5 ${
            error
              ? 'border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger'
              : 'focus:border-accent'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />

        {error && <p className="text-[11px] text-danger font-medium mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
