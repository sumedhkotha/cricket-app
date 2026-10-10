import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatCurrency } from '../../utils/pricing';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  Tag,
  AlertCircle,
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PlayerCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const itemType = searchParams.get('type') || 'plan';
  const itemId = searchParams.get('id') || 'plan_rookie';
  const billingCycle = searchParams.get('billing') || searchParams.get('billing_cycle') || searchParams.get('interval') || 'monthly'; // 'monthly' | 'yearly'

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusState, setStatusState] = useState('idle'); // idle | processing | success | failure
  const [errorMessage, setErrorMessage] = useState('');

  // Initial order initialization
  const initOrder = async () => {
    setLoading(true);
    try {
      const data = await api.createOrder(itemType, itemId, billingCycle);
      setOrderData(data);
      setStatusState('idle');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate checkout order');
      setStatusState('failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initOrder();
    loadRazorpayScript();
  }, [itemType, itemId, billingCycle]);

  // Trigger celebration confetti on success
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B4D3B', '#F59E0B', '#116B52', '#FBBF24'],
      });
    } catch (e) {
      // Ignored if canvas not supported
    }
  };

  const handlePay = async (action = 'razorpay') => {
    if (!orderData) return;
    setProcessing(true);
    setStatusState('processing');

    try {
      if (action === 'simulate_failure') {
        // User cancelled or simulated failure
        const verifyRes = await api.verifyPayment({
          order_id: orderData.order_id,
          success: false,
        });
        setErrorMessage(verifyRes.message || 'Payment transaction was declined.');
        setStatusState('failure');
        return;
      }

      if (action === 'simulate_instant') {
        // Instant test cryptographic authorization
        const authPayload = await api.testAuthorizePayment(orderData.order_id);
        const verifyRes = await api.verifyPayment({
          order_id: authPayload.order_id,
          payment_id: authPayload.payment_id,
          signature: authPayload.signature,
          success: true,
        });
        if (verifyRes.success) {
          setStatusState('success');
          triggerConfetti();
          await refreshUser();
        } else {
          setErrorMessage(verifyRes.message || 'Payment authorization failed');
          setStatusState('failure');
        }
        return;
      }

      // Live / Test Razorpay Checkout Modal
      const isScriptLoaded = await loadRazorpayScript();
      const activeKey =
        orderData.key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_test_TlJXyXiG8OLp2d';

      if (isScriptLoaded && window.Razorpay) {
        const options = {
          key: activeKey,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'Cricket Vault Coaching',
          description: orderData.item_name || 'Cricket Vault Package',
          order_id: orderData.order_id,
          prefill: {
            name: user?.name || 'Player',
            email: user?.email || 'player@cricketvault.demo',
            contact: '9876543210',
          },
          handler: async function (response) {
            try {
              const verifyRes = await api.verifyPayment({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                success: true,
              });
              if (verifyRes.success) {
                setStatusState('success');
                triggerConfetti();
                await refreshUser();
              } else {
                setErrorMessage(verifyRes.message || 'Payment verification failed');
                setStatusState('failure');
              }
            } catch (err) {
              setErrorMessage(err.message || 'Verification failed');
              setStatusState('failure');
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              setStatusState('idle');
            },
          },
          theme: { color: '#0B4D3B' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setErrorMessage(resp.error?.description || 'Payment was declined or cancelled.');
          setStatusState('failure');
          setProcessing(false);
        });
        rzp.open();
        return;
      }

      // Fallback if Razorpay SDK couldn't be loaded from CDN
      const authPayload = await api.testAuthorizePayment(orderData.order_id);
      const verifyRes = await api.verifyPayment({
        order_id: authPayload.order_id,
        payment_id: authPayload.payment_id,
        signature: authPayload.signature,
        success: true,
      });

      if (verifyRes.success) {
        setStatusState('success');
        triggerConfetti();
        await refreshUser();
      } else {
        setErrorMessage(verifyRes.message || 'Payment transaction was declined.');
        setStatusState('failure');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Payment verification failed');
      setStatusState('failure');
    } finally {
      setProcessing(false);
    }
  };

  const activeKeyId =
    orderData?.key_id ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    'rzp_test_TlJXyXiG8OLp2d';

  const isYearly = (orderData?.billing_period || billingCycle) === 'yearly';

  // Compute breakdown amounts
  const payableAmount = orderData?.amount || 0;
  const regularAnnualPrice = isYearly
    ? payableAmount === 4990
      ? 5988
      : payableAmount === 8990
      ? 10788
      : payableAmount === 14990
      ? 17988
      : Math.round(payableAmount * 1.2)
    : payableAmount;
  const annualSavings = isYearly ? regularAnnualPrice - payableAmount : 0;

  return (
    <Shell
      title="Secure Checkout"
      subtitle="Complete your payment securely with Razorpay test gateway (INR)."
    >
      <div className="max-w-4xl mx-auto my-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
          </div>
        ) : statusState === 'success' ? (
          /* Success Screen */
          <div className="app-card max-w-lg mx-auto text-center p-10 sm:p-12 shadow-elevated animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-forest rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-forest" />
            </div>

            <h2 className="font-heading font-extrabold text-4xl text-navy mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Thank you for your purchase. Your coaching membership has been activated with verified Razorpay signature.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mb-8 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Plan/Item:</span>
                <span className="font-semibold text-navy">{orderData?.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Billing Period:</span>
                <span className="font-semibold text-forest capitalize">
                  {orderData?.billing_period || billingCycle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Amount Paid:</span>
                <span className="font-heading font-extrabold text-forest text-base">
                  ₹{formatCurrency(orderData?.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Gateway Order ID:</span>
                <span className="font-mono text-slate-600 truncate max-w-[200px]">{orderData?.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Payment Gateway:</span>
                <span className="font-medium text-emerald-700">Razorpay (Active Test Gateway)</span>
              </div>
            </div>

            <div>
              {itemType === 'plan' ? (
                <Link
                  to="/player/subscription"
                  className="w-full btn-primary h-12 font-bold text-sm shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Go to My Subscription</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/player/library"
                  className="w-full btn-primary h-12 font-bold text-sm shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Go to My Library</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : statusState === 'failure' ? (
          /* Failure Screen */
          <div className="app-card max-w-lg mx-auto text-center p-10 sm:p-12 shadow-elevated animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12" />
            </div>

            <h2 className="font-heading font-extrabold text-4xl text-navy mb-2">
              Payment Failed
            </h2>
            <p className="text-sm text-slate-600 mb-8">
              {errorMessage || 'Your transaction could not be completed. Please try again.'}
            </p>

            <button
              onClick={initOrder}
              className="w-full btn-primary h-12 font-bold text-sm shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Two Column Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Order Summary */}
            <div className="app-card flex flex-col justify-between p-8 sm:p-10">
              <div>
                <h2 className="font-heading font-bold text-3xl text-navy mb-6">
                  Order Summary
                </h2>

                <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                  {itemType === 'plan' ? (
                    <div className="w-14 h-14 rounded-xl bg-forest text-gold flex items-center justify-center shrink-0">
                      <Sparkles className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gold/20 text-gold-dark flex items-center justify-center shrink-0">
                      <BookOpen className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {itemType === 'plan' ? 'Subscription Plan' : 'Digital E-book'}
                    </span>
                    <h3 className="font-heading font-bold text-2xl text-navy">
                      {orderData?.item_name}
                    </h3>
                    {itemType === 'plan' && (
                      <span className="inline-flex items-center space-x-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <Tag className="w-3 h-3" />
                        <span>{isYearly ? 'Yearly Billing (16.7% Off)' : 'Monthly Billing'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 text-sm py-4 border-t border-b border-slate-100">
                  {isYearly && itemType === 'plan' ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Original Annual Comparison:</span>
                        <span className="line-through text-slate-400 font-semibold">
                          ₹{formatCurrency(regularAnnualPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-forest font-semibold">
                        <span>Annual Discount (Save 16.7%):</span>
                        <span>-₹{formatCurrency(annualSavings)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal (Annual):</span>
                        <span>₹{formatCurrency(payableAmount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Fee:</span>
                      <span>₹{formatCurrency(payableAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & GST:</span>
                    <span className="text-forest font-semibold">₹0 (Included)</span>
                  </div>
                </div>

                {/* Yearly billing disclaimer */}
                {isYearly && itemType === 'plan' && (
                  <div className="mt-4 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Important:</strong> Yearly subscriptions are charged as one single annual payment of{' '}
                      <strong>₹{formatCurrency(payableAmount)}</strong>, not as 12 monthly instalments.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-heading font-extrabold text-2xl text-navy">Total Payable</span>
                  <span className="font-heading font-extrabold text-4xl text-forest">
                    ₹{formatCurrency(payableAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Currency: Indian Rupee (INR) &bull; {isYearly ? 'Billed annually' : 'Billed monthly'}
                </p>
              </div>
            </div>

            {/* Right Column: Payment */}
            <div className="app-card flex flex-col justify-between p-8 sm:p-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-3xl text-navy">Payment</h2>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Lock className="w-3.5 h-3.5" />
                    <span>Razorpay Secure</span>
                  </div>
                </div>

                {/* Gateway Details Badge */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-forest" />
                    <span className="font-semibold text-navy">Gateway Key:</span>
                  </div>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {activeKeyId}
                  </span>
                </div>

                {/* Razorpay Pay Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePay('razorpay')}
                    disabled={processing}
                    className="w-full btn-primary h-14 text-base font-bold shadow-md flex items-center justify-center space-x-2 text-white hover:brightness-110 active:scale-[0.99] transition-all"
                  >
                    {processing ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Pay ₹{formatCurrency(payableAmount)} via Razorpay Modal</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePay('simulate_instant')}
                      disabled={processing}
                      className="btn-secondary h-11 text-xs font-semibold text-forest hover:bg-emerald-50 border-emerald-200 flex items-center justify-center space-x-1"
                    >
                      <Zap className="w-3.5 h-3.5 text-gold-dark" />
                      <span>Instant Test Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePay('simulate_failure')}
                      disabled={processing}
                      className="btn-secondary h-11 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      Simulate Decline
                    </button>
                  </div>
                </div>
              </div>

              {/* Supported methods & secure notes */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-2">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                  <span>UPI (GPay/PhonePe), Cards (Visa/Mastercard/RuPay), NetBanking</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Secured by Razorpay. 100% encrypted test payment environment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
