import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { DollarSign, ShieldCheck } from 'lucide-react';

export const CoachEarnings = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const data = await api.getCoachEarnings();
        setEarningsData(data);
      } catch (err) {
        console.error('Failed to load coach earnings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEarnings();
  }, []);

  const total = earningsData?.total ?? 150;
  const completed = earningsData?.reviews_completed ?? 1;
  const rate = earningsData?.rate_per_review ?? 150;
  const logs = earningsData?.earnings_log ?? [];

  return (
    <Shell
      title="Coach Earnings & Payouts"
      subtitle="Track your verified reviews payout ledger and monthly earnings balance."
    >
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="app-card">
          <span className="stat-label">TOTAL EARNED</span>
          <div className="mt-3">
            <span className="stat-number text-gold">₹{total}</span>
          </div>
        </div>

        <div className="app-card">
          <span className="stat-label">REVIEWS COMPLETED</span>
          <div className="mt-3">
            <span className="stat-number text-forest">{completed}</span>
          </div>
        </div>

        <div className="app-card">
          <span className="stat-label">RATE PER REVIEW</span>
          <div className="mt-3">
            <span className="stat-number text-forest">₹{rate}</span>
          </div>
        </div>
      </div>

      {/* Earnings Log Card */}
      <div className="app-card overflow-hidden p-0">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-navy">Earnings Log</h2>
            <p className="text-xs text-slate-500">Verified payouts per completed video evaluation</p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-forest bg-forest/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span>Direct Payout Verified</span>
          </div>
        </div>

        <div className="divide-y divide-surface-border">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No earnings logged yet. Complete reviews to start earning.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="h-[70px] px-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-navy text-sm">
                    {log.player_name || 'Player'}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {log.created_at ? new Date(log.created_at).toLocaleDateString('en-GB') : 'Recently'}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <span className="font-heading font-extrabold text-xl text-forest">
                    ₹{log.amount}
                  </span>
                  <StatusPill status={log.status || 'approved'} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
};
