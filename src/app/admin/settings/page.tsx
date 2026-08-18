'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function WorkshopSettingsPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    brand_color_primary: '#0f172a',
    brand_color_secondary: '#3b82f6',
    locale: 'fr',
    currency: 'DZD',
    timezone: 'Africa/Algiers',
    address: '',
    phone: '',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/branding');
      if (!res.ok) throw new Error('Impossible de charger les paramètres.');
      const data = await res.json();
      setFormData({
        name: data.name || '',
        logo_url: data.logo_url || '',
        brand_color_primary: data.brand_color_primary || '#0f172a',
        brand_color_secondary: data.brand_color_secondary || '#3b82f6',
        locale: data.locale || 'fr',
        currency: data.currency || 'DZD',
        timezone: data.timezone || 'Africa/Algiers',
        address: data.address || '',
        phone: data.phone || '',
      });
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/organization/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      }

      setSuccess(true);
      if (formData.locale !== locale) {
        setLocale(formData.locale as any);
      }
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{t.settings.subtitle}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 shadow-lg shadow-emerald-900/20">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{t.settings.savedSuccessfully}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informations Générales & Coordonnées */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            1. Informations de l&apos;Atelier
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.garageName} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.phone} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.address}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personnalisation Graphique & Marque */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            2. Identité Visuelle & Couleurs de Marque
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.logoUrl}
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.primaryColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.brand_color_primary}
                  onChange={(e) => setFormData({ ...formData, brand_color_primary: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.brand_color_primary}
                  onChange={(e) => setFormData({ ...formData, brand_color_primary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.secondaryColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.brand_color_secondary}
                  onChange={(e) => setFormData({ ...formData, brand_color_secondary: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.brand_color_secondary}
                  onChange={(e) => setFormData({ ...formData, brand_color_secondary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-950/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Aperçu Thème Atelier</h3>
            <div
              className="p-5 rounded-xl text-white flex items-center justify-between shadow-lg transition-all"
              style={{ backgroundColor: formData.brand_color_primary }}
            >
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-md"
                    style={{ backgroundColor: formData.brand_color_secondary }}
                  >
                    GP
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm">{formData.name || 'Nom de votre Atelier'}</h4>
                  <p className="text-[11px] opacity-80">{formData.address || 'Alger, Algérie'}</p>
                </div>
              </div>

              <div
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: formData.brand_color_secondary }}
              >
                Passeport Véhicule
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Langue, Devise et Régionalisation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            3. Langue, Devise & Régionalisation (RTL / LTR)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.defaultLocale}
              </label>
              <select
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="fr">Français (LTR)</option>
                <option value="ar">العربية (RTL - اليمين إلى اليسار)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.currency}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="DZD">Dinar Algérien (DZD - د.ج)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="USD">Dollar Américain (USD - $)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.settings.timezone}
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span>Enregistrement en cours...</span>
            ) : (
              <>
                <span>{t.common.save}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
