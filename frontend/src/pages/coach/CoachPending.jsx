import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { PlayCircle } from 'lucide-react';

export const CoachPending = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await api.getCoachReviews('pending');
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to load pending reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  return (
    <Shell
      title="Pending Reviews"
      subtitle="Player videos assigned to you awaiting technical evaluation and drill prescriptions."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="app-card py-20 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center text-forest mb-4">
            <PlayCircle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-navy">No pending reviews.</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            You're all caught up! New student video submissions assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const thumbUrl = r.youtube_id
              ? `https://img.youtube.com/vi/${r.youtube_id}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1531415074868-036b1c575351?auto=format&fit=crop&q=80&w=400';

            const submittedDate = r.submitted_at
              ? new Date(r.submitted_at).toLocaleDateString('en-GB')
              : 'Recently';

            return (
              <div
                key={r.id}
                className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 hover:shadow-elevated transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start space-x-4 flex-1">
                  {/* YouTube Thumbnail */}
                  <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-xs border border-surface-border">
                    <img
                      src={thumbUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-white/90 drop-shadow-md" />
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Green Category Pill */}
                    <div className="mb-2">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                        {r.review_type}
                      </span>
                    </div>

                    {/* Question (bold) */}
                    <h3 className="font-heading font-bold text-xl sm:text-2xl text-navy leading-snug">
                      "{r.question}"
                    </h3>

                    {/* Meta: Player name · Submitted DD/MM/YYYY */}
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      Player: <span className="text-navy font-semibold">{r.player_name || 'Student'}</span> · Submitted {submittedDate}
                    </p>
                  </div>
                </div>

                {/* Right: Status Pill + Review Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <StatusPill status={r.status} />

                  <Link
                    to={`/coach/review/${r.id}`}
                    className="btn-primary text-xs sm:text-sm px-6 py-2.5 font-semibold"
                  >
                    Review
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
};
