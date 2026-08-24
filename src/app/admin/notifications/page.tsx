'use client';

import React, { useState, useEffect } from 'react';
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
  Modal,
} from '@/components/ui';

interface NotificationItem {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app';
  recipient: string;
  template: string;
  subject: string | null;
  payload: any;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Test Modal state
  const [showModal, setShowModal] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testChannel, setTestChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [testRecipient, setTestRecipient] = useState('');
  const [testTemplate, setTestTemplate] = useState('intervention_completed');
  const [testPlate, setTestPlate] = useState('01234-116-16');
  const [testClient, setTestClient] = useState('Karim Benali');
  const [testSuccess, setTestSuccess] = useState('');
  const [testError, setTestError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [channelFilter, statusFilter]);

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingTest(true);
      setTestError('');
      setTestSuccess('');

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: testChannel,
          recipient: testRecipient.trim(),
          template: testTemplate,
          payload: {
            client_name: testClient,
            plate_number: testPlate,
            vehicle_name: 'Véhicule Client',
            total_price: '4 500',
            due_date: '15/09/2026',
            due_mileage: '90000',
            qr_url: 'https://garagepro.app/v/demo',
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l’envoi du test.');
      }

      setTestSuccess('Notification envoyée avec succès dans la file d’attente.');
      fetchNotifications();
    } catch (err: any) {
      setTestError(err.message || 'Échec de l’envoi');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Délivré</Badge>;
      case 'pending':
        return <Badge variant="warning" pulse>En File d&apos;Attente</Badge>;
      case 'retrying':
        return <Badge variant="info" pulse>Nouvel Essai</Badge>;
      case 'failed':
        return <Badge variant="danger">Échec</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Centre de Notifications & Alertes"
        subtitle="Suivi des SMS, messages WhatsApp et emails automatiques envoyés aux clients"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Notifications' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTestError('');
              setTestSuccess('');
              setShowModal(true);
            }}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          >
            Tester un Envoi
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">Tous les canaux</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </Select>
          </div>

          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Délivrés</option>
              <option value="pending">En file d&apos;attente</option>
              <option value="failed">Échecs</option>
            </Select>
          </div>
        </div>

        <span className="text-xs text-text-muted font-mono font-bold">
          {notifications.length} message(s) répertorié(s)
        </span>
      </div>

      {/* Notifications Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Date & Heure</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Destinataire</TableHead>
            <TableHead>Modèle / Motif</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement des notifications..." />
          ) : notifications.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucune notification enregistrée"
              description="Les messages automatiques de fin de travaux ou de rappel de vidange apparaîtront ici."
            />
          ) : (
            notifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-mono text-xs text-text-muted whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </TableCell>
                <TableCell>
                  <Badge variant={n.channel === 'whatsapp' ? 'success' : n.channel === 'sms' ? 'info' : 'neutral'}>
                    {n.channel.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-bold text-text-primary">
                  {n.recipient}
                </TableCell>
                <TableCell className="text-xs text-text-secondary capitalize">
                  {n.template.replace(/_/g, ' ')}
                </TableCell>
                <TableCell>{getStatusBadge(n.status)}</TableCell>
                <TableCell className="text-right">
                  {n.status === 'failed' && (
                    <Button variant="secondary" size="sm" onClick={() => handleRetry(n.id)}>
                      Réessayer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tester un Envoi de Notification"
        description="Simulez l'envoi d'un message SMS, WhatsApp ou Email avec les modèles d'atelier."
      >
        <form onSubmit={handleSendTest} className="space-y-4">
          {testError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {testError}
            </div>
          )}
          {testSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              {testSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Canal de Transmission"
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value as any)}
            >
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp Business</option>
              <option value="email">Email</option>
            </Select>

            <Select
              label="Modèle de Message"
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value)}
            >
              <option value="intervention_completed">Travaux Terminés & Prêt</option>
              <option value="service_reminder">Rappel d&apos;Entretien / Vidange</option>
              <option value="appointment_confirmed">Confirmation de Rendez-vous</option>
            </Select>
          </div>

          <Input
            label="Numéro de Téléphone ou Email Destinataire"
            required
            placeholder="ex. 0550 12 34 56 ou client@example.com"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom du Client"
              value={testClient}
              onChange={(e) => setTestClient(e.target.value)}
            />
            <Input
              label="Immatriculation"
              value={testPlate}
              onChange={(e) => setTestPlate(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={sendingTest} className="flex-1">
              Transmettre le Test
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Fermer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
