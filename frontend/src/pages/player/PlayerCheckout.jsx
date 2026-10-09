import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Shell } from '../../components/Shell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const PlayerCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const itemType = searchParams.get('type') || 'plan';
  const itemId = searchParams.get('id') || 'plan_elite';

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusState, setStatusState] = useState('idle'); // idle | processing | success | failure
  const [errorMessage, setErrorMessage] = useState('');

  // Initial order initialization
  const initOrder = async () => {
    setLoading(true);
    try {
      const data = await api.createOrder(itemType, itemId);
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
  }, [itemType, itemId]);

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

  const handlePay = async (simulateSuccess = true) => {
    if (!orderData) return;
    setProcessing(true);
    setStatusState('processing');

    try {
      if (!simulateSuccess) {
        // User cancelled or simulated failure
        const verifyRes = await api.verifyPayment({
          order_id: orderData.order_id,
          success: false,
        });
        setErrorMessage(verifyRes.message || 'Payment transaction was declined.');
        setStatusState('failure');
        return;
      }

      // Check if real Razorpay Checkout is loaded and configured with live keys
      if (
        window.Razorpay &&
        !orderData.is_mock &&
        orderData.key_id &&
        !orderData.key_id.startsWith('rzp_test_cricketvault_demo')
      ) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount * 100,
          currency: orderData.currency || 'INR',
          name: 'Cricket Vault Coaching',
          description: orderData.item_name,
          order_id: orderData.order_id,
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
        rzp.open();
        return;
      }

      // In test/mock mode, obtain authentic cryptographic authorization signature from backend
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

  return (
    <Shell
      title="Secure Checkout"
      subtitle="Complete your payment with Razorpay test gateway (INR)."
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
              Thank you for your purchase. Your access has been activated instantly.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mb-8 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Item:</span>
                <span className="font-semibold text-navy">{orderData?.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Amount Paid:</span>
                <span className="font-heading font-extrabold text-forest text-base">
                  ₹{orderData?.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Reference ID:</span>
                <span className="font-mono text-slate-600">{orderData?.order_id}</span>
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
                  </div>
                </div>

                <div className="space-y-3 text-sm py-4 border-t border-b border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{orderData?.amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & Fees</span>
                    <span className="text-forest font-semibold">₹0 (Included)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-heading font-extrabold text-2xl text-navy">Total</span>
                  <span className="font-heading font-extrabold text-4xl text-forest">
                    ₹{orderData?.amount}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Currency: Indian Rupee (INR)</p>
              </div>
            </div>

            {/* Right Column: Payment */}
            <div className="app-card flex flex-col justify-between p-8 sm:p-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-bold text-3xl text-navy">Payment</h2>
                  <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <Lock className="w-3.5 h-3.5" />
                    <span>256-bit Encrypted</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Test checkout mode is active. You can simulate instant authorization or test payment failure handling.
                </p>

                {/* Razorpay Pay Button */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePay(true)}
                    disabled={processing}
                    className="w-full btn-primary h-14 text-base font-bold shadow-md flex items-center justify-center space-x-2 text-white"
                  >
                    {processing ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Pay ₹{orderData?.amount} (Authorize)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePay(false)}
                    disabled={processing}
                    className="w-full btn-secondary h-11 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Simulate Gateway Failure
                  </button>
                </div>
              </div>

              {/* Supported methods & secure notes */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-2">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                  <span>Supported Methods: UPI, Credit/Debit Cards, NetBanking</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  By clicking Pay, you agree to Cricket Vault's terms of service and instant digital coaching fulfillment policy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
