'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Worker {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  hourly_rate: number;
  active: boolean;
  user_id: string | null;
}

interface UserAccount {
  id: string;
  username: string;
  role: string;
}

export default function WorkersPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleInput, setRoleInput] = useState('Technician');
  const [hourlyRate, setHourlyRate] = useState('25.00');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'technician') {
      fetchWorkers();
      fetchUsers();
    }
  }, [userRole]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFullName('');
    setPhone('');
    setRoleInput('Technician');
    setHourlyRate('25.00');
    setLinkedUserId('');
    setActive(true);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setIsEditing(true);
    setSelectedWorkerId(w.id);
    setFullName(w.full_name);
    setPhone(w.phone || '');
    setRoleInput(w.role);
    setHourlyRate(w.hourly_rate.toString());
    setLinkedUserId(w.user_id || '');
    setActive(w.active);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const payload = {
      full_name: fullName,
      phone: phone || null,
      worker_role: roleInput,
      hourly_rate: parseFloat(hourlyRate) || 0.00,
      user_id: linkedUserId || null,
      active: active
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/workers/${selectedWorkerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to save worker record');
      } else {
        setShowModal(false);
        fetchWorkers();
      }
    } catch (err) {
      setFormError('Network communication failure.');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole === 'technician') {
    return (
      <div className="text-red-400 p-8 text-center bg-slate-900 border border-red-500/10 rounded-2xl max-w-xl mx-auto">
        Access Denied. Worker administration is restricted to managers and super admins.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Workers</h2>
          <p className="text-slate-400 text-sm mt-1">Manage workshop technicians and labor records</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition duration-150 active:scale-[0.98] shadow-lg shadow-blue-500/10"
        >
          Add Worker
        </button>
      </div>

      {/* Workers Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading worker directory...</div>
        ) : workers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No worker records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Role / Title</th>
                  <th className="px-6 py-4">Hourly Rate</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Linked User</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-850/30 transition duration-100">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">{w.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{w.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{w.role}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">${Number(w.hourly_rate).toFixed(2)}/hr</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        w.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {w.active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {w.user_id ? (
                        <span className="font-mono text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                          {users.find(u => u.id === w.user_id)?.username || 'Linked Account'}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleOpenEdit(w)}
                        className="text-xs font-bold text-blue-500 hover:text-blue-400 transition"
                      >
                        Edit Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {isEditing ? 'Edit Worker File' : 'Register New Worker'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Devine"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0550112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Electrician"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Link Login Account
                </label>
                <select
                  value={linkedUserId}
                  onChange={(e) => setLinkedUserId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-200 outline-none text-sm"
                >
                  <option value="">-- No linked account (labor only) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-0"
                  />
                  <label htmlFor="active" className="text-slate-300 text-sm font-semibold cursor-pointer">
                    Active Workshop Worker
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
