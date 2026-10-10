import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { CricketSeam } from '../../components/CricketSeam';
import { api } from '../../api';
import {
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Users,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

export const PlayerCricketHub = () => {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'stats' | 'compare' | 'analysis' | 'ai_biomechanics'
  const [subData, setSubData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pointsTable, setPointsTable] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonError, setComparisonError] = useState('');
  const [selectedAnalysisMatch, setSelectedAnalysisMatch] = useState('match_ipl_2026_01');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedAnalyticsPlayer, setSelectedAnalyticsPlayer] = useState('ply_vk18');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [subRes, matchesRes, pointsRes, statsRes] = await Promise.all([
          api.getPlayerSubscription().catch(() => null),
          api.getCricketMatches().catch(() => ({ matches: [] })),
          api.getCricketPointsTable().catch(() => ({ data: [] })),
          api.getCricketStats().catch(() => null),
        ]);
        setSubData(subRes?.subscription);
        setMatches(matchesRes?.matches || []);
        setPointsTable(pointsRes?.data || []);
        setStatsData(statsRes);

        // Pre-select first 2 players for comparison
        if (statsRes?.players?.length >= 2) {
          const initialIds = [statsRes.players[0].id, statsRes.players[1].id];
          setSelectedPlayers(initialIds);
          try {
            const comp = await api.compareCricketPlayers(initialIds.join(','));
            setComparisonResult(comp);
          } catch (err) {
            // Might be restricted for free users
            setComparisonError(err.message || 'Comparison restricted.');
          }
        }
      } catch (err) {
        console.error('Failed to load cricket hub data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // When selected analytics player changes, load analytics if eligible
  useEffect(() => {
    if (subData?.tier === 'elite_legend') {
      api.getEliteAnalytics(selectedAnalyticsPlayer)
        .then((res) => setAnalyticsData(res))
        .catch(() => setAnalyticsData(null));
    }
  }, [selectedAnalyticsPlayer, subData?.tier]);

  const tier = subData?.tier || 'free';
  const tierLimits = { free: 0, rookie: 2, pro_striker: 4, elite_legend: 8 };
  const allowedComparison = tierLimits[tier] || 0;
  const isRookieOrAbove = ['rookie', 'pro_striker', 'elite_legend'].includes(tier);
  const isProStrikerOrAbove = ['pro_striker', 'elite_legend'].includes(tier);
  const isEliteLegend = tier === 'elite_legend';

  // Handle Player Selection for Comparison
  const handleTogglePlayerSelection = async (playerId) => {
    let nextSelected;
    if (selectedPlayers.includes(playerId)) {
      if (selectedPlayers.length <= 1) return;
      nextSelected = selectedPlayers.filter((id) => id !== playerId);
    } else {
      if (selectedPlayers.length >= allowedComparison) {
        setComparisonError(
          `Your ${subData?.plan_name || 'Free'} tier is limited to ${allowedComparison} players. Upgrade your plan to compare more.`
        );
        return;
      }
      nextSelected = [...selectedPlayers, playerId];
    }

    setSelectedPlayers(nextSelected);
    setComparisonError('');

    try {
      const comp = await api.compareCricketPlayers(nextSelected.join(','));
      setComparisonResult(comp);
    } catch (err) {
      setComparisonError(err.message || 'Comparison error.');
    }
  };

  const playersList = statsData?.players || [];

  return (
    <Shell
      title="Cricket Analytics & Intelligence Hub"
      subtitle="Real-world match feeds, player performance telemetry, comparative radar, and AI biomechanics."
      headerAction={
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Active Tier:</span>
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-heading font-extrabold uppercase tracking-wider ${
              tier === 'elite_legend'
                ? 'bg-gold text-navy-dark shadow-xs'
                : tier === 'pro_striker'
                ? 'bg-forest text-white'
                : tier === 'rookie'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <span>{subData?.plan_name || 'Free Tier'}</span>
          </span>
          {!isEliteLegend && (
            <Link
              to="/player/plans"
              className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-xs flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Upgrade</span>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-6xl mx-auto my-4">
        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto pb-2 scrollbar-none border-b border-surface-border gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'live'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-surface-border'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Live Matches & Standings</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'stats'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-surface-border'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>Player Statistics</span>
            {!isRookieOrAbove && <Lock className="w-3 h-3 text-amber-500" />}
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'compare'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-surface-border'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Player Comparison</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-extrabold">
              {allowedComparison}/8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'analysis'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-surface-border'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Detailed Match Analysis</span>
            {!isProStrikerOrAbove && <Lock className="w-3 h-3 text-amber-500" />}
          </button>

          <button
            onClick={() => setActiveTab('ai_biomechanics')}
            className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'ai_biomechanics'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-surface-border'
            }`}
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>AI Summaries & Biomechanics</span>
            {!isEliteLegend && <Lock className="w-3 h-3 text-amber-500" />}
          </button>
        </div>

        {/* TAB 1: LIVE MATCHES & STANDINGS */}
        {activeTab === 'live' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Matches List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-xl text-navy">
                  Current & Upcoming Matches
                </h3>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ● Verified Match Feed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="app-card p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">{m.tournament}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            m.status === 'live'
                              ? 'bg-red-100 text-red-600 animate-pulse'
                              : m.status === 'completed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      {/* Teams & Scores */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-extrabold text-navy text-base">{m.team1}</span>
                          <span className="font-heading font-bold text-navy text-sm tabular-nums">{m.team1_score || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-extrabold text-navy text-base">{m.team2}</span>
                          <span className="font-heading font-bold text-navy text-sm tabular-nums">{m.team2_score || '-'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-forest font-semibold mb-4 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        {m.match_status_text}
                      </p>
                    </div>

                    <div>
                      {m.scorecard?.batters?.length > 0 && (
                        <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                          <span className="font-bold text-slate-700">Top Batter: </span>
                          {m.scorecard.batters[0].name} ({m.scorecard.batters[0].runs} off {m.scorecard.batters[0].balls}b)
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 truncate">📍 {m.venue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Points Table */}
            <div className="app-card overflow-hidden p-0 border border-slate-200">
              <div className="p-6 border-b border-surface-border flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl text-navy">IPL 2026 Points Standings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tournament ladder and Net Run Rates</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-400 font-heading uppercase text-[10px] tracking-wider border-b border-surface-border">
                    <tr>
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">Team</th>
                      <th className="px-6 py-3 text-center">Played</th>
                      <th className="px-6 py-3 text-center">Won</th>
                      <th className="px-6 py-3 text-center">Lost</th>
                      <th className="px-6 py-3 text-center">Points</th>
                      <th className="px-6 py-3 text-center">NRR</th>
                      <th className="px-6 py-3 text-center">Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pointsTable.map((t) => (
                      <tr key={t.rank} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-navy">#{t.rank}</td>
                        <td className="px-6 py-3.5 font-semibold text-navy">{t.team} ({t.short_name})</td>
                        <td className="px-6 py-3.5 text-center tabular-nums">{t.played}</td>
                        <td className="px-6 py-3.5 text-center tabular-nums font-bold text-forest">{t.won}</td>
                        <td className="px-6 py-3.5 text-center tabular-nums text-slate-500">{t.lost}</td>
                        <td className="px-6 py-3.5 text-center tabular-nums font-heading font-extrabold text-navy text-sm">{t.pts}</td>
                        <td className="px-6 py-3.5 text-center tabular-nums font-mono text-slate-600">{t.nrr}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="font-mono text-[11px] font-bold text-emerald-700">{t.form}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLAYER STATS CATALOG */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!isRookieOrAbove && (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-bold text-base text-navy">Essential Stats Locked</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Full player career scorecards and strike rate telemetries require a Rookie plan (₹499/mo) or higher.
                    </p>
                  </div>
                </div>
                <Link to="/player/plans" className="btn-primary text-xs px-5 py-2.5 font-bold shrink-0 self-start sm:self-auto">
                  View Plans
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {playersList.map((p) => (
                <div
                  key={p.id}
                  className="app-card p-6 border border-slate-200 shadow-sm hover:border-forest/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.team}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {p.role}
                      </span>
                    </div>

                    <h4 className="font-heading font-extrabold text-xl text-navy">{p.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{p.matches} matches played</p>

                    {/* Essential Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl mb-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Average</span>
                        <span className="font-bold text-navy text-sm tabular-nums">
                          {p.essential_stats_locked ? '🔒' : p.average || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          {p.runs ? 'Runs' : 'Wickets'}
                        </span>
                        <span className="font-bold text-forest text-sm tabular-nums">
                          {p.essential_stats_locked ? '🔒' : p.runs ?? p.wickets ?? '-'}
                        </span>
                      </div>
                    </div>

                    {/* Advanced Stats Section (Pro Striker+) */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-navy">Advanced Metrics</span>
                        {!isProStrikerOrAbove && (
                          <span className="text-[10px] font-bold text-amber-700 flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Pro Striker</span>
                          </span>
                        )}
                      </div>

                      {isProStrikerOrAbove && p.advanced_stats ? (
                        <div className="space-y-1.5 text-xs text-slate-600">
                          {p.advanced_stats.powerplay_strike_rate && (
                            <div className="flex justify-between">
                              <span>Powerplay SR:</span>
                              <span className="font-bold text-navy">{p.advanced_stats.powerplay_strike_rate}</span>
                            </div>
                          )}
                          {p.advanced_stats.death_overs_strike_rate && (
                            <div className="flex justify-between">
                              <span>Death Overs SR:</span>
                              <span className="font-bold text-forest">{p.advanced_stats.death_overs_strike_rate}</span>
                            </div>
                          )}
                          {p.advanced_stats.powerplay_economy && (
                            <div className="flex justify-between">
                              <span>Powerplay Econ:</span>
                              <span className="font-bold text-forest">{p.advanced_stats.powerplay_economy}</span>
                            </div>
                          )}
                          {p.advanced_stats.dot_ball_percentage && (
                            <div className="flex justify-between">
                              <span>Dot Ball %:</span>
                              <span className="font-bold text-navy">{p.advanced_stats.dot_ball_percentage}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/80 rounded-xl text-[11px] text-slate-500 text-center">
                          Unlock powerplay strike rates, dot ball percentages, and wagon wheels with Pro Striker.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <button
                      onClick={() => {
                        setActiveTab('compare');
                        handleTogglePlayerSelection(p.id);
                      }}
                      className="w-full btn-secondary text-xs py-2 font-bold flex items-center justify-center space-x-1"
                    >
                      <span>Compare in Radar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PLAYER COMPARISON TOOL */}
        {activeTab === 'compare' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with plan limits info */}
            <div className="app-card p-6 border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-bold text-2xl text-navy">Head-to-Head Comparison Matrix</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your active plan ({subData?.plan_name || 'Free'}) permits comparing up to{' '}
                    <strong className="text-forest">{allowedComparison} players</strong> simultaneously.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600">Selected:</span>
                  <span className="font-heading font-extrabold text-navy text-sm px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                    {selectedPlayers.length} / {allowedComparison || 8}
                  </span>
                  {!isEliteLegend && (
                    <Link
                      to="/player/plans"
                      className="btn-secondary text-xs px-3 py-1 font-bold flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>Upgrade Limit</span>
                    </Link>
                  )}
                </div>
              </div>

              {comparisonError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{comparisonError}</span>
                </div>
              )}

              {/* Player Selector Pills */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Select Players to Compare:
                </span>
                <div className="flex flex-wrap gap-2">
                  {playersList.map((p) => {
                    const isSelected = selectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleTogglePlayerSelection(p.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-forest text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{p.name}</span>
                        {isSelected ? (
                          <span className="text-gold font-extrabold">✓</span>
                        ) : (
                          <span className="text-slate-400">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comparison Side-by-Side Display */}
            {comparisonResult?.players?.length > 0 ? (
              <div className="app-card overflow-hidden p-0 border border-slate-200">
                <div className="p-6 border-b border-surface-border">
                  <h4 className="font-heading font-bold text-xl text-navy">Comparative Metrics Breakdown</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-heading uppercase text-[10px] tracking-wider border-b border-surface-border">
                      <tr>
                        <th className="px-6 py-3">Metric</th>
                        {comparisonResult.players.map((p) => (
                          <th key={p.id} className="px-6 py-3 font-bold text-navy text-xs">
                            {p.name}
                            <span className="block text-[10px] text-slate-400 font-normal uppercase">{p.role}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">Matches</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5 font-bold text-navy tabular-nums">
                            {p.matches}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">Batting / Bowling Avg</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5 font-bold text-forest tabular-nums">
                            {p.average || p.economy || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">Career Total</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5 font-extrabold text-navy tabular-nums">
                            {p.runs ? `${p.runs} runs` : `${p.wickets} wkts`}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">Strike Rate / Economy</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5 font-bold text-navy tabular-nums">
                            {p.strike_rate ? `${p.strike_rate} SR` : `${p.economy} Econ`}
                          </td>
                        ))}
                      </tr>
                      {/* Advanced Metrics row for Pro Striker & Elite Legend */}
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">Boundary / Yorker Execution</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5">
                            {isProStrikerOrAbove ? (
                              <span className="font-bold text-forest">
                                {p.essential_stats?.boundary_percentage || p.advanced_stats?.yorker_execution_rate || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">🔒 Requires Pro Striker</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[11px]">AI Performance Rating</td>
                        {comparisonResult.players.map((p) => (
                          <td key={p.id} className="px-6 py-3.5">
                            {isEliteLegend ? (
                              <span className="font-bold text-amber-600">
                                {p.elite_biomechanics?.head_stillness_rating || p.elite_biomechanics?.runup_rhythm_score || '95/100'}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">🔒 Requires Elite Legend</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="app-card py-16 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Select players above to view comparative analytics.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DETAILED MATCH ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!isProStrikerOrAbove ? (
              <div className="app-card p-10 text-center max-w-xl mx-auto border-2 border-forest/20 shadow-elevated">
                <div className="w-16 h-16 bg-forest/10 text-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-navy mb-2">
                  Pro Striker Feature Locked
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Deep ball-by-ball match analytics, phase breakdowns (Powerplay, Middle, Death), and wagon wheel distributions require the <strong>Pro Striker</strong> or <strong>Elite Legend</strong> plan.
                </p>
                <Link to="/player/plans" className="btn-primary text-sm font-bold px-8 py-3">
                  Upgrade to Pro Striker (₹899/mo)
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="app-card p-6 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-heading font-bold text-2xl text-navy">
                        RCB vs CSK — Deep Phase Analysis
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Match IPL 2026 #01 &bull; M. Chinnaswamy Stadium, Bengaluru
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                      ✓ Pro Striker Unlocked
                    </span>
                  </div>

                  {/* Phase Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Phase 1 (Overs 1-6)
                      </span>
                      <h5 className="font-heading font-extrabold text-xl text-navy mb-2">Powerplay Domination</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Runs / Wickets:</span>
                          <span className="font-bold text-navy">62 / 1 (RR: 10.33)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dot Ball %:</span>
                          <span className="font-bold text-forest">22.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Boundaries:</span>
                          <span className="font-bold text-navy">8 Fours, 3 Sixes</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Phase 2 (Overs 7-15)
                      </span>
                      <h5 className="font-heading font-extrabold text-xl text-navy mb-2">Middle Overs Squeeze</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Runs / Wickets:</span>
                          <span className="font-bold text-navy">78 / 2 (RR: 8.66)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dot Ball %:</span>
                          <span className="font-bold text-forest">35.4%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Boundaries:</span>
                          <span className="font-bold text-navy">5 Fours, 2 Sixes</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Phase 3 (Overs 16-20)
                      </span>
                      <h5 className="font-heading font-extrabold text-xl text-navy mb-2">Death Overs Surge</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Runs / Wickets:</span>
                          <span className="font-bold text-navy">54 / 1 (RR: 13.50)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dot Ball %:</span>
                          <span className="font-bold text-forest">16.6%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Boundaries:</span>
                          <span className="font-bold text-navy">4 Fours, 5 Sixes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AI PERFORMANCE SUMMARIES & BIOMECHANICS DASHBOARD */}
        {activeTab === 'ai_biomechanics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!isEliteLegend ? (
              <div className="app-card p-10 text-center max-w-xl mx-auto border-2 border-forest shadow-elevated">
                <div className="w-16 h-16 bg-gold/20 text-gold-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-navy mb-2">
                  Elite Legend Exclusive Feature
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  AI-assisted biomechanical performance summaries, head stillness indexes, and release velocities are exclusively available on the <strong>Elite Legend</strong> plan.
                </p>
                <Link to="/player/plans" className="btn-primary text-sm font-bold px-8 py-3">
                  Upgrade to Elite Legend (₹1,499/mo)
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selector */}
                <div className="app-card p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-heading font-bold text-xl text-navy">Select Athlete Telemetry</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Biomechanical tracking and AI summaries</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {playersList.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedAnalyticsPlayer(p.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedAnalyticsPlayer === p.id
                            ? 'bg-forest text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Biomechanics Breakdown */}
                {analyticsData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="app-card p-6 border border-slate-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <Sparkles className="w-5 h-5 text-gold" />
                        <h4 className="font-heading font-bold text-xl text-navy">AI-Assisted Technical Evaluation</h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        {analyticsData.biomechanics?.ai_performance_summary}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Engine: {analyticsData.ai_summary_engine}
                      </span>
                    </div>

                    <div className="app-card p-6 border border-slate-200">
                      <h4 className="font-heading font-bold text-xl text-navy mb-4">Biomechanical KPIs</h4>
                      <div className="space-y-3 text-xs">
                        {analyticsData.biomechanics &&
                          Object.entries(analyticsData.biomechanics)
                            .filter(([k]) => k !== 'ai_performance_summary')
                            .map(([key, val]) => (
                              <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-600 capitalize font-medium">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-bold text-forest text-sm">{val}</span>
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
};
