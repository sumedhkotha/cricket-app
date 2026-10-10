import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  BarChart3,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  Activity,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  Zap
} from 'lucide-react';

export const CricketAnalyticsHub = ({ activePlan }) => {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'comparison' | 'biomechanics'
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(['ply_vk18', 'ply_jb93']);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  const [biomechanicsData, setBiomechanicsData] = useState(null);
  const [bioPlayerId, setBioPlayerId] = useState('ply_vk18');
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getCricketStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load cricket stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async (idsToCompare) => {
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const data = await api.compareCricketPlayers(idsToCompare.join(','));
      setComparisonData(data);
    } catch (err) {
      setComparisonError(err.message || 'Comparison failed for current plan tier.');
      setComparisonData(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleTogglePlayerSelection = (playerId) => {
    let next;
    if (selectedPlayerIds.includes(playerId)) {
      if (selectedPlayerIds.length <= 1) return; // Keep at least one
      next = selectedPlayerIds.filter((id) => id !== playerId);
    } else {
      next = [...selectedPlayerIds, playerId];
    }
    setSelectedPlayerIds(next);
    handleRunComparison(next);
  };

  const loadBiomechanics = async (playerId) => {
    setBioLoading(true);
    setBioError(null);
    try {
      const data = await api.getEliteAnalytics(playerId);
      setBiomechanicsData(data);
    } catch (err) {
      setBioError(err.message || 'Elite Legend subscription required.');
      setBiomechanicsData(null);
    } finally {
      setBioLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comparison') {
      handleRunComparison(selectedPlayerIds);
    } else if (activeTab === 'biomechanics') {
      loadBiomechanics(bioPlayerId);
    }
  }, [activeTab]);

  const userTier = statsData?.user_tier || 'free';
  const isFree = userTier === 'free';
  const isRookie = userTier === 'rookie';
  const isPro = userTier === 'pro_striker';
  const isElite = userTier === 'elite_legend';

  const tierBadgeLabels = {
    free: { label: 'Free Tier (Preview)', color: 'bg-slate-100 text-slate-600 border-slate-300' },
    rookie: { label: 'Rookie Tier (Essential Stats)', color: 'bg-emerald-50 text-forest border-emerald-300' },
    pro_striker: { label: 'Pro Striker (Advanced Analysis)', color: 'bg-blue-50 text-blue-700 border-blue-300' },
    elite_legend: { label: 'Elite Legend (AI & Radar)', color: 'bg-amber-50 text-amber-800 border-amber-300' }
  };

  const badge = tierBadgeLabels[userTier] || tierBadgeLabels.free;

  return (
    <div className="app-card border border-surface-border p-6 sm:p-7 mb-8 overflow-hidden relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy">
              Cricket Performance & Analytics Hub
            </h2>
            <span className={`text-[11px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cricket metrics, comparative benchmarking, and AI summaries gated strictly by your subscription tier.
          </p>
        </div>

        {/* Action button */}
        {!isElite && (
          <Link
            to="/player/plans"
            className="btn-accent text-xs font-bold px-4 py-2 shrink-0 flex items-center space-x-1.5 self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </Link>
        )}
      </div>

      {/* Feature Tabs */}
      <div className="flex items-center space-x-2 my-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
            activeTab === 'stats'
              ? 'bg-forest text-gold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Player Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
            activeTab === 'comparison'
              ? 'bg-forest text-gold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Player Comparison</span>
          {isFree && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
        </button>

        <button
          onClick={() => setActiveTab('biomechanics')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
            activeTab === 'biomechanics'
              ? 'bg-forest text-gold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>AI Biomechanics Radar</span>
          {!isElite && <Lock className="w-3 h-3 text-amber-500 ml-1" />}
        </button>
      </div>

      {/* TAB 1: PLAYER STATISTICS */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {isFree && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Essential stats preview only (Free Tier)</p>
                <p className="text-amber-700 mt-0.5">
                  Detailed match averages, strike rates, and recent form are locked. Subscribe to the{' '}
                  <strong>Rookie Plan (₹499/mo)</strong> to unlock full essential cricket statistics.
                </p>
              </div>
            </div>
          )}

          {isRookie && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-forest">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>
                  <strong>Rookie Plan Active:</strong> Essential cricket statistics and player profiles unlocked.
                </span>
              </div>
              <Link to="/player/plans" className="font-bold hover:underline shrink-0">
                Unlock Over Phase Breakdowns in Pro Striker &rarr;
              </Link>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading verified cricket data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statsData?.players?.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-forest/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-heading font-bold text-lg text-navy">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {p.team} • {p.role}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.matches} Matches
                    </span>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-4 gap-2 my-3 py-2 bg-slate-50/80 rounded-lg text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-heading">Runs / Wkts</span>
                      <span className="text-xs font-bold text-navy">
                        {p.runs !== undefined ? p.runs : p.wickets !== undefined ? `${p.wickets} w` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-heading">Average</span>
                      <span className="text-xs font-bold text-navy">{p.average || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-heading">Strike Rate</span>
                      <span className="text-xs font-bold text-navy">{p.strike_rate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-heading">Economy</span>
                      <span className="text-xs font-bold text-navy">{p.economy || '—'}</span>
                    </div>
                  </div>

                  {/* Essential Stats Block (Unlocked for Rookie, Pro, Elite) */}
                  {p.essential_stats ? (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      {p.essential_stats.recent_form && (
                        <span>
                          <strong className="text-navy">Form:</strong>{' '}
                          {Array.isArray(p.essential_stats.recent_form)
                            ? p.essential_stats.recent_form.join(', ')
                            : p.essential_stats.recent_form}
                        </span>
                      )}
                      {p.essential_stats.boundary_count && (
                        <span>
                          <strong className="text-navy">Boundaries:</strong> {p.essential_stats.boundary_count}
                        </span>
                      )}
                      {p.essential_stats.best_bowling && (
                        <span>
                          <strong className="text-navy">Best:</strong> {p.essential_stats.best_bowling}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Essential breakdown locked on Free tier</span>
                    </div>
                  )}

                  {/* Advanced Stats Block (Unlocked for Pro Striker & Elite Legend) */}
                  {p.advanced_stats ? (
                    <div className="mt-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
                      <div className="font-bold flex items-center space-x-1 mb-1 text-blue-800">
                        <TrendingUp className="w-3 h-3" />
                        <span>Phase Breakdown (Pro Striker Feature)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                        <div>PP: {p.advanced_stats.powerplay_strike_rate || p.advanced_stats.powerplay_economy || '—'}</div>
                        <div>Mid: {p.advanced_stats.middle_overs_strike_rate || p.advanced_stats.middle_overs_economy || '—'}</div>
                        <div>Death: {p.advanced_stats.death_overs_strike_rate || p.advanced_stats.death_overs_economy || '—'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Phase Analysis (Powerplay / Death overs) locked</span>
                      </span>
                      <Link to="/player/plans" className="text-forest font-bold hover:underline">
                        Pro Striker &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYER COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="font-heading font-bold text-base text-navy">Compare Cricket Athletes</h4>
                <p className="text-xs text-slate-500">
                  Select players to compare head-to-head. Your tier limit determines maximum athletes:
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                <span className={`px-2.5 py-1 rounded-full ${
                  isFree ? 'bg-red-100 text-red-700' :
                  isRookie ? 'bg-emerald-100 text-emerald-800' :
                  isPro ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Quota: {isFree ? '0 (Locked)' : isRookie ? 'Max 2' : isPro ? 'Max 4' : 'Up to 8'}
                </span>
              </div>
            </div>

            {/* Player Selector Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              {[
                { id: 'ply_vk18', name: 'Virat Kohli' },
                { id: 'ply_jb93', name: 'Jasprit Bumrah' },
                { id: 'ply_hk45', name: 'Heinrich Klaasen' },
                { id: 'ply_rk19', name: 'Rashid Khan' }
              ].map((p) => {
                const isSelected = selectedPlayerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayerSelection(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-forest text-gold border border-forest shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{p.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-gold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {comparisonError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Plan Limit Restriction</p>
                <p className="mt-0.5 text-red-700">{comparisonError}</p>
                <Link to="/player/plans" className="mt-2 inline-block font-bold text-forest hover:underline">
                  Upgrade your plan to unlock more comparisons &rarr;
                </Link>
              </div>
            </div>
          )}

          {comparisonLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Comparing athlete metrics...</div>
          ) : comparisonData?.players ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {comparisonData.players.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h5 className="font-heading font-bold text-base text-navy">{p.name}</h5>
                  <p className="text-[11px] text-slate-500 mb-3">{p.role}</p>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-sans">Matches:</span>
                      <span className="font-bold text-navy">{p.matches}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-sans">Average:</span>
                      <span className="font-bold text-navy">{p.average}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-sans">Strike Rate:</span>
                      <span className="font-bold text-navy">{p.strike_rate || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 font-sans">Economy:</span>
                      <span className="font-bold text-navy">{p.economy || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: AI BIOMECHANICS RADAR */}
      {activeTab === 'biomechanics' && (
        <div className="space-y-4">
          {!isElite ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-gold/40 text-navy relative overflow-hidden">
              <div className="flex items-start space-x-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-forest text-gold flex items-center justify-center shrink-0 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gold/20 text-navy-dark text-[10px] font-heading font-extrabold uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3 h-3 text-gold-dark mr-1" />
                    <span>Elite Legend Exclusive</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-navy">
                    AI Biomechanics Radar & Deep Performance Summaries
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Unlock computerized movement analysis, hip-shoulder separation tracking, release point kinematics, and automated AI technical evaluations powered by our advanced coaching model.
                  </p>
                  <div className="mt-4 flex items-center space-x-3">
                    <Link
                      to="/player/plans"
                      className="btn-primary text-xs font-bold px-5 py-2.5 flex items-center space-x-2"
                    >
                      <span>Upgrade to Elite Legend (₹1,499/mo)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Athlete selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500">Athlete:</span>
                {[
                  { id: 'ply_vk18', name: 'Virat Kohli' },
                  { id: 'ply_jb93', name: 'Jasprit Bumrah' },
                  { id: 'ply_hk45', name: 'Heinrich Klaasen' },
                  { id: 'ply_rk19', name: 'Rashid Khan' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setBioPlayerId(p.id);
                      loadBiomechanics(p.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      bioPlayerId === p.id
                        ? 'bg-forest text-gold font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {bioLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading AI biomechanics telemetry...</div>
              ) : biomechanicsData ? (
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-gold-dark" />
                      <h4 className="font-heading font-extrabold text-xl text-navy">
                        {biomechanicsData.player_name} — Biomechanical Radar
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-forest text-gold">
                      {biomechanicsData.ai_summary_engine}
                    </span>
                  </div>

                  {/* AI Summary Box */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs leading-relaxed text-slate-700">
                    <span className="font-heading font-bold uppercase text-[10px] text-forest block mb-1">
                      Generative Technical Summary
                    </span>
                    <p className="font-medium italic">
                      "{biomechanicsData.biomechanics?.ai_performance_summary}"
                    </p>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(biomechanicsData.biomechanics || {})
                      .filter(([k]) => k !== 'ai_performance_summary')
                      .map(([key, val]) => (
                        <div key={key} className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-heading font-bold text-slate-400 block mb-0.5">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-navy font-mono">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
