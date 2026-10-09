import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import {
  Megaphone,
  CheckCircle2,
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';

export const PlayerAnnouncements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPlayerAnnouncements();
      if (data.locked) {
        setLocked(true);
      } else {
        setLocked(false);
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      if (err?.response?.status === 403 || err?.response?.data?.locked) {
        setLocked(true);
      } else {
        setError('Unable to load coach announcements.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markAnnouncementAsRead(id);
      setAnnouncements(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      console.error('Failed to mark announcement as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAnnouncementsAsRead();
      setAnnouncements(prev => prev.map(item => ({ ...item, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const toggleExpand = (item) => {
    const isExpanding = expandedId !== item.id;
    setExpandedId(isExpanding ? item.id : null);
    if (isExpanding && !item.is_read) {
      handleMarkAsRead(item.id);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const unreadCount = announcements.filter(a => !a.is_read).length;
  const filtered = announcements.filter(a => {
    if (showUnreadOnly && a.is_read) return false;
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    return true;
  });

  return (
    <Shell>
      {/* Header Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#0F4A30] to-[#0B3D2B] p-8 sm:p-10 text-white mb-8 shadow-elevated relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-gold text-xs font-bold tracking-wider uppercase mb-3">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Academy Bulletins</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
              Coach Announcements
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 font-medium max-w-xl">
              Official training updates, match simulation schedules, technique drills, and important notifications from your certified coach.
            </p>
          </div>

          {!locked && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="self-start md:self-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shrink-0 border border-white/20"
            >
              <Check className="w-4 h-4 text-gold" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* LOCKED CONTENT STATE */}
      {locked ? (
        <div className="app-card border-2 border-gold/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-8 sm:p-12 text-center rounded-[28px] shadow-lg animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-gold/20 text-gold-dark font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            Subscriber Only Feature
          </span>
          <h2 className="font-heading font-extrabold text-3xl text-navy mb-3">
            This Feature Requires an Active Subscription
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Direct announcements, exclusive drill bulletins, personalized training schedules, and academy communication from BCCI & ECB accredited coaches are available for active Cricket Vault subscribers.
          </p>

          <div className="inline-flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 mb-8 text-xs text-slate-700 shadow-2xs">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span className="font-semibold">Plans start at just ₹499/month with complete video analysis access.</span>
          </div>

          <div>
            <button
              onClick={() => navigate('/player/plans')}
              className="px-6 py-3.5 bg-forest hover:bg-forest-light text-white text-sm font-bold rounded-xl transition-all shadow-md inline-flex items-center space-x-2 group"
            >
              <span>View Subscription Plans</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        <div className="app-card">
          {/* Controls: Unread Filter & Category */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !showUnreadOnly ? 'bg-forest text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({announcements.length})
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  showUnreadOnly ? 'bg-forest text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-gold text-navy text-[10px] rounded-full font-extrabold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-navy focus:outline-hidden focus:border-forest"
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Training Drills">Training Drills</option>
                <option value="Schedule Update">Schedule Update</option>
                <option value="Match Preparation">Match Preparation</option>
                <option value="Fitness & Recovery">Fitness & Recovery</option>
                <option value="Important Notice">Important Notice</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-forest" />
              <p className="text-sm">Fetching academy bulletins...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-xl text-navy">
                {showUnreadOnly ? 'No Unread Announcements' : 'No Announcements Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {showUnreadOnly
                  ? 'You are all caught up on all coach updates!'
                  : 'Your coach has not published any announcements for your category yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleExpand(item)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      !item.is_read
                        ? 'bg-amber-50/20 border-amber-300/80 shadow-2xs hover:border-amber-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Coach Avatar + Content */}
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        {item.coach_photo_url ? (
                          <img
                            src={item.coach_photo_url}
                            alt={item.coach_name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-forest/20 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-forest text-gold flex items-center justify-center font-heading font-bold text-base shrink-0 shadow-2xs">
                            {(item.coach_name || 'C')[0]}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-xs text-navy">
                              {item.coach_name || 'Certified Coach'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              <span>{item.category || 'General'}</span>
                            </span>

                            {!item.is_read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gold text-navy">
                                NEW
                              </span>
                            )}
                          </div>

                          <h3 className="font-heading font-bold text-lg text-navy tracking-tight mb-1">
                            {item.title}
                          </h3>

                          {/* Message snippet or expanded full message */}
                          <p className={`text-xs text-slate-700 leading-relaxed whitespace-pre-line ${
                            !isExpanded ? 'line-clamp-2' : ''
                          }`}>
                            {item.message}
                          </p>

                          <div className="flex items-center space-x-3 mt-3 text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(item.published_at || item.created_at)}</span>
                            </span>
                            <span>•</span>
                            <span className="text-forest font-semibold">
                              {isExpanded ? 'Click to collapse' : 'Click to read full message'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right action / expand toggle */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {!item.is_read ? (
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            title="Mark as read"
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span title="Read" className="p-2 text-slate-300">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                          </span>
                        )}
                        <div className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
};
