'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AuditLog {
  id: string;
  user_name: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/audit');
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (role === 'super_admin') {
      fetchLogs();
    }
  }, [role]);

  if (role !== 'super_admin') {
    return (
      <div className="text-red-400 p-8 text-center bg-slate-900 border border-red-500/10 rounded-2xl max-w-xl mx-auto">
        Access Denied. System audit trails are strictly restricted to Super Administrators.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Audit Logs</h2>
        <p className="text-slate-400 text-sm mt-1">Immutable system mutation trail and security logs</p>
      </div>

      {/* Audit Timeline Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No mutation records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Entity Type</th>
                  <th className="px-6 py-4">Mutation</th>
                  <th className="px-6 py-4">Action Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition duration-100 text-sm">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {log.user_name ? (
                        <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-xs font-mono">
                          {log.user_name}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">system</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs uppercase">{log.entity_type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        log.action === 'create'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action === 'delete' || log.action === 'revoke'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : log.action === 'transfer'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400 max-w-md truncate select-all">
                      {JSON.stringify(log.metadata)}
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
