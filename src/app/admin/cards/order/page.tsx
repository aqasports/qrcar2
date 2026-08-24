'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ALGERIA_WILAYAS, VOLUME_TIERS } from '@/lib/algeria-wilayas';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
} from '@/components/ui';

export default function CardOrderPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(100);
  const [shippingData, setShippingData] = useState({
    recipient_name: '',
    phone: '',
    wilaya: '16 - Alger',
    commune_address: '',
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const designsRes = await fetch('/api/cards/designs');
      if (designsRes.ok) {
        const dList = await designsRes.json();
        const approved = dList.filter((d: any) => d.status === 'approved');
        setDesigns(approved);
        if (approved.length > 0) {
          setSelectedDesignId(approved[0].id);
        }
      }

      const ordersRes = await fetch('/api/cards/orders');
      if (ordersRes.ok) {
        const oList = await ordersRes.json();
        setOrders(oList);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentTier =
    VOLUME_TIERS.find((t) => t.quantity === selectedQuantity) || VOLUME_TIERS[1];
  const totalPrice = selectedQuantity * currentTier.unitPrice;
  const selectedDesign = designs.find((d) => d.id === selectedDesignId);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignId) {
      setError('Veuillez sélectionner un modèle de carte validé.');
      return;
    }

    try {
      setOrdering(true);
      setError('');

      const res = await fetch('/api/cards/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_design_id: selectedDesignId,
          quantity: selectedQuantity,
          shipping_address: `${shippingData.recipient_name} - ${shippingData.commune_address}`,
          shipping_wilaya: shippingData.wilaya,
          shipping_phone: shippingData.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la commande.');
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur.');
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement des commandes de cartes...</p>
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Livré</Badge>;
      case 'shipped':
        return <Badge variant="info">En Cours d&apos;Expédition</Badge>;
      case 'printing':
        return <Badge variant="warning" pulse>En Impression Usine</Badge>;
      case 'paid':
        return <Badge variant="info">Payé / En File</Badge>;
      case 'pending':
        return <Badge variant="neutral">En Attente Paiement</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Commande de Cartes PVC Pro (Impression Usine)"
        subtitle="Commandez vos lots de cartes physiques rigides CR-80 laminées avec puces QR scannables haute résistance"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Cartes PVC', href: '/admin/cards' },
          { label: 'Commande Usine' },
        ]}
      />

      {successParam && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          Commande enregistrée et payée avec succès ! Notre imprimerie partenaire prépare votre lot de cartes.
        </div>
      )}
      {canceledParam && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/25 text-warning text-xs font-semibold">
          Le paiement a été interrompu. Vous pouvez renouveler votre commande à tout moment.
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {designs.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">Aucun Modèle de Carte Validé</h3>
            <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
              Avant de passer commande, vous devez créer et soumettre votre design de carte dans le Studio Graphique pour validation technique 300 DPI.
            </p>
          </div>
          <Link href="/admin/cards/studio">
            <Button variant="primary">
              Ouvrir le Studio Graphique PVC →
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Order Form (7 cols) */}
          <form onSubmit={handleCreateOrder} className="lg:col-span-7 space-y-6">
            {/* Quantity Selector */}
            <Card>
              <CardHeader>
                <CardTitle>1. Choix du Volume de Cartes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {VOLUME_TIERS.map((tier) => {
                    const isSelected = selectedQuantity === tier.quantity;
                    return (
                      <button
                        key={tier.quantity}
                        type="button"
                        onClick={() => setSelectedQuantity(tier.quantity)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-accent/15 border-accent text-white shadow-lg shadow-blue-500/10'
                            : 'bg-surface-base border-border-subtle hover:border-border-default text-text-muted'
                        }`}
                      >
                        <span className="text-sm font-black font-mono block">{tier.quantity} cartes</span>
                        <span className="text-[10px] text-text-muted block mt-0.5">{tier.unitPrice} DZD / u</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Model & Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>2. Modèle Graphique & Adresse de Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Modèle Validé à Imprimer"
                  value={selectedDesignId}
                  onChange={(e) => setSelectedDesignId(e.target.value)}
                >
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.layout_preset}) — Validé
                    </option>
                  ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Destinataire / Contact Atelier"
                    required
                    placeholder="ex. Réception Garage Auto"
                    value={shippingData.recipient_name}
                    onChange={(e) => setShippingData({ ...shippingData, recipient_name: e.target.value })}
                  />
                  <Input
                    label="Téléphone de Livraison (Yalidine)"
                    required
                    type="tel"
                    placeholder="ex. 0550 12 34 56"
                    value={shippingData.phone}
                    onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Wilaya de Livraison"
                    value={shippingData.wilaya}
                    onChange={(e) => setShippingData({ ...shippingData, wilaya: e.target.value })}
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={`${w.code} - ${w.name}`}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Commune & Adresse Complète"
                    required
                    placeholder="ex. Bab Ezzouar, Cité 5 Juillet"
                    value={shippingData.commune_address}
                    onChange={(e) => setShippingData({ ...shippingData, commune_address: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" isLoading={ordering} className="w-full" size="lg">
              Payer {totalPrice.toLocaleString()} DZD via Chargily (BaridiMob / CIB)
            </Button>
          </form>

          {/* Cost Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif de la Commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs sm:text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Modèle sélectionné</span>
                  <span className="font-bold text-text-primary">{selectedDesign?.name || 'Standard'}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Quantité</span>
                  <span className="font-mono font-bold text-text-primary">{selectedQuantity} cartes</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Prix unitaire HT</span>
                  <span className="font-mono text-text-muted">{currentTier.unitPrice} DZD / carte</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Livraison Yalidine Express</span>
                  <span className="text-emerald-400 font-bold">Incluse</span>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="font-bold text-text-primary">Total TTC à Régler</span>
                  <span className="text-xl font-black font-mono text-accent">
                    {totalPrice.toLocaleString()} DZD
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Orders History Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Historique des Commandes de Cartes</h2>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Numéro Commande</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>N° Suivi Yalidine</TableHead>
              <TableHead>Date</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                title="Aucune commande passée"
                description="Vos commandes de fabrication physique de cartes PVC apparaîtront ici."
              />
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-bold text-text-primary">
                    {o.order_number}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {o.quantity} cartes
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-accent">
                    {Number(o.total_amount_dzd).toLocaleString()} DZD
                  </TableCell>
                  <TableCell>{getOrderStatusBadge(o.status)}</TableCell>
                  <TableCell className="font-mono text-xs text-text-muted">
                    {o.tracking_number ? (
                      <span className="text-accent font-bold">{o.tracking_number}</span>
                    ) : (
                      'En attente'
                    )}
                  </TableCell>
                  <TableCell className="text-text-muted text-xs whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
