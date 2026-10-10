import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, User, Award, CheckCircle2, ChevronRight, Edit3 } from 'lucide-react';
import { CricketSeam } from './CricketSeam';

export const PlayerProfileCard = ({ user, overview, showEdit = true, className = '' }) => {
  const p = user || {};
  const currentPhoto = p.photo_url;
  const initial = p.name ? p.name.charAt(0).toUpperCase() : 'P';

  // Calculate profile completion percentage based on real fields
  const fields = [
    p.name,
    p.email,
    p.mobile,
    p.location || p.city,
    p.playing_role,
    p.experience,
    p.batting_style,
    p.bowling_style,
    p.photo_url,
  ];
  const filled = fields.filter((f) => Boolean(f)).length;
  const completionPercentage = Math.round((filled / fields.length) * 100);

  const activePlan = overview?.active_plan || 'None';
  const assignedCoach = overview?.current_coach?.name || 'Rahul Sharma';

  return (
    <div className={`app-card card-hover relative overflow-hidden p-6 sm:p-7 ${className}`}>
      {/* Top Cricket Seam accent */}
      <div className="absolute top-0 left-0 right-0">
        <CricketSeam height={4} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 pb-5 border-b border-surface-border">
        {/* Avatar + Name */}
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-forest text-gold font-heading font-bold text-2xl flex items-center justify-center shadow-xs border-2 border-forest/20 shrink-0">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={p.name || 'Player'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <span style={{ display: currentPhoto ? 'none' : 'block' }}>{initial}</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-extrabold text-2xl text-navy leading-tight">
                {p.name || 'Cricket Athlete'}
              </h3>
              <ShieldCheck className="w-4 h-4 text-forest shrink-0" title="Verified Profile" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {p.location || p.city || 'India'} • {p.experience || 'Beginner'}
            </p>
          </div>
        </div>

        {/* Role Pill & Optional Edit button */}
        <div className="flex items-center space-x-2.5 self-end sm:self-center">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider bg-gold text-navy-dark shadow-2xs">
            {p.playing_role || 'Batter'}
          </span>
          {showEdit && (
            <Link
              to="/player/profile"
              className="p-2 rounded-xl text-slate-500 hover:text-forest hover:bg-forest/10 transition-colors"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Cricket Scorecard Attribute Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 py-5 border-b border-surface-border text-center sm:text-left">
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Batting Style
          </span>
          <span className="text-xs font-bold text-navy truncate block">
            {p.batting_style || 'Right-Handed'}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Bowling Style
          </span>
          <span className="text-xs font-bold text-navy truncate block">
            {p.bowling_style || 'None'}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Active Package
          </span>
          <span className="text-xs font-bold text-forest truncate block">
            {activePlan !== 'None' ? activePlan : 'Unsubscribed'}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Assigned Coach
          </span>
          <span className="text-xs font-bold text-navy truncate block">
            {assignedCoach}
          </span>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="pt-4 flex items-center justify-between text-xs">
        <div className="flex-1 mr-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
            <span>Profile Readiness</span>
            <span className="font-heading font-bold text-forest">{completionPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {completionPercentage < 100 && (
          <Link
            to="/player/profile"
            className="text-[11px] font-bold text-forest hover:underline shrink-0 flex items-center space-x-0.5"
          >
            <span>Complete</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
