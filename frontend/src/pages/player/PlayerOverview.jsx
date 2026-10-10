import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  CreditCard,
  Video,
  CheckCircle2,
  Calendar,
  Star,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Megaphone,
  Award,
  Building2,
  ShieldCheck,
  Flame,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { PlayerProfileCard } from '../../components/PlayerProfileCard';
import { CricketSeam } from '../../components/CricketSeam';
import { CricketAnalyticsHub } from '../../components/CricketAnalyticsHub';
import { StatsSkeleton, ReviewRowSkeleton } from '../../components/SkeletonLoader';

export const PlayerOverview = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLocked, setAnnouncementsLocked] = useState(false);
  const [featuredCoaches, setFeaturedCoaches] = useState([]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [data, cDirectory, annData] = await Promise.all([
          api.getPlayerOverview().catch(() => null),
          api.getCoachesDirectory({ limit: 4 }).catch(() => ({ coaches: [] })),
          api.getPlayerAnnouncements().catch(() => ({ announcements: [], locked: true }))
        ]);
        setOverview(data);
        setFeaturedCoaches(cDirectory?.coaches?.slice(0, 3) || []);
        if (annData?.locked) {
          setAnnouncementsLocked(true);
        } else {
          setAnnouncements(annData?.announcements?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('Failed to load player overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  const playerName = user?.name ? user.name.split(' ')[0] : 'Rohan';
  const activePlan = overview?.active_plan || 'None';
  const reviewsRemaining = overview?.reviews_remaining ?? 0;
  const completedCount = overview?.completed_reviews ?? 1;
  const upcomingCount = overview?.upcoming_classes ?? 3;
  const hasPlan = overview?.has_active_plan;

  const statCards = [
    { label: 'ACTIVE PLAN', value: activePlan, isGreen: activePlan !== 'None', icon: ShieldCheck },
    { label: 'REVIEWS REMAINING', value: reviewsRemaining, isGreen: reviewsRemaining > 0, icon: Video },
    { label: 'COMPLETED REVIEWS', value: completedCount, isGreen: true, icon: CheckCircle2 },
    { label: 'UPCOMING CLASSES', value: upcomingCount, isGreen: true, icon: Calendar },
  ];

  const recentReviews = overview?.recent_reviews || [];
  const currentCoach = overview?.current_coach || {
    name: 'Rahul Sharma',
    specialty: 'Batting Coach',
    rating_avg: 4.9,
    photo_url: null,
  };

  const upcomingSessions = overview?.upcoming_sessions || [];

  if (loading) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="h-32 bg-slate-200/80 rounded-[28px] animate-pulse" />
          <StatsSkeleton count={4} />
          <ReviewRowSkeleton count={3} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Dark green hero banner with cricket seam accent */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#0F4A30] to-[#0B3D2B] p-8 sm:p-10 text-white mb-8 shadow-elevated relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-gold text-xs font-heading font-bold uppercase tracking-wider mb-3">
            <span>🏏 High-Performance Training Hub</span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight">
            Welcome back, {playerName}
          </h1>
          <p className="text-white/80 text-base mt-2 font-medium">
            Keep working on your game. Your next improvement starts today.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              to="/player/cricket"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-heading font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all"
            >
              <span>Explore Cricket Hub & Stats</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Featured Player Profile Card */}
      <div className="mb-8">
        <PlayerProfileCard user={user} overview={overview} />
      </div>

      {/* No active plan warning banner if applicable */}
      {!hasPlan && (
        <div className="mb-6 p-6 rounded-card bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-forest shrink-0" />
            <div>
              <h3 className="font-bold text-navy text-base">Unlock Certified Coach Video Reviews</h3>
              <p className="text-xs text-slate-600">
                Subscribe to the Elite plan to get comprehensive biomechanics evaluations and drills.
              </p>
            </div>
          </div>
          <Link to="/player/plans" className="btn-primary text-xs font-bold px-6 py-2.5 shrink-0">
            View Plans
          </Link>
        </div>
      )}

      {/* COACH ANNOUNCEMENTS SPOTLIGHT */}
      {announcements && announcements.length > 0 && (
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-forest/20 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-navy">
                  Coach Announcements
                </h3>
                <p className="text-[11px] text-slate-500">
                  Updates, camp notices, and guidance from your certified mentors.
                </p>
              </div>
            </div>
            <Link
              to="/player/announcements"
              className="text-xs font-bold text-forest hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition-all ${
                  !ann.read
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-forest text-gold text-xs font-bold flex items-center justify-center shrink-0">
                      {ann.coach_name ? ann.coach_name.charAt(0) : 'C'}
                    </div>
                    <span className="text-xs font-bold text-navy truncate">
                      Coach {ann.coach_name}
                    </span>
                  </div>
                  {!ann.read && (
                    <span className="px-2 py-0.5 rounded-full bg-gold text-navy-dark text-[10px] font-bold shrink-0">
                      New
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-sm text-navy line-clamp-1 mb-1">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {ann.message}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                  <span>{new Date(ann.published_at || ann.created_at).toLocaleDateString()}</span>
                  <Link
                    to="/player/announcements"
                    className="text-forest font-semibold hover:underline"
                  >
                    Read &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="app-card card-hover flex flex-col justify-between p-5 sm:p-6 group">
              <div className="flex items-center justify-between">
                <span className="stat-label">{card.label}</span>
                {Icon && (
                  <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <span className={`stat-number ${card.isGreen ? 'text-forest' : 'text-slate-400'}`}>
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cricket Performance & Plan-Gated Analytics Hub */}
      <CricketAnalyticsHub activePlan={activePlan} />

      {/* Row: Recent Reviews (wide) + Current Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Reviews Card (~2/3 width) */}
        <div className="app-card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-2xl text-navy">Recent Reviews</h2>
              <Link to="/player/reviews" className="text-xs font-bold text-forest hover:underline">
                View all
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No video reviews submitted yet. Submit a link to get coach feedback.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReviews.slice(0, 3).map((r) => {
                  const dateStr = r.completed_at || r.submitted_at;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-GB')
                    : '26/09/2026';

                  return (
                    <div key={r.id} className="py-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-navy text-base">
                          {r.review_type} Review
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formattedDate} · Coach {r.coach_name || 'Rahul Sharma'}
                        </p>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/player/submit"
              className="inline-flex items-center text-xs font-bold text-forest hover:text-forest-light group"
            >
              <span>Submit new video for review</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Current Coach Card (~1/3 width) */}
        <div className="app-card flex flex-col items-center justify-center text-center p-8">
          <span className="stat-label mb-4">CURRENT COACH</span>

          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-forest/20 shadow-md relative bg-forest flex items-center justify-center text-gold font-heading text-2xl font-bold">
            {currentCoach.photo_url ? (
              <img
                src={currentCoach.photo_url}
                alt={currentCoach.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <span style={{ display: currentCoach.photo_url ? 'none' : 'block' }}>
              {currentCoach.name ? currentCoach.name.charAt(0).toUpperCase() : 'C'}
            </span>
          </div>

          <h3 className="font-heading font-bold text-2xl text-navy">{currentCoach.name}</h3>
          <p className="text-xs font-semibold text-forest uppercase tracking-wider mt-0.5">
            {currentCoach.specialty}
          </p>

          <div className="flex items-center space-x-1 text-gold font-bold text-sm mt-2">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span>{currentCoach.rating_avg ? currentCoach.rating_avg.toFixed(1) : '4.9'}</span>
          </div>
        </div>
      </div>

      {/* Top Verified Coaches & Academies Spotlight */}
      {featuredCoaches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-extrabold text-2xl text-navy">
                Top Verified Mentors & Academies
              </h2>
              <p className="text-xs text-slate-500">
                Learn from former international coaches, national selectors, and elite academy directors.
              </p>
            </div>
            <Link
              to="/player/coaches"
              className="text-xs font-bold text-forest hover:underline flex items-center space-x-1"
            >
              <span>Explore all coaches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCoaches.map((c) => (
              <div
                key={c.id || c._id}
                className="app-card flex flex-col justify-between border border-surface-border hover:border-gold/40 hover:shadow-elevated transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold/30 shrink-0">
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: c.image_url ? 'none' : 'flex' }}
                          className="w-full h-full bg-forest text-gold font-bold text-base items-center justify-center"
                        >
                          {c.name ? c.name.charAt(0) : 'C'}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-lg text-navy leading-tight">
                          {c.name}
                        </h4>
                        <p className="text-[11px] font-semibold text-gold-dark truncate">
                          {c.role_title || c.specialty || 'Master Coach'}
                        </p>
                      </div>
                    </div>

                    <span className="p-1 rounded-full bg-emerald-50 text-emerald-700" title="Verified Coach">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {c.bio}
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center space-x-1 mb-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{c.academy_name}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    {c.years_experience ? `${c.years_experience}+ Yrs Exp` : 'BCCI / ICC'}
                  </span>
                  <Link
                    to="/player/coaches"
                    className="text-xs font-bold text-forest hover:text-forest-light flex items-center space-x-1"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions Section */}
      <div>
        <h2 className="font-heading font-extrabold text-3xl text-navy mb-5">
          Upcoming Sessions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingSessions.map((s, idx) => {
            const startsDate = new Date(s.starts_at);
            const formattedTime = `${startsDate.toLocaleDateString()}, ${startsDate.toLocaleTimeString()}`;

            return (
              <div
                key={s.id || idx}
                className="app-card flex flex-col justify-between border border-surface-border hover:shadow-elevated transition-shadow"
              >
                <div>
                  <h3 className="font-heading font-bold text-2xl text-navy leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs font-semibold text-forest mt-1">
                    Coach {s.coach_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-3 flex items-center font-mono">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {formattedTime}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href={s.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-accent py-2.5 text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Join</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};
