import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Users, CreditCard, Award, Clock, CheckCircle2, TrendingUp, DollarSign, BookOpen } from 'lucide-react';

export const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [mix, setMix] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, trendData, mixData] = await Promise.all([
          api.getAdminStats(),
          api.getRevenueTrend(),
          api.getRevenueMix(),
        ]);
        setStats(statsData);
        setTrend(trendData);
        setMix(mixData);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  // Stat cards definitions
  const statCards = [
    { label: 'TOTAL PLAYERS', value: stats?.total_players ?? 12, isMoney: false, isPending: false },
    { label: 'ACTIVE SUBSCRIBERS', value: stats?.active_subscribers ?? 1, isMoney: false, isPending: false },
    { label: 'TOTAL COACHES', value: stats?.total_coaches ?? 5, isMoney: false, isPending: false },
    { label: 'PENDING REVIEWS', value: stats?.pending_reviews ?? 2, isMoney: false, isPending: true },
    { label: 'COMPLETED REVIEWS', value: stats?.completed_reviews ?? 2, isMoney: false, isPending: false },
    { label: 'MONTHLY REVENUE', value: `₹${stats?.monthly_revenue ?? 699}`, isMoney: true, isPending: false },
    { label: 'COACH PAYOUTS', value: `₹${stats?.coach_payouts ?? 300}`, isMoney: true, isPending: false },
    { label: 'E-BOOK SALES', value: `₹${stats?.ebook_sales ?? 0}`, isMoney: true, isPending: false },
  ];

  return (
    <Shell>
      {/* Dark green hero banner (radius ~28px) */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#0F4A30] to-[#0B3D2B] p-8 sm:p-10 text-white mb-8 shadow-elevated relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight">
            Admin Overview
          </h1>
          <p className="text-white/80 text-base mt-2 font-medium">
            Platform health at a glance.
          </p>
        </div>
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 8 stat cards in 2 rows of 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, idx) => {
          const isGold = card.isMoney || card.isPending;
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

      {/* Charts Row: Revenue Trend (~2/3) + Revenue Mix (~1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Recharts Bar */}
        <div className="app-card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-2xl text-navy">Revenue Trend</h2>
              <p className="text-xs text-slate-500">Monthly revenue collection (INR)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-forest bg-forest/10 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Current YTD</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 800]} stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0B1B3A',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#0B4D3B" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Mix Recharts Pie */}
        <div className="app-card flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-navy mb-1">Revenue Mix</h2>
            <p className="text-xs text-slate-500">Subscription plans vs E-book sales</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {mix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || (index === 0 ? '#0B4D3B' : '#F59E0B')} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`₹${val}`, name]}
                  contentStyle={{
                    backgroundColor: '#0B1B3A',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
            {mix.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || (idx === 0 ? '#0B4D3B' : '#F59E0B') }}
                />
                <div className="text-xs">
                  <div className="font-semibold text-navy">{item.name}</div>
                  <div className="text-slate-500 font-heading text-sm font-bold">₹{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
};
