'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';

interface ActionLaborTimerProps {
  actionId: string;
  initialHoursSpent?: number;
  hourlyRateDzd?: number;
  onHoursUpdate?: (totalHours: number) => void;
  disabled?: boolean;
}

export function ActionLaborTimer({
  actionId,
  initialHoursSpent = 0,
  hourlyRateDzd = 2500,
  onHoursUpdate,
  disabled = false,
}: ActionLaborTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(Math.round(initialHoursSpent * 3600));

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleToggleTimer = () => {
    if (disabled) return;
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    if (!nextRunning && onHoursUpdate) {
      const hours = parseFloat((elapsedSeconds / 3600).toFixed(2));
      onHoursUpdate(hours);
    }
  };

  const handleReset = () => {
    if (disabled) return;
    setIsRunning(false);
    setElapsedSeconds(0);
    if (onHoursUpdate) onHoursUpdate(0);
  };

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;

  const currentLaborCostDzd = Math.round((elapsedSeconds / 3600) * hourlyRateDzd);

  return (
    <Card className="border border-border-default font-sans overflow-hidden">
      <CardHeader className="pb-2.5 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <svg
              className={`w-4 h-4 ${isRunning ? 'text-emerald-400 animate-spin' : 'text-accent'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Pointage & Chronomètre Temps Passé
          </CardTitle>

          {isRunning ? (
            <Badge variant="success" pulse>
              En cours sur le pont
            </Badge>
          ) : (
            <Badge variant="neutral">En pause</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Timer Display */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-base border border-border-default">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Temps Écoulé Réel
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-text-primary tracking-wider">
              {formattedTime}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Valorisation Main d’Œuvre
            </span>
            <span className="text-base sm:text-lg font-mono font-extrabold text-accent">
              {currentLaborCostDzd.toLocaleString('fr-DZ')} DZD
            </span>
            <span className="text-[9px] text-text-muted block">
              Base: {hourlyRateDzd.toLocaleString('fr-DZ')} DZD/h
            </span>
          </div>
        </div>

        {/* Action Controls */}
        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRunning ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggleTimer}
              className="flex-1"
              leftIcon={
                isRunning ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            >
              {isRunning ? 'Mettre en pause' : 'Démarrer le travail'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isRunning || elapsedSeconds === 0}
            >
              Réinitialiser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
