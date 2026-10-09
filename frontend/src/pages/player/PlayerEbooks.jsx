import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { BookOpen, Check, X, ShoppingCart } from 'lucide-react';

export const PlayerEbooks = () => {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalEbook, setActiveModalEbook] = useState(null);

  useEffect(() => {
    const loadEbooks = async () => {
      try {
        const data = await api.getPlayerEbooks();
        setEbooks(data || []);
      } catch (err) {
        console.error('Failed to load ebooks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEbooks();
  }, []);

  const categories = [
    'All',
    'Batting',
    'Bowling',
    'Fitness',
    'Mental Game',
    'Practice Plans',
    'Beginner Guides',
    'Career Guidance',
    'Wicketkeeping',
  ];

  const filteredEbooks =
    selectedCategory === 'All'
      ? ebooks
      : ebooks.filter((eb) => eb.category === selectedCategory);

  const handleBuy = (eb) => {
    navigate(`/player/checkout?type=ebook&id=${eb.id}`);
  };

  return (
    <Shell
      title="E-books"
      subtitle="Master specific skillsets with digital guides written by elite cricket coaches."
    >
      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-surface-border hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : filteredEbooks.length === 0 ? (
        <div className="app-card py-16 text-center text-slate-400">
          No e-books found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEbooks.map((eb) => {
            const isOwned = eb.is_owned;

            return (
              <div
                key={eb.id}
                className="app-card flex flex-col justify-between p-0 overflow-hidden hover:shadow-elevated transition-all group"
              >
                {/* Clickable Card Body -> Opens Detail Modal */}
                <div
                  onClick={() => setActiveModalEbook(eb)}
                  className="cursor-pointer"
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

                  <div className="p-6 pb-2">
                    {/* Amber Category Pill */}
                    <div className="mb-2.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        {eb.category}
                      </span>
                    </div>

                    {/* Bold Title */}
                    <h3 className="font-heading font-bold text-2xl text-navy leading-snug">
                      {eb.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {eb.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Green Price + Buy or Owned Button */}
                <div className="p-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-heading font-extrabold text-2xl text-forest">
                    ₹{eb.price}
                  </span>

                  {isOwned ? (
                    <span className="inline-flex items-center px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-400 cursor-not-allowed">
                      <Check className="w-3.5 h-3.5 mr-1" /> Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(eb)}
                      className="btn-primary text-xs px-6 py-2 font-bold shadow-xs"
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeModalEbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-border relative">
            <button
              onClick={() => setActiveModalEbook(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Cover */}
            <div className="relative aspect-video w-full rounded-card overflow-hidden bg-black mb-6 shadow-md">
              <img
                src={activeModalEbook.cover_url}
                alt={activeModalEbook.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Amber Category Pill */}
            <div className="mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                {activeModalEbook.category}
              </span>
            </div>

            <h2 className="font-heading font-extrabold text-3xl text-navy mb-3">
              {activeModalEbook.title}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {activeModalEbook.description}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Price
                </span>
                <span className="font-heading font-extrabold text-3xl text-forest">
                  ₹{activeModalEbook.price}
                </span>
              </div>

              {activeModalEbook.is_owned ? (
                <span className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold uppercase">
                  Owned in Library
                </span>
              ) : (
                <button
                  onClick={() => {
                    const eb = activeModalEbook;
                    setActiveModalEbook(null);
                    handleBuy(eb);
                  }}
                  className="btn-primary text-sm px-8 py-3 font-bold shadow-md"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};
