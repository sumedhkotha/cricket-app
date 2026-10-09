import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { Star, MapPin } from 'lucide-react';

export const AdminCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoaches = async () => {
      try {
        const data = await api.getAdminCoaches();
        setCoaches(data || []);
      } catch (err) {
        console.error('Failed to load coaches:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCoaches();
  }, []);

  return (
    <Shell
      title="Certified Coaches"
      subtitle="5 certified cricket coaches on the platform providing technical evaluations."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((c) => (
            <div
              key={c.id || c.user_id}
              className="app-card flex flex-col items-center text-center p-8 hover:shadow-elevated transition-shadow"
            >
              {/* Round Photo / Neutral Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-forest/20 shadow-md relative bg-forest flex items-center justify-center text-gold font-heading text-2xl font-bold">
                {c.photo_url || c.image_url ? (
                  <img
                    src={c.photo_url || c.image_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span style={{ display: (c.photo_url || c.image_url) ? 'none' : 'block' }}>
                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                </span>
              </div>

              {/* Name */}
              <h3 className="font-heading font-bold text-2xl text-navy">{c.name}</h3>

              {/* Green Specialty Pill */}
              <div className="my-2.5">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                  {c.specialty}
                </span>
              </div>

              {/* Star Rating & Experience */}
              <div className="flex items-center space-x-2 text-sm font-semibold text-navy mt-1">
                <span className="flex items-center text-gold">
                  <Star className="w-4 h-4 fill-gold text-gold mr-1" />
                  {c.rating_avg ? c.rating_avg.toFixed(1) : '4.9'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600">{c.years_experience}y experience</span>
              </div>

              {/* Bio & City */}
              {c.city && (
                <div className="flex items-center text-xs text-slate-400 mt-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{c.city}</span>
                </div>
              )}

              {c.bio && (
                <p className="text-xs text-slate-600 mt-4 leading-relaxed line-clamp-3">
                  {c.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
};
