import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { calculatePlanPricing } from '../../utils/pricing';
import {
  Check,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const PlayerPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const [plansData, subResponse] = await Promise.all([
          api.getPlayerPlans(),
          api.getPlayerSubscription(),
        ]);
        // Filter out legacy plans if any, keep active 3 tiers
        const activeTiers = (plansData || []).filter((p) => p.active !== false);
        setPlans(activeTiers);
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
  const currentBillingPeriod = subData?.billing_period || 'monthly';
  const isSubActive = subData?.status === 'active';

  return (
    <Shell
      title="Choose Your Coaching Plan"
      subtitle="Comprehensive cricket statistics, video technique analysis, and personalized drills from certified coaches."
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
      <div className="max-w-6xl mx-auto my-6">
        {/* Billing Period Toggle */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="inline-flex items-center p-1.5 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-heading font-bold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-6 py-2 rounded-full text-xs sm:text-sm font-heading font-bold transition-all duration-200 flex items-center space-x-2 ${
                billingCycle === 'yearly'
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-slate-500 hover:text-forest'
              }`}
            >
              <span>Yearly Billing</span>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-extrabold ${
                  billingCycle === 'yearly'
                    ? 'bg-gold text-navy-dark'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Save 16.7%
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            {billingCycle === 'yearly' ? (
              <span className="font-medium text-emerald-700 flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Yearly plans are charged as one annual payment with 2 months free. Renews annually until cancelled.
                </span>
              </span>
            ) : (
              <span>Monthly subscriptions renew automatically every 30 days. Cancel anytime with no commitments.</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch justify-center">
            {plans.map((p) => {
              const pricing = calculatePlanPricing(p, billingCycle);
              const isCurrent =
                isSubActive &&
                currentPlanId === p.id &&
                currentBillingPeriod === billingCycle;
              const isCurrentPlanDifferentCycle =
                isSubActive && currentPlanId === p.id && currentBillingPeriod !== billingCycle;

              return (
                <div
                  key={p.id}
                  className={`app-card card-hover p-6 sm:p-8 relative flex flex-col justify-between overflow-hidden transition-all ${
                    p.popular
                      ? 'border-2 border-forest ring-2 ring-forest/15 shadow-elevated bg-white'
                      : isCurrent
                      ? 'border-2 border-emerald-500 shadow-md bg-white'
                      : 'border border-slate-200 hover:border-forest/50 shadow-sm'
                  }`}
                >
                  {/* Decorative Seam accent on top border */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      p.popular
                        ? 'bg-gradient-to-r from-forest via-gold to-forest'
                        : 'bg-gradient-to-r from-forest/40 to-forest/80'
                    }`}
                  />

                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-widest ${
                          p.popular
                            ? 'bg-gold text-navy-dark shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        🏏 {p.name}
                      </span>

                      {isCurrent ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded-full border border-forest/20">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Active Plan</span>
                        </span>
                      ) : p.badge && !isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                          {p.badge}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-500 min-h-[36px] font-medium leading-relaxed mb-4">
                      {p.description ||
                        'Complete video technique analysis and personalized drills from certified coaches.'}
                    </p>

                    {/* Price Section */}
                    <div className="my-5 pb-5 border-b border-slate-100">
                      {billingCycle === 'yearly' ? (
                        <div>
                          {/* Strikethrough regular annual price */}
                          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium mb-1">
                            <span>Regular:</span>
                            <span className="line-through decoration-slate-400 font-semibold">
                              ₹{pricing.formattedRegularAnnual}
                            </span>
                            <span className="text-forest font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              Save ₹{pricing.formattedSavings} (16.7% off)
                            </span>
                          </div>

                          {/* Discounted Annual Price */}
                          <div className="flex items-baseline space-x-1">
                            <span className="font-heading font-extrabold text-4xl sm:text-5xl text-navy tracking-tight tabular-nums">
                              ₹{pricing.formattedYearly}
                            </span>
                            <span className="text-slate-500 font-semibold text-base">/year</span>
                          </div>

                          {/* Monthly Equivalent */}
                          <div className="text-xs text-slate-500 mt-1 font-medium">
                            Equivalent to{' '}
                            <span className="font-bold text-forest">
                              ₹{pricing.formattedMonthlyEquivalent}
                            </span>
                            /month, billed annually
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline space-x-1">
                            <span className="font-heading font-extrabold text-4xl sm:text-5xl text-navy tracking-tight tabular-nums">
                              ₹{pricing.formattedMonthly}
                            </span>
                            <span className="text-slate-500 font-semibold text-base">/month</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Billed monthly</div>
                        </div>
                      )}
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-3 mb-8">
                      {(p.features || []).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <span className="font-medium leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full h-12 rounded-full bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed border border-slate-200"
                      >
                        ✓ Current Active Plan
                      </button>
                    ) : (
                      <Link
                        to={`/player/checkout?type=plan&id=${p.id}&billing=${billingCycle}`}
                        className={`w-full h-12 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center space-x-2 rounded-full transition-all ${
                          p.popular
                            ? 'btn-primary text-white hover:brightness-110 active:scale-[0.99]'
                            : 'bg-navy text-white hover:bg-navy-dark active:scale-[0.99]'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>
                          {isCurrentPlanDifferentCycle
                            ? `Switch to ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`
                            : isSubActive
                            ? `Upgrade to ${p.name}`
                            : 'Subscribe Now'}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guaranteed Quality & Policy Callout */}
        <div className="mt-12 p-8 rounded-card bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-base text-navy">Certified Master Coaches</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Evaluations delivered by BCCI and state-certified mentors with Ranji and international backgrounds.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold-dark flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-base text-navy">Instant Digital Activation</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Video review allowances and advanced statistics unlock immediately upon cryptographic payment verification.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-base text-navy">Transparent Billing</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Yearly billing is billed as one single annual payment with a 16.7% discount. Cancel anytime without fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};
