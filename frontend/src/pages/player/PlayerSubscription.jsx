import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { CreditCard, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export const PlayerSubscription = () => {
  const [subData, setSubData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const data = await api.getPlayerSubscription();
        setSubData(data?.subscription);
        setHistory(data?.payment_history || []);
      } catch (err) {
        console.error('Failed to load subscription info:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSubscription();
  }, []);

  const sub = subData;

  return (
    <Shell
      title="My Subscription"
      subtitle="Manage your coaching membership, video review allowance and invoices."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : sub ? (
        <div className="space-y-8">
          {/* Active Plan Card */}
          <div className="app-card p-8 sm:p-10 shadow-elevated border-2 border-forest/20 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Left Side: Plan name + Price + Reviews remaining */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-heading font-extrabold uppercase tracking-widest bg-gold text-navy-dark shadow-xs">
                    {sub.plan_name || 'ELITE'}
                  </span>
                  <span className="text-sm font-bold text-forest">Active Membership</span>
                </div>

                <div className="font-heading font-extrabold text-4xl text-navy my-2">
                  ₹{sub.price ?? 699}
                  <span className="text-xl font-normal text-slate-500">/{sub.interval ?? 'month'}</span>
                </div>

                <div className="text-sm text-slate-700 font-medium mt-3">
                  Reviews remaining this month:{' '}
                  <span className="font-bold text-forest text-lg">
                    {sub.reviews_remaining ?? 2} / 3
                  </span>
                </div>
              </div>

              {/* Right Side: Dates & Renew button */}
              <div className="flex flex-col md:items-end space-y-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-xs text-slate-500 font-medium leading-relaxed md:text-right">
                  <div>
                    Started:{' '}
                    <span className="font-semibold text-navy">
                      {sub.started_at ? new Date(sub.started_at).toLocaleDateString('en-GB') : '06/10/2026'}
                    </span>
                  </div>
                  <div>
                    Expires:{' '}
                    <span className="font-semibold text-navy">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-GB') : '31/10/2026'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/player/checkout?type=plan&id=${sub.plan_id || 'plan_elite'}`}
                  className="btn-primary text-xs sm:text-sm px-6 py-2.5 font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Renew Plan</span>
                </Link>
              </div>
            </div>

            {/* Background decorative glow */}
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-forest/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Payment History Card */}
          <div className="app-card overflow-hidden p-0">
            <div className="p-6 border-b border-surface-border">
              <h2 className="font-heading font-bold text-2xl text-navy">Payment History</h2>
              <p className="text-xs text-slate-500">Invoices and completed payments</p>
            </div>

            <div className="divide-y divide-surface-border">
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No payment transactions found.
                </div>
              ) : (
                history.map((p) => {
                  const dateStr = p.created_at
                    ? new Date(p.created_at).toLocaleDateString('en-GB')
                    : '06/10/2026';

                  return (
                    <div
                      key={p.id}
                      className="h-[70px] px-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-navy text-sm">{p.item_name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <span className="font-heading font-extrabold text-xl text-navy">
                          ₹{p.amount}
                        </span>
                        <StatusPill status={p.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="app-card py-20 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center text-forest mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-navy">
            You don't have an active plan
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mb-6">
            Get 3 monthly video reviews, direct coach access, and live clinics with the Elite plan.
          </p>
          <Link to="/player/plans" className="btn-primary text-sm font-bold px-8 py-3">
            View Plans
          </Link>
        </div>
      )}
    </Shell>
  );
};
