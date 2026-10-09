import React, { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { BookOpen } from 'lucide-react';

export const AdminEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEbooks = async () => {
      try {
        const data = await api.getAdminEbooks();
        setEbooks(data || []);
      } catch (err) {
        console.error('Failed to load ebooks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEbooks();
  }, []);

  return (
    <Shell
      title="Cricket E-books Catalog"
      subtitle="10 coaching guides, practice blueprints, and masterclass playbooks."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks.map((eb) => (
            <div
              key={eb.id}
              className="app-card flex flex-col justify-between p-0 overflow-hidden hover:shadow-elevated transition-shadow group"
            >
              {/* Cover Image cropped 16:9 */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={eb.cover_url}
                  alt={eb.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600';
                  }}
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Amber category pill */}
                  <div className="mb-2.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {eb.category}
                    </span>
                  </div>

                  {/* Bold title */}
                  <h3 className="font-heading font-bold text-2xl text-navy leading-snug">
                    {eb.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {eb.description}
                  </p>
                </div>

                {/* Green Price */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Store Price
                  </span>
                  <span className="font-heading font-extrabold text-2xl text-forest">
                    ₹{eb.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
};
