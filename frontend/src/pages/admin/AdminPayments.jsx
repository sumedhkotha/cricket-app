import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await api.getAdminPayments();
        setPayments(data || []);
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  return (
    <Shell
      title="Payment Transactions"
      subtitle="Complete ledger of subscription plan renewals and e-book sales."
    >
      <div className="app-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Item</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Player</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="h-[70px] hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-navy text-sm">
                      {p.item_name}
                    </td>
                    <td className="py-3 px-6 text-slate-600 text-sm">
                      {p.user_name || 'Player'}
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-600 text-sm">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : 'Recently'}
                    </td>
                    <td className="py-3 px-6">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="py-3 px-6 text-right font-heading text-lg font-bold text-forest">
                      ₹{p.amount}
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
