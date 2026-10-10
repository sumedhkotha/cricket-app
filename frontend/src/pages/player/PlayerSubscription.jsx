import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { api } from '../../api';
import { formatCurrency, calculatePlanPricing } from '../../utils/pricing';
import {
  CreditCard,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const PlayerSubscription = () => {
  const navigate = useNavigate();
  const [subData, setSubData] = useState(null);
  const [history, setHistory] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlanForQuote, setSelectedPlanForQuote] = useState(null);
  const [changeCycle, setChangeCycle] = useState('yearly');
  const [quoteData, setQuoteData] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await api.getPlayerSubscription();
      setSubData(data?.subscription);
      setHistory(data?.payment_history || []);
      setAvailablePlans(data?.available_plans || []);
    } catch (err) {
      console.error('Failed to load subscription info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const res = await api.cancelPlayerSubscription();
      setShowCancelModal(false);
      setActionMessage(res.message || 'Subscription auto-renewal has been cancelled.');
      await loadSubscription();
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const res = await api.reactivatePlayerSubscription();
      setActionMessage(res.message || 'Auto-renewal reactivated successfully.');
      await loadSubscription();
    } catch (err) {
      alert(err.message || 'Failed to reactivate subscription');
    }
  };

  const handleOpenChangeQuote = async (plan, cycle = 'yearly') => {
    setSelectedPlanForQuote(plan);
    setChangeCycle(cycle);
    try {
      const quote = await api.getPlanChangeQuote(plan.id, cycle);
      setQuoteData(quote);
      setShowChangePlanModal(true);
    } catch (err) {
      console.error('Failed to get plan quote:', err);
      // Fallback navigation
      navigate(`/player/checkout?type=plan&id=${plan.id}&billing=${cycle}`);
    }
  };

  const sub = subData;
  const isAccessValid = sub?.is_access_valid ?? (sub?.status === 'active');
  const isCancelled = sub?.status === 'cancelled';
  const isExpired = sub?.status === 'expired';
  const isFree = !sub || sub?.status === 'free';

  const tierRanks = { free: 0, rookie: 1, pro_striker: 2, elite_legend: 3 };
  const currentTierRank = tierRanks[sub?.tier || 'free'] || 0;

  return (
    <Shell
      title="My Subscription & Coaching Plans"
      subtitle="Manage your coaching tier, review allowances, billing renewals, and invoices."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto my-4">
          {actionMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>{actionMessage}</span>
              </div>
              <button
                onClick={() => setActionMessage('')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active / Current Plan Card */}
          {sub && !isFree ? (
            <div className="app-card p-8 sm:p-10 shadow-elevated border-2 border-forest/20 relative overflow-hidden bg-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                {/* Left side details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-heading font-extrabold uppercase tracking-widest bg-gold text-navy-dark shadow-xs">
                      🏏 {sub.plan_name || 'Active Plan'}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full border ${
                        sub.status === 'active'
                          ? 'bg-emerald-50 text-forest border-emerald-200'
                          : sub.status === 'cancelled'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <StatusPill status={sub.status} />
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="font-heading font-extrabold text-4xl sm:text-5xl text-navy tracking-tight">
                      ₹{formatCurrency(sub.amount || sub.price || 499)}
                    </span>
                    <span className="text-lg font-semibold text-slate-500">
                      /{sub.billing_period === 'yearly' ? 'year' : 'month'}
                    </span>
                    {sub.billing_period === 'yearly' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Annual Plan (16.7% Saved)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-gold-dark shrink-0" />
                      <span>
                        Video Reviews:{' '}
                        <strong className="text-navy font-bold text-sm">
                          {sub.reviews_remaining ?? 0} / {sub.reviews_total || (sub.billing_period === 'yearly' ? 12 : 1)}
                        </strong>{' '}
                        remaining
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-forest shrink-0" />
                      <span>
                        Access Validity:{' '}
                        <strong className="text-forest font-bold">
                          {sub.days_remaining ?? 30} days remaining
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Cancellation banner if auto-renew cancelled */}
                  {isCancelled && (
                    <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Auto-Renewal Cancelled:</strong> Your paid access remains fully active until{' '}
                        <strong>{new Date(sub.expires_at).toLocaleDateString('en-GB')}</strong>. After this date, you will not be billed again and your account will transition to the Free tier.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side dates & action buttons */}
                <div className="flex flex-col lg:items-end justify-between space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 min-w-[240px]">
                  <div className="text-xs text-slate-500 font-medium space-y-1 lg:text-right">
                    <div>
                      Started on:{' '}
                      <strong className="text-navy">
                        {sub.started_at ? new Date(sub.started_at).toLocaleDateString('en-GB') : '06/10/2026'}
                      </strong>
                    </div>
                    <div>
                      {isCancelled ? 'Access ends:' : 'Next billing date:'}{' '}
                      <strong className="text-navy">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-GB') : '31/10/2026'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sub.auto_renew
                        ? '● Auto-renewal is enabled'
                        : '○ Auto-renewal is turned off'}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full">
                    {/* Upgrade / Change Plan */}
                    <button
                      onClick={() => {
                        const nextPlan = availablePlans.find(
                          (p) => tierRanks[p.tier] > currentTierRank
                        ) || availablePlans[0];
                        if (nextPlan) handleOpenChangeQuote(nextPlan, sub.billing_period || 'yearly');
                      }}
                      className="btn-primary text-xs sm:text-sm px-6 py-2.5 font-bold shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-gold" />
                      <span>Upgrade or Change Plan</span>
                    </button>

                    {/* Cancel or Reactivate auto-renewal */}
                    {sub.status === 'active' ? (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="btn-secondary text-xs px-4 py-2 font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        Cancel Auto-Renewal
                      </button>
                    ) : isCancelled && isAccessValid ? (
                      <button
                        onClick={handleReactivateSubscription}
                        className="btn-secondary text-xs px-4 py-2 font-semibold text-forest hover:bg-emerald-50 border-emerald-200 text-center flex items-center justify-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Auto-Renewal</span>
                      </button>
                    ) : (
                      <Link
                        to={`/player/checkout?type=plan&id=${sub.plan_id || 'plan_rookie'}&billing=${sub.billing_period || 'yearly'}`}
                        className="btn-secondary text-xs px-4 py-2 font-semibold text-forest hover:bg-emerald-50 border-emerald-200 text-center"
                      >
                        Renew Plan
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative blur */}
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-forest/5 rounded-full blur-2xl pointer-events-none" />
            </div>
          ) : (
            /* Free Plan Empty State */
            <div className="app-card py-16 px-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center text-forest mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Current Plan
              </span>
              <h2 className="font-heading font-extrabold text-3xl text-navy">
                Free Tier (No Active Membership)
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed mb-6">
                You are currently on the Free tier. Upgrade to <strong>Rookie</strong> (₹499/mo) or <strong>Elite Legend</strong> to unlock certified video technique reviews, full scorecards, and advanced player comparisons.
              </p>
              <Link
                to="/player/plans"
                className="btn-primary text-sm font-bold px-8 py-3 shadow-md flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Explore Subscription Plans</span>
              </Link>
            </div>
          )}

          {/* Available Plans & Upgrades Section */}
          <div className="app-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-heading font-bold text-2xl text-navy">
                  Available Coaching Tiers
                </h3>
                <p className="text-xs text-slate-500">
                  Select a plan to compare features, upgrade allowances, or switch billing cycles.
                </p>
              </div>
              <Link
                to="/player/plans"
                className="text-xs font-bold text-forest hover:underline flex items-center space-x-1"
              >
                <span>View Full Comparison Grid</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => {
                const planRank = tierRanks[plan.tier] || 1;
                const isCurrent = sub?.plan_id === plan.id && isAccessValid;
                const isUpgrade = planRank > currentTierRank;
                const isDowngrade = planRank < currentTierRank;

                return (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10'
                        : plan.popular
                        ? 'border-forest/40 bg-white shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-heading font-extrabold text-xl text-navy">
                          {plan.name}
                        </h4>
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : plan.popular ? (
                          <span className="text-[10px] font-bold text-navy-dark bg-gold px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        ) : null}
                      </div>

                      <div className="mb-4">
                        <span className="font-heading font-extrabold text-3xl text-navy">
                          ₹{formatCurrency(plan.monthly_price || plan.price)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium ml-1">/month</span>
                        <div className="text-[11px] text-forest font-semibold mt-0.5">
                          ₹{formatCurrency(plan.yearly_price || plan.price * 10)}/year (Save 16.7%)
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-600 mb-6">
                        {(plan.features?.slice(0, 4) || []).map((feat, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                        >
                          ✓ Current Tier
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenChangeQuote(plan, 'yearly')}
                          className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                            isUpgrade
                              ? 'btn-primary text-white shadow-xs'
                              : 'btn-secondary text-slate-700'
                          }`}
                        >
                          <span>{isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment History Invoices Table */}
          <div className="app-card overflow-hidden p-0 bg-white">
            <div className="p-6 border-b border-surface-border">
              <h3 className="font-heading font-bold text-2xl text-navy">Payment & Billing History</h3>
              <p className="text-xs text-slate-500">Verified Razorpay transactions, receipts, and invoices.</p>
            </div>

            <div className="divide-y divide-surface-border">
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No payment transactions found.
                </div>
              ) : (
                history.map((p) => {
                  const dateStr = p.created_at
                    ? new Date(p.created_at).toLocaleDateString('en-GB')
                    : 'Today';

                  return (
                    <div
                      key={p.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-navy text-sm">{p.item_name}</span>
                          {p.billing_period && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {p.billing_period}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                          <span>{dateStr}</span>
                          {p.gateway_order_id && (
                            <span className="font-mono text-[11px] text-slate-500">
                              Order: {p.gateway_order_id}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end sm:self-center">
                        <span className="font-heading font-extrabold text-xl text-navy">
                          ₹{formatCurrency(p.amount)}
                        </span>
                        <StatusPill status={p.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Auto-Renewal Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-xs animate-in fade-in">
          <div className="app-card max-w-md w-full p-6 sm:p-8 space-y-4 shadow-elevated">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-bold text-2xl text-navy">
              Cancel Auto-Renewal?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel auto-renewal for your <strong>{sub?.plan_name}</strong> subscription?
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>You will retain full membership access until <strong>{sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-GB') : 'end of period'}</strong>.</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>No further recurring charges will be billed to your payment method.</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn-secondary text-xs px-4 py-2 font-semibold"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="btn-primary text-xs px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change / Quote Modal */}
      {showChangePlanModal && quoteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-xs animate-in fade-in">
          <div className="app-card max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-gold-dark" />
                <h3 className="font-heading font-bold text-2xl text-navy">
                  Plan Change Details
                </h3>
              </div>
              <button
                onClick={() => setShowChangePlanModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Current Plan:</span>
                <span className="font-bold text-navy">{quoteData.current_plan_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Selected Plan:</span>
                <span className="font-bold text-forest text-sm">{quoteData.target_plan_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Billing Cycle:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-100 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleOpenChangeQuote(selectedPlanForQuote, 'monthly')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      changeCycle === 'monthly' ? 'bg-white text-navy shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenChangeQuote(selectedPlanForQuote, 'yearly')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      changeCycle === 'yearly' ? 'bg-forest text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Yearly (-16.7%)
                  </button>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="font-bold text-navy">Payable Amount:</span>
                <span className="font-heading font-extrabold text-2xl text-forest">
                  ₹{formatCurrency(quoteData.price)}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              {quoteData.explanation}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowChangePlanModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-semibold"
              >
                Close
              </button>
              <Link
                to={`/player/checkout?type=plan&id=${quoteData.target_plan_id}&billing=${changeCycle}`}
                className="btn-primary text-xs px-6 py-2.5 font-bold flex items-center space-x-1.5"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};
