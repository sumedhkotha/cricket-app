import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Users, Clock, CheckCircle2, DollarSign, ArrowRight, Megaphone } from 'lucide-react';

export const CoachOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getCoachStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load coach stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const coachName = user?.name || 'Coach Rahul';
  const pendingCount = stats?.pending_reviews ?? 0;

  const statCards = [
    { label: 'ASSIGNED PLAYERS', value: stats?.assigned_players ?? 1, isMoney: false },
    { label: 'PENDING REVIEWS', value: pendingCount, isMoney: false, isPending: true },
    { label: 'COMPLETED REVIEWS', value: stats?.completed_reviews ?? 1, isMoney: false },
    { label: "THIS MONTH'S EARNINGS", value: `₹${stats?.this_months_earnings ?? 150}`, isMoney: true },
  ];

  return (
    <Shell>
      {/* Dark green hero banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#0F4A30] to-[#0B3D2B] p-8 sm:p-10 text-white mb-8 shadow-elevated relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight">
            Hello Coach {coachName.split(' ')[0]}
          </h1>
          <p className="text-white/80 text-base mt-2 font-medium">
            You have {pendingCount} pending review{pendingCount === 1 ? '' : 's'} waiting.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, idx) => {
          const isGold = card.isMoney || (card.isPending && card.value > 0);
          return (
            <div key={idx} className="app-card flex flex-col justify-between">
              <span className="stat-label">{card.label}</span>
              <div className="mt-3">
                <span className={`stat-number ${isGold ? 'text-gold' : 'text-forest'}`}>
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="app-card flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-navy">Pending Queue</h2>
            </div>
            <p className="text-sm text-slate-600">
              Review incoming student match videos, diagnose technique faults, and provide personalized drills.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/coach/pending"
              className="inline-flex items-center text-sm font-bold text-forest hover:text-forest-light group"
            >
              <span>Go to Pending Reviews</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="app-card flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-navy">Earnings & Payouts</h2>
            </div>
            <p className="text-sm text-slate-600">
              Earn ₹150 for each comprehensive review submitted. Track your monthly payouts and verified earnings ledger.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/coach/earnings"
              className="inline-flex items-center text-sm font-bold text-forest hover:text-forest-light group"
            >
              <span>View Earnings Ledger</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="app-card flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-navy">Announcements</h2>
            </div>
            <p className="text-sm text-slate-600">
              Broadcast training schedules, drills, match prep guidelines, and notices directly to your subscribed players.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/coach/announcements"
              className="inline-flex items-center text-sm font-bold text-forest hover:text-forest-light group"
            >
              <span>Manage Announcements</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
};
