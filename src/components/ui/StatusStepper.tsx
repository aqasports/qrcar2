import React from 'react';

export interface StepItem {
  key: string;
  label: string;
  description?: string;
}

export interface StatusStepperProps {
  steps: StepItem[];
  currentStepKey: string;
  onStepClick?: (stepKey: string) => void;
  className?: string;
}

export function StatusStepper({
  steps,
  currentStepKey,
  onStepClick,
  className = '',
}: StatusStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStepKey);

  return (
    <nav aria-label="Progression du statut" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto py-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <li
              key={step.key}
              className={`flex-1 min-w-[120px] flex flex-col items-center sm:items-start group ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && onStepClick(step.key)}
            >
              <div className="w-full flex items-center mb-2">
                {/* Step Circle Indicator */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : isCurrent
                      ? 'bg-accent/20 text-accent border border-accent shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-2 ring-accent/20'
                      : 'bg-surface-base text-text-muted border border-border-subtle'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Connecting Line (except last item) */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${
                      index < currentIndex ? 'bg-emerald-500/40' : 'bg-border-subtle'
                    }`}
                  />
                )}
              </div>

              {/* Step Text Labels */}
              <div className="text-center sm:text-left">
                <p
                  className={`text-[11px] sm:text-xs font-bold tracking-tight ${
                    isCurrent
                      ? 'text-text-primary'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-text-muted hidden sm:block truncate max-w-[140px]">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
