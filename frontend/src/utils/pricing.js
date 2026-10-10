/**
 * Subscription Pricing & Discount Calculation Utility
 * Guarantees exact calculations for Rookie, Pro Striker, and Elite Legend plans.
 */

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
};

export const calculatePlanPricing = (plan, billingCycle = 'monthly') => {
  const isYearly = billingCycle === 'yearly';
  const monthlyPrice = Number(plan?.monthly_price || plan?.price || 499);
  const yearlyPrice = Number(plan?.yearly_price || monthlyPrice * 10);

  const regularAnnual = monthlyPrice * 12;
  const annualSavings = regularAnnual - yearlyPrice;
  const discountPercent = Number(((annualSavings / regularAnnual) * 100).toFixed(1));
  const monthlyEquivalent = Number((yearlyPrice / 12).toFixed(2));
  const payableAmount = isYearly ? yearlyPrice : monthlyPrice;

  return {
    isYearly,
    monthlyPrice,
    yearlyPrice,
    regularAnnual,
    annualSavings,
    discountPercent, // e.g. 16.7
    monthlyEquivalent, // e.g. 415.83, 749.17, 1249.17
    payableAmount,
    formattedPayable: formatCurrency(payableAmount),
    formattedMonthly: formatCurrency(monthlyPrice),
    formattedYearly: formatCurrency(yearlyPrice),
    formattedRegularAnnual: formatCurrency(regularAnnual),
    formattedSavings: formatCurrency(annualSavings),
    formattedMonthlyEquivalent: formatCurrency(monthlyEquivalent),
  };
};
