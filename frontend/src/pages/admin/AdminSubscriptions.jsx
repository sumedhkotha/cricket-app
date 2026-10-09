import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';

export const AdminSubscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubs = async () => {
      try {
        const data = await api.getAdminSubscriptions();
        setSubs(data || []);
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSubs();
  }, []);

  return (
    <Shell
      title="Platform Subscriptions"
      subtitle="Overview of active coaching plan members and recurring memberships."
    >
      <div className="app-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Plan</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">User ID</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Player Name</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Started</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Expires</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-sm">
                    No subscriptions registered.
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="h-[70px] hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30">
                        {s.plan_name || 'Elite'}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-slate-600">
                      {s.user_display || (s.user_id ? s.user_id.slice(0, 8) : '—')}
                    </td>
                    <td className="py-3 px-6 font-semibold text-navy text-sm">
                      {s.user_name || 'Rohan Verma'}
                    </td>
                    <td className="py-3 px-6">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="py-3 px-6 text-slate-600 text-sm">
                      {s.started_at ? new Date(s.started_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-600 text-sm">
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-3 px-6 text-right font-heading text-lg font-bold text-navy">
                      ₹{s.amount ?? 699}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};
