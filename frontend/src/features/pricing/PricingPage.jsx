/**
 * @file PricingPage.jsx
 * @description Enterprise Subscription & Plan Management Page for Chatbook (/app/pricing).
 * Faithfully reproduces the reference UI:
 * 1. Centered header with dynamic teamspace label and Monthly vs. Annually toggle.
 * 2. 4 Pricing Tiers: Free, Explorer, Builder (★ Most Popular), and Scale with dynamic savings.
 * 3. Enterprise solutions card with "Contact Sales" workflow.
 * 4. Collapsible "View Detailed Plan Comparison" feature matrix.
 * 5. Interactive FAQ accordion with "Show All FAQs" expansion.
 * 6. Interactive checkout & contact sales modals.
 * 7. Complete dark & light theme adaptability integrated with Chatbook design system.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  Building2,
  Sparkles,
  Zap,
  HelpCircle,
  Sun,
  Moon,
  ShieldCheck,
  CreditCard,
  Send,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import { fetchCurrentSubscription } from '@/services/api';

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Unified Theme handling
  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();

  // Active subscription tier from backend
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    let isMounted = true;
    const loadSub = async () => {
      try {
        const res = await fetchCurrentSubscription();
        const plan = (res?.plan_tier || res?.data?.plan_tier || user?.plan_tier || 'free').toLowerCase();
        if (isMounted && plan) {
          setCurrentTier(plan);
        }
      } catch (err) {
        if (isMounted && user?.plan_tier) {
          setCurrentTier(user.plan_tier.toLowerCase());
        }
      }
    };
    loadSub();

    const handleSubUpdate = (e) => {
      if (e?.detail?.plan_tier) {
        setCurrentTier(e.detail.plan_tier.toLowerCase());
      } else {
        loadSub();
      }
    };
    window.addEventListener('chatbook:subscription_updated', handleSubUpdate);
    window.addEventListener('chatbook:credits_updated', loadSub);

    return () => {
      isMounted = false;
      window.removeEventListener('chatbook:subscription_updated', handleSubUpdate);
      window.removeEventListener('chatbook:credits_updated', loadSub);
    };
  }, [user]);

  // Billing interval: 'monthly' | 'annually'
  const [billingCycle, setBillingCycle] = useState('monthly');
  const isAnnually = billingCycle === 'annually';

  // Tooltip & interactive states
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  // Modals state
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', teamSize: '10-50', message: '' });
  const [contactSent, setContactSent] = useState(false);

  // Teamspace name
  const teamspaceName = user?.displayName ? `${user.displayName}'s Space` : "Coding's Space";

  // Palette
  const colors = {
    pageBg: isDark ? '#08090e' : '#f8fafc',
    cardBg: isDark ? '#111219' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    titleColor: isDark ? '#ffffff' : '#0f172a',
    subtitleColor: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.45)' : '#94a3b8',
    featureText: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155',
    featureMuted: isDark ? 'rgba(255, 255, 255, 0.35)' : '#94a3b8',
    creditBarBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    buttonGrayBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    buttonGrayText: isDark ? '#ffffff' : '#1e293b',
    buttonGrayHover: isDark ? 'rgba(255, 255, 255, 0.14)' : '#e2e8f0',
    primaryPurple: '#6366f1',
    primaryPurpleHover: '#4f46e5',
    popularBorder: '#6366f1',
    popularBanner: '#6366f1',
    greenBadgeBg: '#059669',
    savingsPillBg: '#5b21b6',
  };

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started with AI agents',
      priceMonthly: 0,
      priceAnnually: 0,
      savingsBadge: null,
      credits: '2,000 credits/month',
      isCurrent: currentTier === 'free',
      popular: false,
      features: [
        { label: 'Agent Spaces : 1', included: true },
        { label: 'Knowledge Bases : 1', included: true },
        { label: 'Storage : 50MB', included: true },
        { label: 'Brand Agents : 1 per project', included: true },
        { label: 'Team Members : Just you', included: true },
        { label: 'Sketric Connectors', included: false, warning: true },
        { label: 'API Access', included: false },
        { label: 'Integrations', included: false, hasInfo: true },
      ],
    },
    {
      id: 'explorer',
      name: 'Explorer',
      description: 'Explorer plan for scaling your AI workflows',
      priceMonthly: 19,
      priceAnnually: 17,
      savingsBadge: 'Save $24/year',
      credits: '12,000 credits/month',
      isCurrent: currentTier === 'explorer',
      popular: false,
      features: [
        { label: 'Agent Spaces : Unlimited', included: true },
        { label: 'Knowledge Bases : 3', included: true },
        { label: 'Storage : 250MB', included: true },
        { label: 'Brand Agents : 3 per project', included: true },
        { label: 'Team Members : Just you', included: true },
        { label: 'Sketric Connectors', included: true },
        { label: 'API Access', included: true },
        { label: 'Integrations', included: true, hasInfo: true },
      ],
    },
    {
      id: 'builder',
      name: 'Builder',
      description: 'Builder plan for scaling your AI workflows',
      priceMonthly: 99,
      priceAnnually: 89,
      savingsBadge: 'Save $120/year',
      credits: '100,000 credits/month',
      isCurrent: currentTier === 'builder',
      popular: true,
      features: [
        { label: 'Agent Spaces : Unlimited', included: true },
        { label: 'Knowledge Bases : 10', included: true },
        { label: 'Storage : 1GB', included: true },
        { label: 'Brand Agents : 3 per project', included: true },
        { label: 'Team Members : 2 teammates', included: true },
        { label: 'Sketric Connectors', included: true, tooltip: 'Connect agents with Slack, WhatsApp, Instagram, Telegram & Zapier.' },
        { label: 'API Access', included: true },
        { label: 'Integrations', included: true, hasInfo: true },
      ],
    },
    {
      id: 'scale',
      name: 'Scale',
      description: 'Scale plan for scaling your AI workflows',
      priceMonthly: 249,
      priceAnnually: 224,
      savingsBadge: 'Save $300/year',
      credits: '300,000 credits/month',
      isCurrent: currentTier === 'scale',
      popular: false,
      features: [
        { label: 'Agent Spaces : Unlimited', included: true },
        { label: 'Knowledge Bases : 25', included: true },
        { label: 'Storage : 5GB', included: true },
        { label: 'Brand Agents : 3 per project', included: true },
        { label: 'Team Members : 4 teammates', included: true },
        { label: 'Sketric Connectors', included: true },
        { label: 'API Access', included: true },
        { label: 'Integrations', included: true, hasInfo: true },
      ],
    },
  ];

  const FAQS = [
    {
      q: 'How do monthly credits work?',
      a: 'Monthly credits represent AI computational units used during visitor queries, document vector ingestion, and autonomous tool executions. Each conversation turn consumes credits based on model depth (e.g. Mistral, Claude, Gemini). Your credit balance automatically replenishes on the 1st day of each billing cycle.',
    },
    {
      q: 'Do unused credits roll over to the next month?',
      a: 'Standard plan monthly allowance credits refresh each month and do not accumulate indefinitely. However, any separate on-demand top-up credit packs you purchase never expire and will always remain in your account until used.',
    },
    {
      q: 'What are Knowledge Bases (KBs)?',
      a: 'Knowledge Bases are high-speed semantic vector vaults where your brand documentation (PDFs, Word docs, CSVs, Notion pages, and live website crawls) are parsed, chunked, and embedded into Supabase pgvector so your bots answer customer queries with 100% factual accuracy.',
    },
    {
      q: 'What is the "Website Embed Code"?',
      a: 'It is a lightweight single-line JavaScript tag provided in your Studio Deploy tab. You simply paste it before the closing </body> tag of any HTML, Webflow, Shopify, WordPress, or React website to immediately launch your floating chat widget or pill launcher.',
    },
    {
      q: 'What are Code Interpreter and Web Search?',
      a: 'Code Interpreter executes secure, sandboxed code in real time for math calculations and dataset processing. Web Search allows your agent to fetch live, real-time web results before formulating responses for dynamic information like current pricing or news.',
    },
    {
      q: 'Can I cancel or switch plans at any time?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from this page. If you upgrade, the new tier and credit allowance activate immediately with prorated billing.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express), Apple Pay, Google Pay, and SEPA/ACH bank transfers for annual enterprise plans.',
    },
    {
      q: 'How do custom Enterprise deployments work?',
      a: 'Enterprise plans include dedicated VPC or on-premise cloud infrastructure on AWS, custom data retention policies, single sign-on (SAML/Okta), HIPAA/SOC2 compliance agreements, and a dedicated Solutions Engineer.',
    },
  ];

  const visibleFaqs = showAllFaqs ? FAQS : FAQS.slice(0, 5);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setIsCheckoutProcessing(true);
    setTimeout(() => {
      setIsCheckoutProcessing(false);
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setCheckoutPlan(null);
      }, 2200);
    }, 1500);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setIsContactSalesOpen(false);
      setContactForm({ name: '', email: '', company: '', teamSize: '10-50', message: '' });
    }, 2000);
  };

  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      backgroundColor: colors.pageBg,
      color: colors.titleColor,
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    }}>
      {/* Scrollable Canvas */}
      <div style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Floating Theme Toggle (Top Right) */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '2.5rem',
          zIndex: 20,
        }}>
          <button
            onClick={handleToggleTheme}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              color: colors.titleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* Content Container */}
        <div style={{
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 2rem 5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2.35rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 0.4rem 0',
              color: colors.titleColor,
            }}>
              Manage Subscription
            </h1>
            <p style={{
              fontSize: '0.86rem',
              color: colors.subtitleColor,
              margin: '0 0 0.35rem 0',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              flexWrap: 'wrap',
            }}>
              <span>Billing for teamspace <strong style={{ color: colors.titleColor }}>{teamspaceName}</strong></span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#d1fae5',
                color: isDark ? '#34d399' : '#059669',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
              }}>
                Current: {currentTier}
              </span>
            </p>
            <p style={{
              fontSize: '0.94rem',
              color: colors.textMuted,
              margin: 0,
            }}>
              Choose the perfect plan for your needs.
            </p>

            {/* ── Monthly / Annually Pill Toggle ── */}
            <div style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.85rem',
              userSelect: 'none',
            }}>
              <span style={{
                fontSize: '0.88rem',
                fontWeight: !isAnnually ? 700 : 500,
                color: !isAnnually ? colors.titleColor : colors.textMuted,
                cursor: 'pointer',
              }} onClick={() => setBillingCycle('monthly')}>
                Monthly
              </span>

              {/* Custom Switch Track */}
              <div
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annually' : 'monthly')}
                style={{
                  width: '46px',
                  height: '24px',
                  borderRadius: '9999px',
                  backgroundColor: isAnnually ? colors.primaryPurple : (isDark ? '#2e3040' : '#cbd5e1'),
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.25s ease',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transform: isAnnually ? 'translateX(22px)' : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>

              <span style={{
                fontSize: '0.88rem',
                fontWeight: isAnnually ? 700 : 500,
                color: isAnnually ? colors.titleColor : colors.textMuted,
                cursor: 'pointer',
              }} onClick={() => setBillingCycle('annually')}>
                Annually
              </span>

              {/* Save 10% Badge */}
              <span style={{
                backgroundColor: colors.greenBadgeBg,
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                letterSpacing: '0.02em',
              }}>
                Save 10%
              </span>
            </div>
          </div>

          {/* ── 4 Main Pricing Cards Grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
            gap: '1.25rem',
            width: '100%',
            marginBottom: '2rem',
          }}>
            {PLANS.map((plan) => {
              const activePrice = isAnnually ? plan.priceAnnually : plan.priceMonthly;
              const TIER_RANKS = { free: 0, explorer: 1, builder: 2, scale: 3 };
              const currentRank = TIER_RANKS[currentTier] ?? 0;
              const planRank = TIER_RANKS[plan.id] ?? 0;
              const isCurrent = plan.isCurrent;
              const isLower = planRank < currentRank;

              let buttonText = isAnnually ? 'Get Yearly' : 'Get Monthly';
              if (isCurrent) {
                buttonText = '✓ Current Plan';
              } else if (isLower) {
                buttonText = 'Included in your plan';
              }

              return (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: '16px',
                    border: plan.popular
                      ? `2px solid ${colors.popularBorder}`
                      : `1px solid ${colors.cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: plan.popular
                      ? (isDark ? '0 12px 36px rgba(99, 102, 241, 0.25)' : '0 12px 30px rgba(99, 102, 241, 0.12)')
                      : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'),
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Popular Banner */}
                  {plan.popular && (
                    <div style={{
                      backgroundColor: colors.popularBanner,
                      color: '#ffffff',
                      textAlign: 'center',
                      padding: '0.3rem 0',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}>
                      <span>★ Most Popular</span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Plan Name */}
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: colors.titleColor,
                      margin: '0 0 0.35rem 0',
                    }}>
                      {plan.name}
                    </h3>

                    {/* Plan Description */}
                    <p style={{
                      fontSize: '0.76rem',
                      color: colors.subtitleColor,
                      margin: '0 0 1rem 0',
                      lineHeight: 1.4,
                      minHeight: '2.4em',
                    }}>
                      {plan.description}
                    </p>

                    {/* Price Row */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.85rem' }}>
                      <span style={{
                        fontSize: '2.1rem',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        color: plan.popular ? (isDark ? '#a5b4fc' : '#4f46e5') : colors.titleColor,
                      }}>
                        ${activePrice}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: colors.textMuted }}>
                        /month
                      </span>

                      {/* Yearly Savings Badge */}
                      {isAnnually && plan.savingsBadge && (
                        <span style={{
                          marginLeft: 'auto',
                          backgroundColor: colors.savingsPillBg,
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                        }}>
                          {plan.savingsBadge}
                        </span>
                      )}
                    </div>

                    {/* Credits Allowance Bar */}
                    <div style={{
                      backgroundColor: colors.creditBarBg,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '8px',
                      padding: '0.45rem 0.6rem',
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: colors.titleColor,
                      marginBottom: '1.35rem',
                    }}>
                      {plan.credits}
                    </div>

                    {/* Features Checklist Header */}
                    <div style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: colors.titleColor,
                      marginBottom: '0.75rem',
                    }}>
                      What's included:
                    </div>

                    {/* Features List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, marginBottom: '1.5rem' }}>
                      {plan.features.map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            fontSize: '0.76rem',
                            lineHeight: 1.35,
                            position: 'relative',
                          }}
                        >
                          {/* Status Icon */}
                          {feat.included ? (
                            <Check size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          ) : feat.warning ? (
                            <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                          ) : (
                            <X size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                          )}

                          {/* Label */}
                          <span style={{
                            color: feat.included ? colors.featureText : colors.featureMuted,
                            flex: 1,
                          }}>
                            {feat.label}
                          </span>

                          {/* Info Tooltip Hover */}
                          {feat.hasInfo && (
                            <div
                              style={{ cursor: 'pointer', position: 'relative' }}
                              onMouseEnter={() => setHoveredTooltip(`${plan.id}-${idx}`)}
                              onMouseLeave={() => setHoveredTooltip(null)}
                            >
                              <Info size={12} color={colors.textMuted} />
                              {hoveredTooltip === `${plan.id}-${idx}` && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  right: 0,
                                  marginBottom: '6px',
                                  backgroundColor: isDark ? '#1e1f2b' : '#0f172a',
                                  color: '#ffffff',
                                  fontSize: '0.68rem',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                                  whiteSpace: 'nowrap',
                                  zIndex: 30,
                                }}>
                                  Connect agents with Slack, WhatsApp, Instagram, Telegram & Zapier.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={isCurrent || isLower}
                      title={isLower ? `Your current ${currentTier.toUpperCase()} plan already includes all features in this tier.` : undefined}
                      onClick={() => !isCurrent && !isLower && navigate(`/app/pricing/checkout?plan=${plan.id}&cycle=${billingCycle}`)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        border: isLower ? `1px solid ${colors.cardBorder}` : 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: isCurrent ? 'default' : (isLower ? 'not-allowed' : 'pointer'),
                        backgroundColor: isCurrent
                          ? (isDark ? '#059669' : '#34d399')
                          : (isLower
                              ? (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9')
                              : (plan.popular ? colors.primaryPurple : colors.buttonGrayBg)),
                        color: isCurrent
                          ? '#ffffff'
                          : (isLower
                              ? colors.textMuted
                              : (plan.popular ? '#ffffff' : colors.buttonGrayText)),
                        opacity: isLower ? 0.75 : 1,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isCurrent && !isLower) {
                          e.currentTarget.style.backgroundColor = plan.popular ? colors.primaryPurpleHover : colors.buttonGrayHover;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isCurrent && !isLower) {
                          e.currentTarget.style.backgroundColor = plan.popular ? colors.primaryPurple : colors.buttonGrayBg;
                        }
                      }}
                    >
                      {buttonText}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Enterprise Card (Centered Below) ── */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
            marginBottom: '2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primaryPurple,
              }}>
                <Building2 size={18} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: colors.titleColor }}>
                Enterprise
              </h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: colors.subtitleColor, margin: 0, maxWidth: '420px', lineHeight: 1.4 }}>
              Custom solutions for large teams and organizations with specific needs
            </p>

            <button
              onClick={() => setIsContactSalesOpen(true)}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                maxWidth: '380px',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                backgroundColor: colors.primaryPurple,
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.primaryPurpleHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.primaryPurple}
            >
              Contact Sales
            </button>
          </div>

          {/* ── View Detailed Plan Comparison Accordion Bar ── */}
          <div style={{ width: '100%', maxWidth: '880px', marginBottom: '3.5rem' }}>
            <button
              onClick={() => setIsComparisonOpen(prev => !prev)}
              style={{
                width: '100%',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: isComparisonOpen ? '12px 12px 0 0' : '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: colors.titleColor,
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>View Detailed Plan Comparison</span>
              <ChevronDown size={16} style={{
                color: colors.subtitleColor,
                transform: isComparisonOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s ease',
              }} />
            </button>

            {/* Comparison Matrix Body */}
            {isComparisonOpen && (
              <div style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '1.5rem',
                overflowX: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.subtitleColor, fontWeight: 700 }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: colors.titleColor, fontWeight: 700 }}>Free</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: colors.titleColor, fontWeight: 700 }}>Explorer</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: colors.primaryPurple, fontWeight: 800 }}>Builder</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: colors.titleColor, fontWeight: 700 }}>Scale</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: colors.titleColor, fontWeight: 700 }}>Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'Monthly AI Credits', free: '2,000', exp: '12,000', bld: '100,000', scl: '300,000', ent: 'Custom (1M+)' },
                      { f: 'Knowledge Bases', free: '1', exp: '3', bld: '10', scl: '25', ent: 'Unlimited' },
                      { f: 'Document Storage', free: '50MB', exp: '250MB', bld: '1GB', scl: '5GB', ent: 'Dedicated 50GB+' },
                      { f: 'Team Seats', free: '1', exp: '1', bld: '2', scl: '4', ent: 'Unlimited' },
                      { f: 'Custom Brand Styling', free: 'Basic', exp: 'Full', bld: 'Full + White-label', scl: 'Full + White-label', ent: 'Custom Domain' },
                      { f: 'Model Selection (Mistral / Gemini / Claude)', free: 'Mistral Tiny', exp: 'Mistral + Gemini', bld: 'All Models', scl: 'All Models', ent: 'Dedicated Endpoints' },
                      { f: 'Omni-Channel (WhatsApp / Slack / Zapier)', free: '—', exp: 'Yes', bld: 'Yes', scl: 'Yes', ent: 'Custom Webhooks' },
                      { f: 'Support SLA', free: 'Community', exp: 'Standard', bld: 'Priority Email', scl: 'Priority 24/7', ent: 'Dedicated Slack' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: colors.titleColor }}>{row.f}</td>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.75rem', color: colors.subtitleColor }}>{row.free}</td>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.75rem', color: colors.subtitleColor }}>{row.exp}</td>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.75rem', fontWeight: 700, color: colors.primaryPurple }}>{row.bld}</td>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.75rem', color: colors.subtitleColor }}>{row.scl}</td>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.75rem', fontWeight: 600, color: colors.titleColor }}>{row.ent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Frequently Asked Questions (FAQ) ── */}
          <div style={{
            width: '100%',
            maxWidth: '620px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Title with Underline */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                margin: '0 0 0.4rem 0',
                color: colors.titleColor,
              }}>
                Frequently Asked <span style={{ color: colors.primaryPurple }}>Questions</span>
              </h2>
              <div style={{
                width: '42px',
                height: '3px',
                backgroundColor: colors.primaryPurple,
                borderRadius: '2px',
                margin: '0 auto 0.65rem auto',
              }} />
              <p style={{ fontSize: '0.84rem', color: colors.subtitleColor, margin: 0 }}>
                Get answers to common questions about our pricing and features
              </p>
            </div>

            {/* Accordion Container */}
            <div style={{
              width: '100%',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              marginBottom: '1.25rem',
            }}>
              {visibleFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      borderBottom: idx === visibleFaqs.length - 1 ? 'none' : `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <div
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: colors.titleColor,
                        userSelect: 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.creditBarBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={15} style={{
                        color: colors.subtitleColor,
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '0.5rem',
                      }} />
                    </div>

                    {isOpen && (
                      <div style={{
                        padding: '0 1.25rem 1rem 1.25rem',
                        fontSize: '0.78rem',
                        color: colors.subtitleColor,
                        lineHeight: 1.55,
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show All FAQs Button */}
            <button
              onClick={() => setShowAllFaqs(prev => !prev)}
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '8px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: colors.titleColor,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              {showAllFaqs ? 'Show Fewer FAQs' : 'Show All FAQs'}
            </button>
          </div>

        </div>
      </div>

      {/* ── Interactive Checkout Upgrade Modal ── */}
      {checkoutPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              onClick={() => setCheckoutPlan(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: colors.subtitleColor,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {checkoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}>
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: colors.titleColor }}>
                  Upgrade Successful!
                </h3>
                <p style={{ fontSize: '0.86rem', color: colors.subtitleColor, margin: 0 }}>
                  Your teamspace is now on the <strong>{checkoutPlan.name}</strong> plan with {checkoutPlan.credits}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={18} color={colors.primaryPurple} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: colors.titleColor }}>
                    Upgrade to {checkoutPlan.name}
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: colors.subtitleColor, margin: '0 0 1.5rem 0' }}>
                  Confirm your subscription details below to unlock higher limits.
                </p>

                {/* Plan Summary Box */}
                <div style={{
                  backgroundColor: colors.creditBarBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: colors.subtitleColor }}>Billing Cycle:</span>
                    <strong style={{ color: colors.titleColor, textTransform: 'capitalize' }}>{billingCycle}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: colors.subtitleColor }}>Allowance:</span>
                    <strong style={{ color: colors.titleColor }}>{checkoutPlan.credits}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontWeight: 700, color: colors.titleColor }}>Total Due Today:</span>
                    <strong style={{ color: colors.primaryPurple }}>
                      ${isAnnually ? checkoutPlan.priceAnnually * 12 : checkoutPlan.priceMonthly}
                    </strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCheckoutProcessing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    backgroundColor: colors.primaryPurple,
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: isCheckoutProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {isCheckoutProcessing ? (
                    <span>Processing payment...</span>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      <span>Confirm & Activate Subscription</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Enterprise Contact Sales Modal ── */}
      {isContactSalesOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              onClick={() => setIsContactSalesOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: colors.subtitleColor,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {contactSent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}>
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: colors.titleColor }}>
                  Inquiry Received!
                </h3>
                <p style={{ fontSize: '0.86rem', color: colors.subtitleColor, margin: 0 }}>
                  A solutions engineer will reach out to you within 2 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Building2 size={20} color={colors.primaryPurple} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: colors.titleColor }}>
                    Contact Enterprise Sales
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: colors.subtitleColor, margin: '0 0 1.25rem 0' }}>
                  Talk to our enterprise architects about custom volume, SLAs, and dedicated cloud hosting.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: colors.titleColor, marginBottom: '0.3rem' }}>Your Name</label>
                    <input
                      required
                      type="text"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Jane Doe"
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: colors.creditBarBg,
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '8px',
                        padding: '0 0.75rem',
                        fontSize: '0.82rem',
                        color: colors.titleColor,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: colors.titleColor, marginBottom: '0.3rem' }}>Work Email</label>
                    <input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="jane@company.com"
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: colors.creditBarBg,
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '8px',
                        padding: '0 0.75rem',
                        fontSize: '0.82rem',
                        color: colors.titleColor,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: colors.titleColor, marginBottom: '0.3rem' }}>Team / Organization Size</label>
                    <select
                      value={contactForm.teamSize}
                      onChange={e => setContactForm({ ...contactForm, teamSize: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: colors.creditBarBg,
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '8px',
                        padding: '0 0.75rem',
                        fontSize: '0.82rem',
                        color: colors.titleColor,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="1-10">1 - 10 employees</option>
                      <option value="10-50">10 - 50 employees</option>
                      <option value="50-250">50 - 250 employees</option>
                      <option value="250+">250+ enterprise</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    backgroundColor: colors.primaryPurple,
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Send size={15} />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
