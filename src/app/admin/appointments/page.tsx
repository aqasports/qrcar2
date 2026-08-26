'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { AppointmentCalendarView } from '@/components/appointments/AppointmentCalendarView';

interface Appointment {
  id: string;
  vehicle_id: string;
  service_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  current_mileage: number | null;
  notes: string | null;
  client_phone: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  garage_response: string | null;
  created_at: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_current_mileage: number;
  client_id: string;
  client_name: string;
  client_phone_registered: string;
}

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Response modal state
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [responseStatus, setResponseStatus] = useState<'confirmed' | 'cancelled'>('confirmed');
  const [responseText, setResponseText] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setAppointments(rawList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, status: string, responseNote?: string) => {
    setProcessingId(appointmentId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          garage_response: responseNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Impossible de mettre à jour le rendez-vous');
      } else {
        setActionSuccess('Statut du rendez-vous mis à jour avec succès.');
        setResponseModalOpen(false);
        fetchAppointments();
      }
    } catch (err) {
      setActionError('Erreur réseau lors de la mise à jour.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvertToServiceAction = async (appointmentId: string) => {
    if (!confirm('Voulez-vous convertir ce rendez-vous en ordre de réparation ouvert ?')) return;

    setProcessingId(appointmentId);
    setActionError('');

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Erreur lors de la conversion');
      } else {
        router.push(`/admin/actions/${data.action.id}`);
      }
    } catch (err) {
      setActionError('Erreur de communication avec le serveur.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      apt.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">{t.appointments.statusConfirmed}</Badge>;
      case 'pending':
        return <Badge variant="warning" pulse>{t.appointments.statusPending}</Badge>;
      case 'completed':
        return <Badge variant="info">{t.appointments.statusCompleted}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{t.appointments.statusCancelled}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.appointments.title}
        subtitle={t.appointments.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.appointments.title.split('&')[0] },
        ]}
      />

      {actionError && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          {actionSuccess}
        </div>
      )}

      {/* Filters & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Input
            placeholder={t.appointments.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
          <div className="w-44">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t.common.all} ({appointments.length})</option>
              <option value="pending">{t.appointments.statusPending}</option>
              <option value="confirmed">{t.appointments.statusConfirmed}</option>
              <option value="completed">{t.appointments.statusCompleted}</option>
              <option value="cancelled">{t.appointments.statusCancelled}</option>
            </Select>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border-subtle">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Planning Semaine
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Vue Liste
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AppointmentCalendarView
          appointments={filteredAppointments}
          onSelectAppointment={(apt) => {
            setSelectedAppointment(apt as Appointment);
            setResponseStatus('confirmed');
            setResponseText('');
            setResponseModalOpen(true);
          }}
          onConvertAppointment={handleConvertToServiceAction}
        />
      ) : (
        /* Table */
        <Table>
          <TableHeader>
            <tr>
              <TableHead>{t.appointments.preferredDate}</TableHead>
              <TableHead>{t.appointments.vehicle}</TableHead>
              <TableHead>{t.appointments.client}</TableHead>
              <TableHead>{t.appointments.serviceType}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="text-right">{t.common.actions_label}</TableHead>
            </tr>
          </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message={t.common.loading} />
          ) : filteredAppointments.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title={t.common.empty}
              description={t.common.noData}
            />
          ) : (
            filteredAppointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell>
                  <span className="font-bold text-text-primary block whitespace-nowrap">
                    {new Date(apt.preferred_date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-DZ')}
                  </span>
                  <span className="text-text-muted text-xs block capitalize font-mono">
                    {apt.preferred_time_slot || 'Matinée'}
                  </span>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/admin/vehicles/${apt.vehicle_id}`}
                    className="font-mono font-bold text-accent hover:underline block"
                  >
                    {apt.plate_number}
                  </Link>
                  <span className="text-text-secondary text-xs block">
                    {apt.make} {apt.model}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-bold text-text-primary block">{apt.client_name}</span>
                  <span className="text-text-muted font-mono text-xs block">
                    {apt.client_phone || apt.client_phone_registered}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-text-primary capitalize font-medium block">
                    {apt.service_type}
                  </span>
                  {apt.notes && (
                    <span className="text-text-muted text-xs line-clamp-1 max-w-xs block">
                      {apt.notes}
                    </span>
                  )}
                </TableCell>

                <TableCell>{getStatusBadge(apt.status)}</TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {apt.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={processingId === apt.id}
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setResponseStatus('confirmed');
                          setResponseText('');
                          setResponseModalOpen(true);
                        }}
                      >
                        {t.appointments.confirmBooking}
                      </Button>
                    )}

                    {apt.status === 'confirmed' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={processingId === apt.id}
                        onClick={() => handleConvertToServiceAction(apt.id)}
                      >
                        {t.actions.newAction}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      )}

      {/* Response Modal */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        title={t.appointments.confirmBooking}
        description={`Véhicule ${selectedAppointment?.plate_number} pour ${selectedAppointment?.client_name}`}
      >
        <div className="space-y-4">
          <Select
            label={t.appointments.garageNotes}
            value={responseStatus}
            onChange={(e) => setResponseStatus(e.target.value as 'confirmed' | 'cancelled')}
          >
            <option value="confirmed">{t.appointments.confirmBooking}</option>
            <option value="cancelled">{t.appointments.cancelBooking}</option>
          </Select>

          <Textarea
            label={t.portal.garageResponse}
            rows={3}
            placeholder="ex. Rendez-vous confirmé. Veuillez déposer le véhicule dès 08h30."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3">
            <Button
              className="flex-1"
              isLoading={processingId === selectedAppointment?.id}
              onClick={() => {
                if (selectedAppointment) {
                  handleUpdateStatus(selectedAppointment.id, responseStatus, responseText);
                }
              }}
            >
              {t.common.save}
            </Button>
            <Button variant="secondary" onClick={() => setResponseModalOpen(false)} className="flex-1">
              {t.common.cancel}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
