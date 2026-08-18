'use client';

import React, { useState, useEffect } from 'react';

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
  const [testPlate, setTestPlate] = useState('16-123-456');
  const [testClient, setTestClient] = useState('Ahmed Benali');
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

      setTestSuccess('Notification envoyée avec succès !');
      fetchNotifications();
      setTimeout(() => {
        setShowModal(false);
        setTestSuccess('');
      }, 1500);
    } catch (err: any) {
      setTestError(err.message || 'Erreur.');
    } finally {
      setSendingTest(false);
    }
  };

  const sentCount = notifications.filter((n) => n.status === 'sent').length;
  const pendingCount = notifications.filter((n) => n.status === 'pending' || n.status === 'retrying').length;
  const failedCount = notifications.filter((n) => n.status === 'failed').length;

  return (
    <div className="space-y-8 font-sans max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Centre de Notifications & Alertes</h1>
          <p className="text-sm text-slate-400 mt-1">
            Suivi des envois multicanaux (SMS Algérie, WhatsApp et Email transactionnel) pour vos clients et confrères.
          </p>
        </div>

        <button
          onClick={() => {
            setTestSuccess('');
            setTestError('');
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Tester un Envoi Client</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Délivrés avec Succès</span>
          <div className="mt-2 text-3xl font-black text-emerald-400 font-mono">{sentCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">En File d&apos;Attente</span>
          <div className="mt-2 text-3xl font-black text-amber-400 font-mono">{pendingCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Échecs d&apos;Acheminement</span>
          <div className="mt-2 text-3xl font-black text-red-400 font-mono">{failedCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Canal :</span>
          {['all', 'sms', 'whatsapp', 'email'].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase transition border ${
                channelFilter === ch
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch === 'all' ? 'Tous' : ch}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Statut :</span>
          {['all', 'sent', 'pending', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase transition border ${
                statusFilter === st
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'all' ? 'Tous' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Canal</th>
                <th className="px-6 py-4">Destinataire</th>
                <th className="px-6 py-4">Modèle d&apos;Alerte</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucune notification enregistrée dans l&apos;historique.
                  </td>
                </tr>
              ) : (
                notifications.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.channel === 'sms'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : item.channel === 'whatsapp'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {item.channel}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-200">
                      {item.recipient}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200 capitalize">
                        {item.template.replace(/_/g, ' ')}
                      </div>
                      {item.subject && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.subject}</div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'sent' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Envoyé
                        </span>
                      ) : item.status === 'pending' || item.status === 'retrying' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          En file ({item.attempts})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          Échoué
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                        >
                          Réessayer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Test Notification */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Tester un Envoi Multicanal</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {testSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {testSuccess}
              </div>
            )}

            {testError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {testError}
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Canal de Transmission</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sms', 'whatsapp', 'email'] as const).map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => setTestChannel(ch)}
                      className={`p-2.5 rounded-xl border font-bold uppercase transition ${
                        testChannel === ch
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {testChannel === 'email' ? 'Adresse Email Destinataire' : 'Numéro de Téléphone (ex: 0550123456)'}
                </label>
                <input
                  type={testChannel === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={testChannel === 'email' ? 'client@gmail.com' : '0550 12 34 56'}
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Modèle d&apos;Alerte</label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 capitalize"
                >
                  <option value="intervention_completed">Véhicule Prêt (Fin d&apos;intervention)</option>
                  <option value="card_ready">Carte PVC Connectée Prête</option>
                  <option value="maintenance_reminder">Rappel d&apos;Entretien & Vidange</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nom du Client</label>
                  <input
                    type="text"
                    value={testClient}
                    onChange={(e) => setTestClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={testPlate}
                    onChange={(e) => setTestPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 uppercase font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendingTest || !testRecipient.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-50"
                >
                  {sendingTest ? 'Envoi...' : 'Déclencher l&apos;Alerte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
