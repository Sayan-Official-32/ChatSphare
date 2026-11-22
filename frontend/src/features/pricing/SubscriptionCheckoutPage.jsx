/**
 * @file SubscriptionCheckoutPage.jsx
 * @description Enterprise Subscription Checkout & Plan Upgrade Page for Chatbook.
 * Faithfully reproduces the reference UI (media_1789327725838.png):
 * 1. Split 2-column layout (Left: Plan & currency breakdown, Right: Promo code & Payment method).
 * 2. INR and USD dual currency calculation with live conversion notice.
 * 3. Dedicated Promo Code redemption system with plan-specific database validation.
 * 4. Interactive Card Payment Form:
 *    - Active, real-time input formatting (card number, MM/YY, CVC, name, billing country).
 *    - Intercepts card payments to notify user that direct card processing is currently
 *      unavailable and prompts them to use a promo code.
 * 5. Full dark/light theme integration via useTheme().
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sparkles,
  Tag,
  Loader2,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import { validatePromoCode, applySubscriptionPromoCode, fetchCurrentSubscription } from '@/services/api';

// Exchange rate constant matching reference mockup (1 USD = 99.4095 INR with 4% fee)
const USD_TO_INR_RATE = 99.4095;

const PLAN_CATALOG = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    monthlyPriceUSD: 29,
    annualPriceUSD: 24, // $24/mo billed annually = $288/yr
    features: ['10,000 credits/mo', '3 Brand Agents', 'Standard Support'],
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    monthlyPriceUSD: 109,
    annualPriceUSD: 89, // $89/mo billed annually = $1,068/yr -> ~₹106,169.11
    features: ['50,000 credits/mo', '10 Brand Agents', 'Custom Domain', 'Priority Support'],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthlyPriceUSD: 299,
    annualPriceUSD: 249, // $249/mo billed annually = $2,988/yr
    features: ['Unlimited credits', 'Unlimited Brand Agents', 'White-labeling', 'Dedicated Architect'],
  },
};

export default function SubscriptionCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Selected plan & billing cycle resolution from URL query params
  const rawPlan = (searchParams.get('plan') || 'builder').toLowerCase();
  const selectedPlan = PLAN_CATALOG[rawPlan] || PLAN_CATALOG.builder;
  const rawCycle = (searchParams.get('cycle') || 'annually').toLowerCase();
  const isAnnually = rawCycle === 'annually' || rawCycle === 'yearly';

  // Currency State: 'INR' | 'USD'
  const [currency, setCurrency] = useState('INR');

  // User current plan tier
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    let isMounted = true;
    const loadCurrent = async () => {
      try {
        const res = await fetchCurrentSubscription();
        const plan = (res?.plan_tier || res?.data?.plan_tier || user?.plan_tier || 'free').toLowerCase();
        if (isMounted && plan) setCurrentTier(plan);
      } catch {
        if (isMounted && user?.plan_tier) setCurrentTier(user.plan_tier.toLowerCase());
      }
    };
    loadCurrent();
    return () => { isMounted = false; };
  }, [user]);

  const TIER_RANKS = { free: 0, explorer: 1, builder: 2, scale: 3 };
  const currentRank = TIER_RANKS[currentTier] ?? 0;
  const targetRank = TIER_RANKS[selectedPlan.id] ?? 0;
  const isLowerOrEqual = currentRank > 0 && targetRank <= currentRank;

  // Promocode State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState(null);

  // Card Form Inputs (Interactive)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingCountry, setBillingCountry] = useState('India');
  const [saveInfo, setSaveInfo] = useState(false);

  // Modals & Feedback
  const [cardNoticeOpen, setCardNoticeOpen] = useState(false);
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState(null);

  // Focus promo input helper
  const promoInputRef = React.useRef(null);

  // Pricing Calculations
  const pricing = useMemo(() => {
    const totalUSD = isAnnually
      ? selectedPlan.annualPriceUSD * 12
      : selectedPlan.monthlyPriceUSD;

    const monthlyBilledUSD = isAnnually
      ? selectedPlan.annualPriceUSD
      : selectedPlan.monthlyPriceUSD;

    const totalINR = totalUSD * USD_TO_INR_RATE;
    const monthlyBilledINR = monthlyBilledUSD * USD_TO_INR_RATE;

    const formatINR = (val) =>
      '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatUSD = (val) =>
      '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      totalFormatted: currency === 'INR' ? formatINR(totalINR) : formatUSD(totalUSD),
      monthlyBilledFormatted: currency === 'INR' ? formatINR(monthlyBilledINR) : formatUSD(monthlyBilledUSD),
      cycleSuffix: isAnnually ? 'per year' : 'per month',
      periodNote: isAnnually ? 'billed annually' : 'billed monthly',
      totalRaw: currency === 'INR' ? totalINR : totalUSD,
    };
  }, [selectedPlan, isAnnually, currency]);

  // Format Card Number input with grouping: '#### #### #### ####'
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry: 'MM / YY'
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Format CVC: max 4 digits
  const handleCvcChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  // Validate Promo Code
  const handleApplyPromoCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) {
      setPromoError('Please enter a promo code.');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const res = await validatePromoCode(clean, selectedPlan.id);
      setAppliedPromo(res);
      setPromoError(null);
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.message || 'Invalid or expired promo code.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Clear Promo Code
  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  // Subscribe button click
  const handleSubscribeSubmit = (e) => {
    e.preventDefault();

    // If promo code is applied (100% off), execute real upgrade
    if (appliedPromo) {
      handleFinalUpgrade();
      return;
    }

    // If user attempts to pay via Card without a valid promo code, intercept and display notice
    setCardNoticeOpen(true);
  };

  // Execute Upgrade in Database via API
  const handleFinalUpgrade = async () => {
    if (!appliedPromo) return;

    setIsSubmittingUpgrade(true);
    try {
      const payload = {
        code: appliedPromo.code,
        plan_tier: selectedPlan.id,
        billing_cycle: isAnnually ? 'annually' : 'monthly',
        currency: currency,
      };
      const res = await applySubscriptionPromoCode(payload);
      setUpgradeResult(res);
      setSuccessModalOpen(true);
      window.dispatchEvent(new CustomEvent('chatbook:credits_updated'));
      window.dispatchEvent(new CustomEvent('chatbook:subscription_updated', { detail: res }));
    } catch (err) {
      alert(err.message || 'Failed to apply subscription upgrade.');
    } finally {
      setIsSubmittingUpgrade(false);
    }
  };

  // Design Tokens
  const leftBg = isDark ? '#0f1017' : '#f4f0fd';
  const rightBg = isDark ? '#09090b' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : '#475569';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8';
  const inputBg = isDark ? '#14141d' : '#f8fafc';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1';

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: rightBg,
      color: textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ── LEFT PANE: Plan Summary & Currency Selection ── */}
      <div style={{
        width: '42%',
        minWidth: '380px',
        maxWidth: '520px',
        background: leftBg,
        borderRight: `1px solid ${borderColor}`,
        height: '100%',
        overflowY: 'auto',
        padding: '3rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
      }}>
        <div>
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/app/pricing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'transparent',
              border: 'none',
              color: textSecondary,
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.4rem 0',
              marginBottom: '2rem',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = textSecondary}
          >
            <ArrowLeft size={16} />
            <span>Back to plans</span>
          </button>

          {/* Title matching reference */}
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: textSecondary,
            margin: '0 0 0.5rem 0',
          }}>
            Subscribe to {selectedPlan.name}
          </h2>

          {/* Big Price Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '2.65rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: textPrimary,
              lineHeight: 1.1,
            }}>
              {appliedPromo ? (currency === 'INR' ? '₹0.00' : '$0.00') : pricing.totalFormatted}
            </span>
            <span style={{ fontSize: '0.9rem', color: textSecondary, fontWeight: 500 }}>
              {pricing.cycleSuffix}
            </span>
          </div>

          {/* Subtitle / Monthly breakdown */}
          <p style={{
            fontSize: '0.86rem',
            color: textSecondary,
            margin: '0.4rem 0 1.5rem 0',
            fontWeight: 500,
          }}>
            {appliedPromo
              ? '100% promo pass applied (free upgrade)'
              : `${pricing.monthlyBilledFormatted} / month ${pricing.periodNote}`}
          </p>

          {/* Currency Toggle Pills matching reference */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <button
              onClick={() => setCurrency('INR')}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '9px',
                border: currency === 'INR'
                  ? `2px solid ${isDark ? '#a78bfa' : '#475569'}`
                  : `1px solid ${borderColor}`,
                background: currency === 'INR'
                  ? (isDark ? 'rgba(167,139,250,0.15)' : 'rgba(0,0,0,0.06)')
                  : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                color: textPrimary,
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇮🇳</span>
              <span>INR</span>
            </button>

            <button
              onClick={() => setCurrency('USD')}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '9px',
                border: currency === 'USD'
                  ? `2px solid ${isDark ? '#a78bfa' : '#475569'}`
                  : `1px solid ${borderColor}`,
                background: currency === 'USD'
                  ? (isDark ? 'rgba(167,139,250,0.15)' : 'rgba(0,0,0,0.06)')
                  : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                color: textPrimary,
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇺🇸</span>
              <span>USD</span>
            </button>
          </div>

          {/* Conversion rate footnote matching reference */}
          <div style={{
            fontSize: '0.74rem',
            lineHeight: 1.45,
            color: textMuted,
            marginBottom: '2.5rem',
          }}>
            1 USD = 99.4095 INR (includes 4% conversion fee). Charges will vary based on exchange rates.{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer', color: textSecondary }}>
              Show details
            </span>
          </div>

          {/* Plan Line Item Box */}
          <div style={{
            borderTop: `1px solid ${borderColor}`,
            paddingTop: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 700, color: textPrimary }}>
                {selectedPlan.name}
              </span>
              <span style={{ fontSize: '0.98rem', fontWeight: 700, color: textPrimary }}>
                {appliedPromo ? (currency === 'INR' ? '₹0.00' : '$0.00') : pricing.totalFormatted}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: textMuted }}>
              <span style={{ textTransform: 'capitalize' }}>{pricing.periodNote}</span>
              {appliedPromo && (
                <span style={{ color: '#10b981', fontWeight: 600 }}>100% Promo applied</span>
              )}
            </div>
          </div>
        </div>

        {/* Security badge at bottom of left pane */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.76rem',
          color: textMuted,
          paddingTop: '1rem',
          borderTop: `1px solid ${borderColor}`,
        }}>
          <Lock size={14} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <span>Encrypted 256-bit SSL connection. Cancel anytime.</span>
        </div>
      </div>

      {/* ── RIGHT PANE: Promo Code & Payment Form ── */}
      <div style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '3rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: '490px', width: '100%', margin: '0 auto' }}>

          {/* Alert if user already has this or a higher plan */}
          {isLowerOrEqual && (
            <div style={{
              background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#ef4444',
              fontSize: '0.82rem',
              lineHeight: 1.45,
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Tier Restriction:</strong>{' '}
                {targetRank === currentRank
                  ? `Your workspace is already actively subscribed to the ${selectedPlan.name} plan.`
                  : `Your workspace already has a higher plan (${currentTier.toUpperCase()}). Promocodes for lower tiers cannot be applied.`}
              </div>
            </div>
          )}

          {/* 1. PROMO CODE REDEMPTION SECTION */}
          <div style={{
            background: isDark ? 'rgba(124,58,237,0.08)' : '#faf5ff',
            border: `1px solid ${appliedPromo ? '#10b981' : (isDark ? 'rgba(124,58,237,0.25)' : '#e9d5ff')}`,
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
            marginBottom: '1.75rem',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <Tag size={16} color={appliedPromo ? '#10b981' : '#8b5cf6'} />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: textPrimary }}>
                {appliedPromo ? 'Promo Code Activated!' : 'Have a Promo Code?'}
              </span>
            </div>

            {appliedPromo ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDark ? '#121f18' : '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  marginBottom: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#10b981', letterSpacing: '0.04em' }}>
                        {appliedPromo.code}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: isDark ? '#a7f3d0' : '#047857', marginLeft: '0.5rem' }}>
                        ({appliedPromo.discount_percent}% off {selectedPlan.name})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: textMuted,
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Remove promo code"
                  >
                    <X size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSubmittingUpgrade}
                  onClick={handleFinalUpgrade}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
                    border: 'none',
                    borderRadius: '9px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: isSubmittingUpgrade ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmittingUpgrade ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Activating {selectedPlan.name} Plan…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Redeem & Activate {selectedPlan.name} Plan</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromoCode}>
                <p style={{ fontSize: '0.78rem', color: textSecondary, margin: '0 0 0.75rem 0' }}>
                  Have a promotion code? Enter it below to unlock your subscription:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={promoInputRef}
                    type="text"
                    value={promoCodeInput}
                    onChange={e => {
                      setPromoCodeInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    placeholder="Enter promo code"
                    style={{
                      flex: 1,
                      height: '38px',
                      background: inputBg,
                      border: `1px solid ${promoError ? '#ef4444' : inputBorder}`,
                      borderRadius: '8px',
                      padding: '0 0.75rem',
                      fontSize: '0.86rem',
                      color: textPrimary,
                      fontWeight: 600,
                      outline: 'none',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    style={{
                      padding: '0 1.15rem',
                      height: '38px',
                      background: isDark ? '#7c3aed' : '#6d28d9',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: isValidatingPromo || !promoCodeInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isValidatingPromo || !promoCodeInput.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {isValidatingPromo ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Apply'}
                  </button>
                </div>

                {promoError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    marginTop: '0.55rem',
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{promoError}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* 2. OR DIVIDER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: borderColor }} />
            <span style={{
              padding: '0 1rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: textMuted,
            }}>
              OR
            </span>
            <div style={{ flex: 1, height: '1px', background: borderColor }} />
          </div>

          {/* 3. CONTACT SECTION matching reference */}
          <div style={{ marginBottom: '1.6rem' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.65rem 0' }}>
              Contact
            </h3>
            <label style={{ display: 'block', fontSize: '0.76rem', color: textSecondary, fontWeight: 500, marginBottom: '0.35rem' }}>
              Email
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || 'aicoder001@gmail.com'}
              style={{
                width: '100%',
                height: '42px',
                background: isDark ? '#13141c' : '#f1f5f9',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '0 0.85rem',
                fontSize: '0.88rem',
                color: textPrimary,
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'default',
              }}
            />
          </div>

          {/* 4. PAYMENT METHOD SECTION matching reference */}
          <form onSubmit={handleSubscribeSubmit}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.65rem 0' }}>
              Payment method
            </h3>

            {/* Card Form Outer Box */}
            <div style={{
              border: `1px solid ${inputBorder}`,
              borderRadius: '9px',
              overflow: 'hidden',
              marginBottom: '1.25rem',
            }}>
              {/* Card tab header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderBottom: `1px solid ${borderColor}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              }}>
                <CreditCard size={17} color={textPrimary} />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: textPrimary }}>Card</span>
              </div>

              {/* Card Information Inputs */}
              <div style={{ padding: '0.85rem' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: textSecondary, fontWeight: 500, marginBottom: '0.35rem' }}>
                  Card information
                </span>

                {/* Card Number with Brand Logos */}
                <div style={{ position: 'relative', marginBottom: '0.55rem' }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="Card number"
                    style={{
                      width: '100%',
                      height: '40px',
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      padding: '0 5.5rem 0 0.75rem',
                      fontSize: '0.86rem',
                      color: textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                    }}
                  />
                  {/* Card Brand Badges */}
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', background: '#1a1f71', color: '#fff' }}>VISA</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', background: '#eb001b', color: '#fff' }}>MC</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', background: '#006fcf', color: '#fff' }}>AMEX</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', background: '#007940', color: '#fff' }}>JCB</span>
                  </div>
                </div>

                {/* MM / YY & Security code in split row */}
                <div style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.55rem' }}>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM / YY"
                    style={{
                      flex: 1,
                      height: '40px',
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      padding: '0 0.75rem',
                      fontSize: '0.86rem',
                      color: textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={handleCvcChange}
                      placeholder="Security code"
                      style={{
                        width: '100%',
                        height: '40px',
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        borderRadius: '6px',
                        padding: '0 2.2rem 0 0.75rem',
                        fontSize: '0.86rem',
                        color: textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: textMuted,
                      border: `1px solid ${borderColor}`,
                      padding: '1px 3px',
                      borderRadius: '3px',
                    }}>
                      123
                    </span>
                  </div>
                </div>

                {/* Name on card */}
                <div style={{ marginBottom: '0.55rem' }}>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: textSecondary, fontWeight: 500, marginBottom: '0.35rem' }}>
                    Name on card
                  </span>
                  <input
                    type="text"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="First and last name"
                    style={{
                      width: '100%',
                      height: '40px',
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      padding: '0 0.75rem',
                      fontSize: '0.86rem',
                      color: textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Billing information: Country Selector */}
                <div>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: textSecondary, fontWeight: 500, marginBottom: '0.35rem' }}>
                    Billing information
                  </span>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={billingCountry}
                      onChange={e => setBillingCountry(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        borderRadius: '6px',
                        padding: '0 2rem 0 0.75rem',
                        fontSize: '0.86rem',
                        color: textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box',
                        appearance: 'none',
                      }}
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                    <ChevronDown size={15} color={textMuted} style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Terms notice matching reference */}
            <p style={{
              fontSize: '0.74rem',
              lineHeight: 1.45,
              color: textMuted,
              margin: '0 0 1rem 0',
            }}>
              By subscribing, you authorize SketricGen to charge you according to the terms until you cancel.
            </p>

            {/* Save information checkbox matching reference */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.78rem',
              color: textSecondary,
              cursor: 'pointer',
              marginBottom: '1.5rem',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={e => setSaveInfo(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <span>Save my information for faster checkout</span>
            </label>

            {/* Big Purple Subscribe Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.88rem 1.25rem',
                background: '#6366f1',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.96rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
            >
              Subscribe
            </button>
          </form>

          {/* Footer branding matching reference */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.72rem',
            color: textMuted,
            marginTop: '2.5rem',
          }}>
            <span>Powered by <strong style={{ color: textSecondary }}>stripe</strong></span>
            <span>|</span>
            <span style={{ cursor: 'pointer' }}>Terms</span>
            <span style={{ cursor: 'pointer' }}>Privacy</span>
          </div>

        </div>
      </div>

      {/* ── CARD INTERCEPT MODAL NOTIFICATION ── */}
      {cardNoticeOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: isDark ? '#14141f' : '#ffffff',
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: isDark ? 'rgba(124,58,237,0.18)' : '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}>
              <Tag size={26} />
            </div>

            <h3 style={{ fontSize: '1.28rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.5rem 0' }}>
              Card Payments Unavailable
            </h3>

            <p style={{ fontSize: '0.86rem', color: textSecondary, lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Direct card payments are currently unavailable. Please use a promo code in the section above to upgrade your subscription.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setCardNoticeOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: '9px',
                  border: `1px solid ${borderColor}`,
                  background: 'transparent',
                  color: textSecondary,
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCardNoticeOpen(false);
                  if (promoInputRef.current) promoInputRef.current.focus();
                }}
                style={{
                  flex: 1.2,
                  padding: '0.7rem 1rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Enter Promo Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL CELEBRATION ── */}
      {successModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: isDark ? '#14141f' : '#ffffff',
            border: `1px solid ${borderColor}`,
            borderRadius: '18px',
            padding: '2.5rem 2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
            }}>
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.5rem 0' }}>
              Subscription Activated!
            </h3>

            <p style={{ fontSize: '0.9rem', color: textSecondary, lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
              Your workspace is now upgraded to the <strong style={{ color: textPrimary }}>{selectedPlan.name}</strong> tier with unlimited AI generations and full feature access.
            </p>

            <div style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
            }}>
              <span style={{ color: textMuted }}>Promo Code Used:</span>
              <strong style={{ color: '#10b981' }}>{appliedPromo?.code}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={() => navigate('/app/pricing')}
                style={{
                  flex: 1,
                  padding: '0.82rem 1rem',
                  background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '10px',
                  color: textPrimary,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Manage Subscription
              </button>
              <button
                onClick={() => navigate('/app/agents')}
                style={{
                  flex: 1,
                  padding: '0.82rem 1rem',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  transition: 'background 0.15s ease',
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}