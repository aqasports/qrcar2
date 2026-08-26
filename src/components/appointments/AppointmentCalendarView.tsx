'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';

export interface CalendarAppointment {
  id: string;
  vehicle_id: string;
  service_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  current_mileage: number | null;
  notes: string | null;
  client_phone: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  plate_number: string;
  make: string;
  model: string;
  year: number;
  client_name: string;
}

interface AppointmentCalendarViewProps {
  appointments: CalendarAppointment[];
  onSelectAppointment: (apt: CalendarAppointment) => void;
  onConvertAppointment: (id: string) => void;
}

export function AppointmentCalendarView({
  appointments,
  onSelectAppointment,
  onConvertAppointment,
}: AppointmentCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Time slot buckets
  const timeSlots = [
    { id: 'morning', label: '08:30 - 10:30 (Matin)' },
    { id: 'midday', label: '10:30 - 12:30 (Midi)' },
    { id: 'afternoon', label: '14:00 - 16:00 (Après-midi)' },
    { id: 'evening', label: '16:00 - 18:00 (Fin de journée)' },
  ];

  // Calculate days of current week (Monday to Saturday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const handlePrevWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (d: Date) => d.toISOString().split('T')[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-surface-raised border-border-subtle text-text-muted';
    }
  };

  return (
    <Card className="border border-border-default font-sans overflow-hidden">
      <CardHeader className="pb-3 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="xs" onClick={handlePrevWeek}>
              ← Semaine précédente
            </Button>
            <Button variant="secondary" size="xs" onClick={handleToday}>
              Aujourd’hui
            </Button>
            <Button variant="secondary" size="xs" onClick={handleNextWeek}>
              Semaine suivante →
            </Button>
          </div>

          <div className="text-xs font-bold text-text-primary">
            {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} —{' '}
            {weekDays[5].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Weekday Columns Header */}
          <div className="grid grid-cols-6 border-b border-border-subtle bg-surface-raised/20">
            {weekDays.map((day) => {
              const isToday = formatDateKey(day) === formatDateKey(new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-r border-border-subtle last:border-r-0 ${
                    isToday ? 'bg-accent/10 text-accent font-bold' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-text-muted block">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-border-subtle">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-6 min-h-[110px]">
                {weekDays.map((day) => {
                  const dateStr = formatDateKey(day);
                  const slotAppointments = appointments.filter(
                    (a) =>
                      a.preferred_date === dateStr &&
                      (a.preferred_time_slot === slot.id ||
                        (!['morning', 'midday', 'afternoon', 'evening'].includes(a.preferred_time_slot) &&
                          slot.id === 'morning'))
                  );

                  return (
                    <div
                      key={dateStr + slot.id}
                      className="p-2 border-r border-border-subtle last:border-r-0 hover:bg-surface-raised/20 transition flex flex-col gap-1.5"
                    >
                      <span className="text-[8px] font-mono text-text-muted/60 block">
                        {slot.label.split(' ')[0]}
                      </span>

                      {slotAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition transform hover:scale-[1.02] shadow-sm space-y-1 ${getStatusColor(
                            apt.status
                          )}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold tracking-wider px-1 rounded bg-black/30">
                              {apt.plate_number}
                            </span>
                            <span className="text-[8px] uppercase font-bold">
                              {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : apt.status}
                            </span>
                          </div>

                          <div className="text-[11px] font-bold truncate leading-tight">
                            {apt.make} {apt.model}
                          </div>

                          <div className="text-[10px] text-text-secondary truncate">
                            {apt.service_type} • {apt.client_name}
                          </div>

                          {apt.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvertAppointment(apt.id);
                              }}
                              className="w-full text-center py-1 mt-1 rounded bg-accent/20 hover:bg-accent/30 text-accent text-[9px] font-bold transition"
                            >
                              Ouvrir Ordre Réparation →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
