import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { ArrowRight, CheckCircle2, UserCheck, Video } from 'lucide-react';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      const [reviewsData, coachesData] = await Promise.all([
        api.getAdminReviews(),
        api.getAdminCoaches(),
      ]);
      setReviews(reviewsData || []);
      setCoaches(coachesData || []);
    } catch (err) {
      console.error('Failed to load reviews data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignCoach = async (reviewId, coachId) => {
    if (!coachId) return;
    setAssigningId(reviewId);
    try {
      const res = await api.assignCoach(reviewId, coachId);
      setSuccessMessage(res.message || 'Coach assigned successfully');
      setTimeout(() => setSuccessMessage(''), 4000);
      
      // Update locally
      const selectedCoach = coaches.find((c) => (c.user_id || c.id) === coachId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                coach_id: coachId,
                coach_name: selectedCoach ? selectedCoach.name : res.coach_name,
                status: 'assigned',
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to assign coach:', err);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Shell
      title="Video Reviews"
      subtitle="Manage incoming player video submissions and assign certified coaches."
    >
      {successMessage && (
        <div className="mb-6 p-4 rounded-input bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="app-card py-16 text-center text-slate-400">
          No video reviews currently in the system.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const isSubmitted = r.status === 'submitted' || !r.coach_id;
            return (
              <div
                key={r.id}
                className="app-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 hover:shadow-soft transition-all"
              >
                {/* Left: Player name + Review type (grey) */}
                <div className="md:w-1/4 shrink-0">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-forest shrink-0" />
                    <span className="font-heading font-bold text-xl text-navy">
                      {r.player_name || 'Player'}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-1">
                    {r.review_type} Review
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleDateString('en-GB')
                      : 'Recently'}
                  </div>
                </div>

                {/* Middle: Player's question */}
                <div className="md:w-1/2 flex-1">
                  <p className="text-sm font-semibold text-navy leading-snug">
                    "{r.question}"
                  </p>
                  {r.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                      Note: {r.notes}
                    </p>
                  )}
                </div>

                {/* Right: Status Pill + Coach name or Assign select */}
                <div className="md:w-1/4 flex flex-col items-start md:items-end justify-center shrink-0 space-y-2">
                  <StatusPill status={r.status} />

                  {isSubmitted ? (
                    <div className="w-full sm:w-auto">
                      <select
                        defaultValue=""
                        disabled={assigningId === r.id}
                        onChange={(e) => handleAssignCoach(r.id, e.target.value)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-forest bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                      >
                        <option value="" disabled>
                          {assigningId === r.id ? 'Assigning...' : 'Assign Coach...'}
                        </option>
                        {coaches.map((c) => (
                          <option key={c.user_id || c.id} value={c.user_id || c.id}>
                            {c.name} ({c.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs font-semibold text-slate-600">
                      <ArrowRight className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>{r.coach_name || 'Assigned Coach'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
};
