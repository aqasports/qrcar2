'use client';

import React, { useEffect, useState } from 'react';
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

export default function PlatformAdminCardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'in_production' | 'shipped' | 'delivered'>('paid');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [shippingModalOrder, setShippingModalOrder] = useState<any>(null);
  const [carrierName, setCarrierName] = useState('Yalidine Express');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/card-orders');
      if (!res.ok) throw new Error('Impossible de charger les commandes de cartes.');
      const list = await res.json();
      setOrders(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, tracking?: string, carrier?: string) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch(`/api/platform-admin/card-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          tracking_number: tracking,
          carrier_name: carrier,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la mise à jour.');
      }

      await fetchOrders();
      setShippingModalOrder(null);
      setTrackingNumber('');
    } catch (err: any) {
      alert(err.message || 'Erreur de mise à jour.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const pendingActionCount = orders.filter((o) => o.status === 'paid' || o.status === 'in_production').length;

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Livré</Badge>;
      case 'shipped':
        return <Badge variant="info">Expédié Yalidine</Badge>;
      case 'in_production':
        return <Badge variant="warning" pulse>Impression Usine</Badge>;
      case 'paid':
        return <Badge variant="info">Payé / À Imprimer</Badge>;
      case 'pending':
        return <Badge variant="neutral">En Attente Paiement</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Expéditions & Commandes Cartes PVC"
        subtitle="Mise en fabrication usine offset 300 DPI, génération de lots QR et expédition Yalidine"
        breadcrumbs={[
          { label: 'Platform Admin', href: '/platform-admin' },
          { label: 'Commandes Cartes' },
        ]}
        badge={<Badge variant="danger">Super Admin</Badge>}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          type="button"
          onClick={() => setFilter('paid')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'paid'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Payées / À Traiter ({orders.filter((o) => o.status === 'paid').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('in_production')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'in_production'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          En Impression ({orders.filter((o) => o.status === 'in_production').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('shipped')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'shipped'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Expédiées
        </button>
        <button
          type="button"
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'delivered'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Livrées
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            filter === 'all'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Toutes ({orders.length})
        </button>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>N° Commande</TableHead>
            <TableHead>Atelier Client</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Wilaya & Adresse</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={7} message="Chargement des commandes usine..." />
          ) : filtered.length === 0 ? (
            <TableEmptyState
              colSpan={7}
              title="Aucune commande dans cet état"
              description="Toutes les commandes de fabrication passées par les ateliers apparaîtront ici."
            />
          ) : (
            filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono font-bold text-text-primary">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <span className="font-bold text-text-primary block">{order.org_name || 'Atelier'}</span>
                  <span className="text-xs font-mono text-text-muted block">{order.shipping_phone}</span>
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {order.quantity} cartes
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">
                  {Number(order.total_amount_dzd).toLocaleString()} DZD
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-text-primary block text-xs">{order.shipping_wilaya}</span>
                  <span className="text-text-muted text-[11px] block line-clamp-1">{order.shipping_address}</span>
                </TableCell>
                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {order.status === 'paid' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoadingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'in_production')}
                      >
                        Lancer Impression
                      </Button>
                    )}
                    {order.status === 'in_production' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setShippingModalOrder(order);
                          setTrackingNumber('');
                        }}
                      >
                        Expédier
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoadingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      >
                        Marquer Livré
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Shipping Modal */}
      <Modal
        isOpen={Boolean(shippingModalOrder)}
        onClose={() => setShippingModalOrder(null)}
        title="Expédition de la Commande"
        description={`Affectation du bordereau pour la commande ${shippingModalOrder?.order_number}`}
      >
        <div className="space-y-4">
          <Select
            label="Transporteur"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
          >
            <option value="Yalidine Express">Yalidine Express</option>
            <option value="ZR Express">ZR Express</option>
            <option value="Maystro Delivery">Maystro Delivery</option>
            <option value="Coursier Propre">Coursier Propre Atelier</option>
          </Select>

          <Input
            label="Numéro de Suivi Colis (Tracking)"
            required
            placeholder="ex. YAL-89210948DZ"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="font-mono font-bold"
          />

          <div className="flex gap-2.5 pt-3">
            <Button
              className="flex-1"
              isLoading={actionLoadingId === shippingModalOrder?.id}
              onClick={() =>
                shippingModalOrder &&
                handleUpdateStatus(
                  shippingModalOrder.id,
                  'shipped',
                  trackingNumber,
                  carrierName
                )
              }
            >
              Valider l&apos;Expédition
            </Button>
            <Button variant="secondary" onClick={() => setShippingModalOrder(null)} className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
