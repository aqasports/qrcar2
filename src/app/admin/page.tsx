'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DashboardData {
  revenue: { paid: number; issued: number; total: number };
  activeVehicles: number;
  leaderboard: Array<{ id: string; full_name: string; role: string; job_count: number }>;
  lowStockCount: number;
  totalClients: number;
  recentJobs: Array<{
    id: string;
    type: string;
    status: string;
    date_in: string;
    plate_number: string;
    make: string;
    model: string;
  }>;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username || 'User';
  const role = session?.user?.role || 'staff';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (role === 'technician') {
        setLoading(false);
        return; // Technicians don't load overview metrics
      }
      try {
        const res = await fetch('/api/dashboard');
        const d = await res.json();
        if (!res.ok) {
          console.error(d.error);
        } else {
          setData(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (role) {
      fetchDashboard();
    }
  }, [role]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, {username}!</h2>
        <p className="text-blue-100 mt-2 max-w-md">
          Access the back-office tools to manage clients, track vehicles, and update service histories.
        </p>
        <span className="inline-block mt-4 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
          Role: {role.replace('_', ' ')}
        </span>
      </div>

      {role !== 'technician' && !loading && data && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Revenue</span>
              <span className="text-slate-100 font-bold font-mono text-2xl mt-1.5 block">
                {(data.revenue?.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Paid: {(data.revenue?.paid ?? 0).toLocaleString()} DA | Issued: {(data.revenue?.issued ?? 0).toLocaleString()} DA
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Vehicles in Shop</span>
              <span className="text-slate-100 font-bold font-mono text-2xl mt-1.5 block">
                {data.activeVehicles ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Currently undergoing service</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Low Stock Items</span>
              <span className={`font-bold font-mono text-2xl mt-1.5 block ${(data.lowStockCount ?? 0) > 0 ? 'text-amber-500' : 'text-slate-100'}`}>
                {data.lowStockCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Under threshold limits</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Client Owners</span>
              <span className="text-slate-100 font-bold font-mono text-2xl mt-1.5 block">
                {data.totalClients ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Registered in directory</span>
            </div>
          </div>

          {/* Leaderboard and Recent Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Recent Jobs */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-100 font-bold">Recent Service Jobs</h3>
                <Link href="/admin/actions" className="text-xs text-blue-400 hover:underline font-bold">
                  View All &rarr;
                </Link>
              </div>

              {(data.recentJobs || []).length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm font-semibold text-slate-400">No service jobs logged yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Actions created in the workshop will appear here in real-time.</p>
                  <Link
                    href="/admin/actions"
                    className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                  >
                    Log First Action
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentJobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(job.date_in).toLocaleDateString()}
                        </span>
                        <h4 className="font-bold text-slate-200 capitalize text-sm mt-0.5">
                          <Link href={`/admin/actions/${job.id}`} className="hover:text-blue-400 transition">
                            {job.make} {job.model} ({job.type})
                          </Link>
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-xs text-slate-300 block mb-1">
                          {job.plate_number}
                        </span>
                        <span className={`inline-block text-[9px] font-bold uppercase px-1.5 rounded-full ${
                          job.status === 'completed' || job.status === 'invoiced'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-100 font-bold">Worker Leaderboard</h3>
                <Link href="/admin/workers" className="text-xs text-blue-400 hover:underline font-bold">
                  Staff &rarr;
                </Link>
              </div>
              <p className="text-slate-500 text-xs mb-4">Ranked by count of lead technician jobs</p>

              {(data.leaderboard || []).length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm font-semibold text-slate-400">No staff performance data yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Add workshop technicians to start tracking performance.</p>
                  <Link
                    href="/admin/workers"
                    className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Add Worker
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.leaderboard.map((w, index) => (
                    <div key={w.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 w-4">#{index + 1}</span>
                        <div>
                          <span className="text-sm font-semibold text-slate-200 block">{w.full_name}</span>
                          <span className="text-[10px] text-slate-500 block capitalize">{w.role}</span>
                        </div>
                      </div>
                      <span className="bg-blue-600/15 border border-blue-500/20 text-blue-400 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {w.job_count} lead jobs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reports Export Center */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-slate-100 font-bold mb-2">Reports & Exports Center</h3>
            <p className="text-slate-500 text-xs mb-6">Download full ledger directories in spreadsheet-ready CSV formats.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="/api/reports/export?type=clients"
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-bold text-sm text-slate-300 transition"
              >
                Export Clients Catalog &darr;
              </a>
              <a
                href="/api/reports/export?type=actions"
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-bold text-sm text-slate-300 transition"
              >
                Export Action History &darr;
              </a>
              <a
                href="/api/reports/export?type=inventory"
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-bold text-sm text-slate-300 transition"
              >
                Export Inventory Catalog &darr;
              </a>
            </div>
          </div>
        </>
      )}

      {/* Quick Links Grid for everyone (including technicians) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition duration-200 group">
          <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition">Rendez-Vous</h3>
          <p className="text-slate-400 text-sm mt-1">Review incoming booking requests from QR cards and confirm slots.</p>
          <Link href="/admin/appointments" className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-400 mt-4 gap-1">
            Manage Bookings &rarr;
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition duration-200 group">
          <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition">Clients</h3>
          <p className="text-slate-400 text-sm mt-1">Register new clients, search directories, and update contact files.</p>
          <Link href="/admin/clients" className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-400 mt-4 gap-1">
            Manage Clients &rarr;
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition duration-200 group">
          <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition">Vehicles</h3>
          <p className="text-slate-400 text-sm mt-1">Track vehicle makes, colors, mileage records, and active PVC QR cards.</p>
          <Link href="/admin/vehicles" className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-400 mt-4 gap-1">
            Manage Vehicles &rarr;
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition duration-200 group">
          <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition">Service Actions</h3>
          <p className="text-slate-400 text-sm mt-1">Log inspections, repair procedures, and maintenance workflows.</p>
          <Link href="/admin/actions" className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-400 mt-4 gap-1">
            Manage Actions &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
