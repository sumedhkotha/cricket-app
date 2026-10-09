import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { Star, MessageSquare } from 'lucide-react';

export const CoachRatings = () => {
  const [ratingsData, setRatingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const data = await api.getCoachRatings();
        setRatingsData(data);
      } catch (err) {
        console.error('Failed to load ratings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRatings();
  }, []);

  const avg = ratingsData?.rating_avg;
  const count = ratingsData?.rating_count ?? 0;
  const logs = ratingsData?.ratings_log ?? [];

  return (
    <Shell
      title="Student Ratings & Reviews"
      subtitle="Feedback and performance ratings submitted by players after completed reviews."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Average Rating Card */}
        <div className="app-card flex flex-col justify-between">
          <span className="stat-label">AVERAGE</span>

          <div className="my-4">
            {avg ? (
              <div className="flex items-baseline space-x-2">
                <span className="stat-number text-gold">{avg.toFixed(1)}</span>
                <Star className="w-8 h-8 fill-gold text-gold" />
              </div>
            ) : (
              <span className="stat-number text-gold">—</span>
            )}
            <p className="text-xs text-slate-500 mt-2 font-medium">
              from {count} student review{count === 1 ? '' : 's'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avg || 0)
                    ? 'fill-gold text-gold'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Rating Breakdown / Highlights Card */}
        <div className="app-card lg:col-span-2">
          <h2 className="font-heading font-bold text-2xl text-navy mb-4">
            Recent Feedback & Testimonials
          </h2>

          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No individual student ratings submitted yet.
              </div>
            ) : (
              logs.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-gold">
                        {[...Array(item.stars || 5)].map((_, s) => (
                          <Star key={s} className="w-4 h-4 fill-gold text-gold" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-navy">
                        {item.player_first_name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {item.date ? new Date(item.date).toLocaleDateString('en-GB') : 'Recently'}
                    </span>
                  </div>

                  {item.comment && (
                    <p className="text-xs text-slate-600 italic">
                      "{item.comment}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
};
