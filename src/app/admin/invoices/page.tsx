'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  plate_number: string;
  client_name: string;
  action_type: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && role !== 'technician') {
      fetchInvoices();
    }
  }, [role]);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update invoice status');
      } else {
        fetchInvoices();
      }
    } catch (err) {
      alert('Communication failure during status update.');
    } finally {
      setUpdatingId('');
    }
  };

  if (role === 'technician') {
    return (
      <div className="text-red-400 p-8 text-center bg-slate-900 border border-red-500/10 rounded-2xl max-w-xl mx-auto">
        Access Denied. Invoicing and billing is restricted to managers and super admins.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Invoices</h2>
        <p className="text-slate-400 text-sm mt-1">Manage mechanical service billing, PDF invoices, and payments ledger</p>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading billing invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No invoices generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">Client / Plate</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                  <th className="px-6 py-4 text-right">Tax (19%)</th>
                  <th className="px-6 py-4 text-right">Total Due</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/30 transition duration-100">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-200">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold text-slate-300 block">{inv.client_name}</span>
                      <span className="text-slate-500 font-mono text-xs block mt-0.5">{inv.plate_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-slate-400">{inv.action_type}</td>
                    <td className="px-6 py-4 text-sm text-right text-slate-400 font-mono">${Number(inv.subtotal).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-right text-slate-400 font-mono">${Number(inv.tax_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-right text-slate-200 font-bold font-mono">${Number(inv.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inv.status === 'issued'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : inv.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <a
                        href={`/api/invoices/${inv.id}/download`}
                        target="_blank"
                        className="text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2 py-1 rounded transition"
                      >
                        Download PDF
                      </a>

                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(inv.id, 'issued')}
                          disabled={updatingId === inv.id}
                          className="text-xs font-bold text-blue-500 hover:text-blue-400"
                        >
                          Issue
                        </button>
                      )}

                      {inv.status === 'issued' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'paid')}
                            disabled={updatingId === inv.id}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'cancelled')}
                            disabled={updatingId === inv.id}
                            className="text-xs font-bold text-red-500 hover:text-red-400"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
