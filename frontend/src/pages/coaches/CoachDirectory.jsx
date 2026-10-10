import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Award,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Building2,
  Calendar,
  X,
  ChevronRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { CricketSeam } from '../../components/CricketSeam';
import { CardSkeleton } from '../../components/SkeletonLoader';

const SPECIALIZATIONS = [
  'All',
  'Batting',
  'Fielding',
  'Fast Bowling',
  'Spin Bowling',
  'Wicketkeeping',
  'All-Rounder Development',
  'High-Performance Training',
];

const CATEGORIES = [
  'All Categories',
  'Batters and Fielders',
  'Bowlers',
  'Wicketkeepers',
  'All-Rounders and High Performance',
];

export const CoachDirectory = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Modal State
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [startingChat, setStartingChat] = useState(false);

  const fetchCoaches = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDiscipline !== 'All') params.discipline = selectedDiscipline;
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedLocation !== 'All') params.location = selectedLocation;

      const data = await api.getCoachesDirectory(params);
      setCoaches(data.coaches || []);
    } catch (err) {
      console.error('Failed to fetch coaches directory:', err);
      setError('Failed to load coaches directory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, [selectedDiscipline, selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoaches();
  };

  const handleStartConsultation = async (coach) => {
    if (role !== 'player') {
      // If coach or admin, navigate to messages
      navigate(`/${role}/messages`);
      return;
    }

    setStartingChat(true);
    try {
      // Coach user_id or id
      const coachTargetId = coach.user_id || coach.id;
      const res = await api.startPlayerThread(coachTargetId);
      if (res && res.thread_id) {
        navigate('/player/messages');
      } else {
        navigate('/player/messages');
      }
    } catch (err) {
      console.error('Could not initiate chat:', err);
      navigate('/player/messages');
    } finally {
      setStartingChat(false);
    }
  };

  // Extract unique locations for the filter
  const locations = ['All', 'Secunderabad', 'East Marredpally', 'Masab Tank', 'Adarsa Nagar', 'Kondapur', 'Hyderabad'];

  return (
    <Shell
      title="Verified Coaches & Academy Directory"
      subtitle="Connect with premier international coaches, BCCI selectors, and elite high-performance academies."
      headerAction={
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>7 Verified Official Academy Mentors</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* TOP CONTROLS & SEARCH */}
        <div className="bg-white rounded-[16px] border border-surface-border p-5 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coaches by name, academy, or specialization (e.g. R. Sridhar, Spin, Fielding)..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'All' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest/90 transition-all shadow-xs"
              >
                Search
              </button>
            </div>
          </form>

          {/* Specialization Discipline Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Discipline:
            </span>
            {SPECIALIZATIONS.map((spec) => {
              const active = selectedDiscipline === spec;
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedDiscipline(spec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-gold text-forest-dark shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchCoaches}
              className="text-xs underline font-semibold hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && <CardSkeleton count={6} />}

        {/* EMPTY STATE */}
        {!loading && coaches.length === 0 && (
          <div className="bg-white rounded-[20px] border border-surface-border p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy mb-1">
              No Coaches Found
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              We could not find any coaches matching your filter criteria. Try resetting your search or selecting a different discipline.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDiscipline('All');
                setSelectedCategory('All Categories');
                setSelectedLocation('All');
              }}
              className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest/90 transition-all shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* COACHES GRID */}
        {!loading && coaches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map((coach) => {
              const isVerified = coach.is_verified || coach.verification_status === 'verified';
              const initial = coach.name ? coach.name.charAt(0).toUpperCase() : 'C';

              return (
                <div
                  key={coach.id || coach._id}
                  className="app-card card-hover flex flex-col justify-between overflow-hidden group"
                >
                  <CricketSeam orientation="horizontal" className="w-full text-gold/25" />
                  {/* Card Header & Profile */}
                  <div className="p-6 space-y-4">
                    {/* Top Row: Verification & Category */}
                    <div className="flex items-center justify-between">
                      {isVerified ? (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>VERIFIED MENTOR</span>
                        </div>
                      ) : coach.verification_status === 'unverified_affiliation' ? (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>AFFILIATION PENDING</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">
                          COACH
                        </div>
                      )}

                      {coach.rating_avg && (
                        <div className="flex items-center space-x-1 text-xs font-bold text-navy">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span>{coach.rating_avg.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">
                            ({coach.total_reviews || 12})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Coach Avatar + Name + Academy */}
                    <div className="flex items-start space-x-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/40 shadow-xs bg-forest flex items-center justify-center">
                          {coach.image_url ? (
                            <img
                              src={coach.image_url}
                              alt={coach.name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                            />
                          ) : null}
                          <div
                            style={{ display: coach.image_url ? 'none' : 'flex' }}
                            className="avatar-fallback w-full h-full bg-forest text-gold font-heading text-2xl font-bold items-center justify-center"
                          >
                            {initial}
                          </div>
                        </div>
                        {isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-gold text-forest-dark p-0.5 rounded-full shadow-xs ring-2 ring-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-lg font-bold text-navy truncate group-hover:text-forest transition-colors">
                          {coach.name}
                        </h3>
                        {coach.role_title && (
                          <p className="text-xs font-semibold text-gold-dark truncate">
                            {coach.role_title}
                          </p>
                        )}
                        {coach.academy_name && (
                          <div className="flex items-center text-xs text-slate-600 mt-1 truncate">
                            <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{coach.academy_name}</span>
                          </div>
                        )}
                        {coach.location && (
                          <div className="flex items-center text-xs text-slate-500 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            <span className="truncate">{coach.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {coach.bio || 'Experienced elite cricket mentor specializing in technical refinement and high performance.'}
                    </p>

                    {/* Specializations Tags */}
                    {coach.specializations && coach.specializations.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Key Expertise:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {coach.specializations.slice(0, 3).map((spec, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                          {coach.specializations.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-medium">
                              +{coach.specializations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCoach(coach)}
                      className="flex-1 py-2 px-3 bg-white border border-slate-200 text-navy hover:border-forest text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-1 shadow-2xs"
                    >
                      <span>View Profile & Academy</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleStartConsultation(coach)}
                      className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-forest hover:border-forest rounded-xl transition-all shadow-2xs"
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: DETAILED COACH PROFILE & ACADEMY VERIFICATION */}
        {selectedCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] border border-surface-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-forest to-forest-dark text-white relative">
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative">
                    {selectedCoach.image_url ? (
                      <img
                        src={selectedCoach.image_url}
                        alt={selectedCoach.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                        className="w-20 h-20 rounded-full object-cover border-3 border-gold shadow-md"
                      />
                    ) : null}
                    <div
                      style={{ display: selectedCoach.image_url ? 'none' : 'flex' }}
                      className="w-20 h-20 rounded-full bg-gold text-forest-dark font-heading text-3xl font-bold items-center justify-center border-3 border-white shadow-md"
                    >
                      {selectedCoach.name ? selectedCoach.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h2 className="font-heading text-2xl font-bold">
                        {selectedCoach.name}
                      </h2>
                      {selectedCoach.verification_status === 'verified' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gold text-forest-dark text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>VERIFIED MENTOR</span>
                        </span>
                      )}
                      {selectedCoach.verification_status === 'unverified_affiliation' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[11px] font-bold border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
                          <span>AFFILIATION PENDING</span>
                        </span>
                      )}
                    </div>
                    {selectedCoach.role_title && (
                      <p className="text-sm font-semibold text-gold mb-1">
                        {selectedCoach.role_title}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-200">
                      {selectedCoach.academy_name && (
                        <span className="flex items-center">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-gold" />
                          {selectedCoach.academy_name}
                        </span>
                      )}
                      {selectedCoach.location && (
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-gold" />
                          {selectedCoach.location}
                        </span>
                      )}
                      {selectedCoach.years_experience && (
                        <span className="flex items-center">
                          <Award className="w-3.5 h-3.5 mr-1 text-gold" />
                          {selectedCoach.years_experience}+ Years Exp.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <CricketSeam orientation="horizontal" className="w-full text-gold/30" />

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-navy">
                {/* Biography */}
                <div className="space-y-2">
                  <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-400">
                    Professional Biography
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedCoach.bio}
                  </p>
                </div>

                {/* Specializations */}
                {selectedCoach.specializations && selectedCoach.specializations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-400">
                      Coaching Specializations & Drills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoach.specializations.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-forest/5 text-forest border border-forest/20 rounded-lg text-xs font-semibold"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Achievements */}
                {selectedCoach.achievements && selectedCoach.achievements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-400">
                      Verified Highlights & Achievements
                    </h4>
                    <div className="space-y-2">
                      {selectedCoach.achievements.map((ach, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Academy & Contact Information Box */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Academy Affiliation & Verification</span>
                    </div>
                    {selectedCoach.last_verified_at && (
                      <span className="text-[10px] text-amber-700 font-medium">
                        Verified: {selectedCoach.last_verified_at}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-900/80">
                    <strong>{selectedCoach.academy_name}</strong> located at {selectedCoach.location}.
                    Profile details, credentials, and achievements verified through official academy records and authorized professional profiles.
                  </p>

                  {selectedCoach.verification_note && (
                    <div className="p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{selectedCoach.verification_note}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy"
                >
                  Close
                </button>
                <button
                  onClick={() => handleStartConsultation(selectedCoach)}
                  disabled={startingChat}
                  className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest/90 transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{startingChat ? 'Connecting...' : 'Consult / Message Coach'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
