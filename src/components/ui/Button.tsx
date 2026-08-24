import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold tracking-tight rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-base active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs sm:text-sm px-4 py-2 gap-2 h-9 sm:h-10',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 h-11 sm:h-12',
    }[size];

    const variantStyles = {
      primary: 'linear-btn-primary text-white focus:ring-blue-500',
      secondary: 'linear-btn-secondary text-text-primary focus:ring-slate-500',
      danger:
        'bg-gradient-to-b from-red-500/20 to-red-600/30 text-red-300 border border-red-500/30 hover:border-red-500/60 hover:text-white shadow-sm focus:ring-red-500',
      ghost:
        'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent focus:ring-slate-500',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin w-4 h-4 text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
