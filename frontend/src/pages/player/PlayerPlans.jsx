import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { Check, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

export const PlayerPlans = () => {
  const [plans, setPlans] = useState([]);
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const [plansData, subResponse] = await Promise.all([
          api.getPlayerPlans(),
          api.getPlayerSubscription(),
        ]);
        setPlans(plansData || []);
        setSubData(subResponse?.subscription);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const currentPlanId = subData?.plan_id;

  return (
    <Shell
      title="Choose your plan"
      subtitle="Expert video feedback from certified coaches."
      headerAction={
        <Link
          to="/player/ebooks"
          className="btn-secondary text-xs sm:text-sm px-5 py-2.5 font-semibold flex items-center space-x-1.5"
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse E-books</span>
        </Link>
      }
    >
      <div className="max-w-4xl mx-auto my-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
            {plans.map((p) => {
              const isCurrent = currentPlanId === p.id && subData?.status === 'active';

              return (
                <div
                  key={p.id}
                  className={`app-card p-8 sm:p-10 relative flex flex-col justify-between transition-all duration-300 ${
                    isCurrent
                      ? 'border-2 border-forest shadow-elevated bg-white'
                      : 'border-2 border-forest/30 hover:border-forest shadow-elevated'
                  }`}
                >
                  <div>
                    {/* Orange ELITE pill */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-heading font-extrabold uppercase tracking-widest bg-gold text-navy-dark shadow-xs">
                        {p.name}
                      </span>
                      {isCurrent && (
                        <span className="text-xs font-bold text-forest bg-forest/10 px-3 py-1 rounded-full">
                          Active Plan
                        </span>
                      )}
                    </div>

                    {/* Price with /month */}
                    <div className="my-6">
                      <span className="font-heading font-extrabold text-5xl text-navy">
                        ₹{p.price}
                      </span>
                      <span className="text-slate-500 font-medium text-lg ml-1">
                        /{p.interval || 'month'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-6 font-medium">
                      Complete video technique analysis from BCCI & Ranji certified coaches.
                    </p>

                    {/* Feature list with green check icons */}
                    <ul className="space-y-3.5 pt-4 border-t border-slate-100 mb-8">
                      {(p.features || [
                        '3 video reviews per month',
                        'Detailed coach feedback within 48 hours',
                        'Direct messaging with coaches',
                        'Live sessions & open Q&A classes',
                      ]).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-3 text-sm text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="font-medium leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button: Subscribe or Current plan */}
                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full h-12 rounded-full bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <Link
                        to={`/player/checkout?type=plan&id=${p.id}`}
                        className="w-full btn-primary h-12 text-base font-bold shadow-md flex items-center justify-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Subscribe</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Guaranteed Coaching Quality Box */}
            <div className="p-8 rounded-card bg-slate-50 border border-slate-200 flex flex-col justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-2xl text-navy">
                Certified Coaching Standard
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every video submitted receives a rigorous 7-point biomechanical breakdown covering technical mistakes, strengths, front-foot stability, and match advice.
              </p>
              <div className="pt-2">
                <Link
                  to="/player/ebooks"
                  className="text-xs font-bold text-forest hover:underline"
                >
                  Looking for self-study guides? Explore our E-books catalog →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
