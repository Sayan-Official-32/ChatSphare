/**
 * @file LandingPage.jsx
 * @description Public Product Marketing Landing Page Component.
 * 
 * Features:
 * 1. Top navigation bar with persistent global authentication state checks.
 * 2. Two-column hero with enterprise typography & live product visualization.
 * 3. Browser preview window & realistic AI chat widget mockup.
 * 4. Rotating animated URL placeholder typewriter effect.
 * 5. Client-side URL validation & instant session storage pre-fill.
 * 6. Dual Tab selection ('Brand Agents' vs 'AI Workforce').
 * 7. Integrated authentication modal for unauthenticated agent creation triggers.
 * 8. Ecosystem compatibility strip.
 * 9. Enterprise feature cards grid.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  BookOpen,
  Sparkles,
  Users,
  Send,
  Check,
  Zap,
  Globe,
  Palette,
  ShieldCheck,
  ArrowRight,
  Link2,
  Lock,
  Clock,
  Box,
  X,
  Minus,
  AlertCircle,
  Paperclip,
  Mic,
  HelpCircle,
  CreditCard,
  Database,
  FileText,
  Tag,
  Rocket,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import AuthModal from '@/features/auth/AuthModal';
import { useAuth } from '@/lib/AuthContext';
import chatSphareLogo from '@/assets/chatsphare_logo.png';
import './LandingPage.css';

/**
 * Public Landing Page Component.
 * 
 * @returns {JSX.Element} Landing page JSX element.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  // Read global auth context state (persists across back-navigation)
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('brand');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor window scroll to adjust header glassmorphism density
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rotatingPlaceholders = ['your website', 'any url', 'business site', 'store link'];

  // Rotating typewriter animation effect
  useEffect(() => {
    const currentPlaceholder = rotatingPlaceholders[placeholderIndex];
    let timeoutId;

    if (isDeleting) {
      if (displayText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayText(currentPlaceholder.substring(0, displayText.length - 1));
        }, 40);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((current) => (current + 1) % rotatingPlaceholders.length);
      }
    } else {
      if (displayText.length < currentPlaceholder.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(currentPlaceholder.substring(0, displayText.length + 1));
        }, 60);
      } else {
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, 1200);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isDeleting, placeholderIndex]);

  /**
   * Validates target website URL.
   * 
   * @param {string} value - Entered URL text string.
   * @returns {{ isValid: boolean, normalised: string }} Validation result object.
   */
  const validateUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return { isValid: true, normalised: '' };

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(withProtocol);
      if (!parsed.hostname.includes('.')) return { isValid: false, normalised: withProtocol };
      return { isValid: true, normalised: withProtocol };
    } catch {
      return { isValid: false, normalised: withProtocol };
    }
  };

  /**
   * Validates target URL, opens Auth modal if unauthenticated, or navigates to wizard.
   * 
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!user) {
      if (trimmed) {
        const { isValid } = validateUrl(trimmed);
        if (!isValid) {
          setUrlError('Please enter a valid website URL (e.g. example.com).');
          return;
        }
      }
      setPendingAction('create');
      setShowAuth(true);
      return;
    }

    if (!trimmed) {
      setUrlError('');
      navigate('/app/brand-agent/new');
      return;
    }

    const { isValid, normalised } = validateUrl(trimmed);
    if (!isValid) {
      setUrlError('Please enter a valid website URL (e.g. example.com).');
      return;
    }

    sessionStorage.setItem('chatsphare_initial_url', normalised);
    sessionStorage.setItem('chatsphare_agent_type', activeTab);
    setUrlError('');
    navigate('/app/brand-agent/new');
  };

  /** Auth modal callback handler */
  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (pendingAction === 'create') {
      let trimmed = url.trim();
      if (!trimmed) {
        navigate('/app/brand-agent/new');
        return;
      }
      if (!/^https?:\/\//i.test(trimmed)) trimmed = 'https://' + trimmed;
      sessionStorage.setItem('chatsphare_initial_url', trimmed);
      sessionStorage.setItem('chatsphare_agent_type', activeTab);
      navigate('/app/brand-agent/new');
    } else if (pendingAction === 'dashboard') {
      navigate('/app/brand-agent/new');
    }
  };

  return (
    <div className="cb-landing-page">
      {/* Ambient Grid Background */}
      <div className="cb-landing-bg-grid" />

      {/* Restrained Indigo Spotlight */}
      <div className="cb-ambient-spotlight" />

      {/* Top Header / Sticky Navbar (Glassmorphism) */}
      <header className={`cb-header ${isScrolled ? 'cb-header-scrolled' : ''}`}>
        <nav className="cb-nav" aria-label="Main Navigation">
          {/* Logo & Brand (Interactive) */}
          <div
            className="cb-nav-brand"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
            aria-label="ChatSphare Home"
          >
            <img
              src={chatSphareLogo}
              alt="ChatSphare Logo"
              className="cb-nav-logo"
            />
            <span className="cb-nav-brand-text">ChatSphare</span>
          </div>

          {/* Center Links (Interactive - Hover allowed) */}
          <div className="cb-nav-links">
            <a href="/" className="cb-nav-link-active">
              Home
            </a>
            <a href="#features" className="cb-nav-link">
              Features
            </a>
            <a href="#pricing" className="cb-nav-link" onClick={(e) => { e.preventDefault(); navigate('/app/coming-soon'); }}>
              Pricing
            </a>
            <a href="#docs" className="cb-nav-link" onClick={(e) => { e.preventDefault(); navigate('/app/docs'); }}>
              Docs
            </a>
            <a href="#enterprise" className="cb-nav-link" onClick={(e) => { e.preventDefault(); navigate('/app/coming-soon'); }}>
              Enterprise
            </a>
          </div>

          {/* Action Buttons (Interactive - Hover allowed) */}
          <div className="cb-nav-actions">
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="cb-nav-btn-ghost"
                type="button"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => {
                if (!user) {
                  setPendingAction('dashboard');
                  setShowAuth(true);
                } else {
                  navigate('/app/brand-agent/new');
                }
              }}
              className="cb-nav-cta-btn"
              type="button"
            >
              Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="cb-hero-main">

        {/* ─── Two-Column Hero Split ─── */}
        <div className="cb-hero-split">

          {/* Left Column: Headline, Tabs & Input */}
          <div className="cb-hero-left">

            {/* Informational Announcement Badge (Strictly NO Hover) */}
            <div className="cb-announcement-badge">
              <span className="cb-announcement-dot" />
              <span className="cb-announcement-text">
                ENTERPRISE AI AGENT PLATFORM
              </span>
            </div>

            {/* Hero Headline */}
            <h1 className="cb-hero-heading">
              {activeTab === 'brand' ? (
                <>
                  Turn your website<br />
                  into an <span className="cb-gradient-text">AI Agent</span>
                </>
              ) : (
                <>
                  Automate your ops<br />
                  with an <span className="cb-gradient-text">AI Workforce</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="cb-hero-subtitle">
              {activeTab === 'brand'
                ? 'ChatSphare indexes your documentation, extracts brand styling, and deploys a production-ready AI agent to your website in minutes.'
                : 'Connect your tools. AI Workforce automates CRM syncing, lead enrichment, document processing, and internal operational pipelines.'}
            </p>

            {/* Tab Switcher (Interactive Tabs - Hover allowed) */}
            <div className="cb-tab-switcher" role="tablist" aria-label="Agent Type Selection">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'brand'}
                onClick={() => setActiveTab('brand')}
                className={`cb-tab-btn ${activeTab === 'brand' ? 'cb-tab-btn-active' : ''}`}
              >
                <Bot size={15} color={activeTab === 'brand' ? '#ffffff' : 'var(--cb-text-secondary)'} />
                Brand Agents
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'workforce'}
                onClick={() => setActiveTab('workforce')}
                className={`cb-tab-btn ${activeTab === 'workforce' ? 'cb-tab-btn-active' : ''}`}
              >
                <Users size={15} color={activeTab === 'workforce' ? '#ffffff' : 'var(--cb-text-secondary)'} />
                AI Workforce
              </button>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleCreateAgent} className="cb-hero-form">
              <div className={`cb-url-input-container ${urlError ? 'cb-url-input-container-error' : ''}`}>
                <Link2 size={17} className="cb-url-input-icon" />

                <div className="cb-url-input-wrap">
                  <input
                    type="text"
                    value={url}
                    aria-label="Enter your website URL"
                    onChange={e => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    onFocus={() => setIsUrlFocused(true)}
                    onBlur={() => {
                      setIsUrlFocused(false);
                      if (url.trim()) {
                        const { isValid } = validateUrl(url);
                        if (!isValid) setUrlError('Please enter a valid website URL (e.g. example.com).');
                      }
                    }}
                    placeholder=""
                    className="cb-url-input"
                  />

                  {/* Typewriter placeholder: visible while input is empty, including when focused */}
                  {url.trim().length === 0 && (
                    <div className="cb-typewriter-wrap" aria-hidden="true">
                      <span className="cb-typewriter-prefix">Enter website URL (e.g.</span>
                      <span className="cb-typewriter-keyword">
                        {displayText || 'your website'}
                      </span>
                      <span className="cb-typewriter-prefix">)</span>
                      <span className="cb-typewriter-cursor">|</span>
                    </div>
                  )}
                </div>

                {/* Create Agent CTA Button (Interactive - Hover allowed) */}
                <button
                  type="submit"
                  className="cb-hero-submit-btn"
                >
                  Create Agent <ArrowRight size={14} />
                </button>
              </div>

              {/* Validation alert drawer */}
              <div
                className="cb-url-error-drawer"
                style={{
                  maxHeight: urlError ? '60px' : '0',
                  opacity: urlError ? 1 : 0,
                }}
              >
                <div className="cb-url-error-box">
                  <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0 }} />
                  <span className="cb-url-error-text">
                    {urlError}
                  </span>
                </div>
              </div>
            </form>

            {/* Micro-copy below input (Informational - Strictly NO hover) */}
            <p className="cb-hero-microcopy">
              No credit card required • Free tier available • Setup in under 2 minutes
            </p>

            {/* Trust Badges Row (Informational - Strictly NO hover) */}
            <div className="cb-proof-pills">
              <span className="cb-proof-pill">
                <Zap size={13} className="cb-proof-icon" /> Live in 2 minutes
              </span>
              <span className="cb-proof-pill">
                <Box size={13} className="cb-proof-icon" /> Auto-branded widget
              </span>
              <span className="cb-proof-pill">
                <Check size={13} strokeWidth={2.5} className="cb-proof-icon" /> Trained on your content
              </span>
              <span className="cb-proof-pill">
                <ShieldCheck size={13} className="cb-proof-icon" /> Enterprise AI security
              </span>
            </div>

          </div>

          {/* Right Column: Product Visualization / Demo Stage (DECORATIVE MOCKUP: STRICTLY NO HOVER) */}
          <div className="cb-hero-right">
            <div className="cb-demo-stage">

              {/* Volumetric Radial Glow Behind Mockup */}
              <div className="cb-demo-volumetric-glow" />

              {/* Top Right Callout Annotation */}
              <div className="cb-annotation-top" aria-hidden="true">
                <svg className="cb-annotation-svg-curve" width="44" height="48" viewBox="0 0 44 48" fill="none">
                  <path d="M 38 8 C 22 10, 10 22, 8 38" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 3 30 L 8 38 L 16 33" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="cb-annotation-text-top">
                  <span>Your website</span>
                  <span className="cb-annotation-arrow-symbol">→</span>
                  <span>Knowledge</span>
                  <span className="cb-annotation-arrow-symbol">→</span>
                  <span>AI Agent</span>
                </div>
              </div>

              {/* Layered 3D Tilted Backplate Window */}
              <div className="cb-demo-backplate" aria-hidden="true">
                <div className="cb-browser-titlebar">
                  <div className="cb-browser-dots">
                    <span className="cb-browser-dot cb-browser-dot-close" />
                    <span className="cb-browser-dot cb-browser-dot-min" />
                    <span className="cb-browser-dot cb-browser-dot-max" />
                  </div>
                </div>
              </div>

              {/* Realistic Browser Window (Light Mode Website Content) */}
              <div className="cb-browser-window">
                {/* Titlebar */}
                <div className="cb-browser-titlebar">
                  <div className="cb-browser-dots">
                    <span className="cb-browser-dot cb-browser-dot-close" />
                    <span className="cb-browser-dot cb-browser-dot-min" />
                    <span className="cb-browser-dot cb-browser-dot-max" />
                  </div>
                  <div className="cb-browser-urlbar">
                    <Lock size={10} color="#64748B" />
                    <span>yourwebsite.com</span>
                  </div>
                </div>

                {/* Browser Content Body (Clean High-Contrast White Website) */}
                <div className="cb-browser-content-light">
                  {/* Mock Site Nav */}
                  <div className="cb-mock-site-nav-light">
                    <div className="cb-mock-site-brand-light">
                      <div className="cb-mock-site-brand-badge">
                        <span>r</span>
                      </div>
                      <span>Your Business</span>
                    </div>
                    <div className="cb-mock-site-links-light">
                      <span>Home</span>
                      <span>Products</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>

                  {/* Mock Site Hero */}
                  <div className="cb-mock-site-hero-light">
                    <div className="cb-mock-site-text-col">
                      <h3 className="cb-mock-site-headline-light">
                        Innovative<br />
                        Solutions for<br />
                        a Better Tomorrow
                      </h3>
                      <div className="cb-mock-skeleton-line-light" style={{ width: '85%' }} />
                      <div className="cb-mock-skeleton-line-light" style={{ width: '65%' }} />
                      <div className="cb-mock-skeleton-line-light" style={{ width: '75%' }} />
                    </div>

                    {/* Skyscraper / Modern Architecture Graphic */}
                    <div className="cb-mock-arch-graphic" aria-hidden="true">
                      <svg viewBox="0 0 160 210" width="100%" height="100%" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="45%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1E293B" />
                          </linearGradient>
                          <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
                          </linearGradient>
                        </defs>
                        <rect width="160" height="210" fill="url(#skyGrad)" />
                        <line x1="26" y1="0" x2="26" y2="210" stroke="#0F172A" strokeWidth="2.5" />
                        <line x1="56" y1="0" x2="56" y2="210" stroke="#0F172A" strokeWidth="3" />
                        <line x1="90" y1="0" x2="90" y2="210" stroke="#0F172A" strokeWidth="3.5" />
                        <line x1="126" y1="0" x2="126" y2="210" stroke="#0F172A" strokeWidth="4" />
                        {[22, 46, 72, 100, 130, 162, 192].map((y, i) => (
                          <line key={i} x1="0" y1={y} x2="160" y2={y + 8} stroke="#0F172A" strokeWidth="2" />
                        ))}
                        <rect width="160" height="210" fill="url(#glassReflect)" />
                        <polygon points="126,0 160,0 160,210 126,210" fill="rgba(15,23,42,0.65)" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge ("Deployed in under 2 minutes") on Bottom Left */}
              <div className="cb-mock-deployed-pill" aria-label="Deployed in under 2 minutes">
                <div className="cb-deployed-clock-circle">
                  <Clock size={16} color="#38BDF8" />
                </div>
                <div className="cb-deployed-text-group">
                  <span className="cb-deployed-sub">Deployed in</span>
                  <span className="cb-deployed-main">under 2 minutes</span>
                </div>
              </div>

              {/* Floating AI Chat Widget on Right (100% Faithful to Reference Mockup - Compressed Slim Edition) */}
              <div className="cb-demo-widget" aria-label="Total Chatbot Preview">
                {/* Neon Curved Outer Ambient Accent Line */}
                <div className="cb-widget-neon-accent" aria-hidden="true" />

                {/* 1. Header with Glowing Robot Avatar, Titles & LIVE AGENT */}
                <div className="cb-widget-header">
                  <div className="cb-widget-header-left">
                    <div className="cb-widget-avatar-halo">
                      <div className="cb-widget-avatar-inner">
                        {/* Custom White Robot Face */}
                        <svg className="cb-widget-robot-face" width="17" height="17" viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="2" x2="12" y2="6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="2" r="1.5" fill="#FFFFFF" />
                          <rect x="3.5" y="6" width="17" height="13" rx="4" fill="#FFFFFF" />
                          <rect x="1.5" y="9.5" width="2" height="5" rx="1" fill="#FFFFFF" />
                          <rect x="20.5" y="9.5" width="2" height="5" rx="1" fill="#FFFFFF" />
                          <circle cx="8.5" cy="11.5" r="1.5" fill="#0F172A" />
                          <circle cx="15.5" cy="11.5" r="1.5" fill="#0F172A" />
                          <path d="M9 14.5 Q12 16.5 15 14.5" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </div>
                    </div>

                    <div className="cb-widget-title-col">
                      <h4 className="cb-widget-title-text">Total Chatbot</h4>
                      <div className="cb-widget-status-row">
                        <span className="cb-widget-status-dot" />
                        <span className="cb-widget-status-text">Online • Trained</span>
                      </div>
                    </div>
                  </div>

                  <div className="cb-widget-header-right">
                    <div className="cb-widget-live-badge">
                      <span className="cb-live-pulse-dot" />
                      <span>LIVE</span>
                    </div>
                  </div>
                </div>

                {/* 2. Top 2 Metrics / Intelligence Cards Row (Streamlined) */}
                <div className="cb-widget-stats-strip" aria-hidden="true">
                  <div className="cb-widget-stat-card">
                    <div className="cb-stat-card-icon">
                      <BookOpen size={11} color="#60A5FA" />
                    </div>
                    <div className="cb-stat-card-text">
                      <span className="cb-stat-card-title">Knowledge base</span>
                      <span className="cb-stat-card-sub">Synced</span>
                    </div>
                  </div>

                  <div className="cb-widget-stat-card">
                    <div className="cb-stat-card-icon">
                      <Database size={11} color="#818CF8" />
                    </div>
                    <div className="cb-stat-card-text">
                      <span className="cb-stat-card-title">12 sources</span>
                      <span className="cb-stat-card-sub">Indexed</span>
                    </div>
                  </div>
                </div>

                {/* 3. Conversation Message Card with Mini Bot Avatar */}
                <div className="cb-widget-msg-section">
                  <div className="cb-widget-msg-row">
                    <div className="cb-msg-avatar-mini" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="2" x2="12" y2="6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="2" r="1.5" fill="#FFFFFF" />
                        <rect x="3.5" y="6" width="17" height="13" rx="4" fill="#FFFFFF" />
                        <rect x="1.5" y="9.5" width="2" height="5" rx="1" fill="#FFFFFF" />
                        <rect x="20.5" y="9.5" width="2" height="5" rx="1" fill="#FFFFFF" />
                        <circle cx="8.5" cy="11.5" r="1.5" fill="#0F172A" />
                        <circle cx="15.5" cy="11.5" r="1.5" fill="#0F172A" />
                        <path d="M9 14.5 Q12 16.5 15 14.5" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>

                    <div className="cb-msg-bubble">
                      <div className="cb-msg-heading">Hello! 👋</div>
                      <p className="cb-msg-para">I'm Total Chatbot. How can I help you today?</p>
                    </div>
                  </div>
                  <div className="cb-msg-timestamp">Just now</div>
                </div>

                {/* 4. Streamlined Suggestion Questions */}
                <div className="cb-widget-chips-stack">
                  <div className="cb-grid-question-card">
                    <div className="cb-grid-card-left">
                      <FileText size={11} className="cb-grid-card-icon" />
                      <span className="cb-grid-card-label">Tell me about your services</span>
                    </div>
                    <ChevronRight size={10} className="cb-grid-card-chevron" />
                  </div>

                  <div className="cb-grid-question-card">
                    <div className="cb-grid-card-left">
                      <Tag size={11} className="cb-grid-card-icon" />
                      <span className="cb-grid-card-label">What are your pricing plans?</span>
                    </div>
                    <ChevronRight size={10} className="cb-grid-card-chevron" />
                  </div>
                </div>

                {/* 5. Thinking / Ready Indicator Line */}
                <div className="cb-widget-ready-indicator" aria-hidden="true">
                  <div className="cb-ready-dots-pill">
                    <span className="cb-ready-dot" />
                    <span className="cb-ready-dot" />
                    <span className="cb-ready-dot" />
                  </div>
                  <span className="cb-ready-text">Total Chatbot ready...</span>
                </div>

                {/* 6. Command Input Dock */}
                <div className="cb-widget-command-dock">
                  <div className="cb-cmd-input-field">
                    <span className="cb-cmd-cursor" />
                    <span className="cb-cmd-placeholder">Ask a question...</span>
                  </div>
                  <div className="cb-cmd-actions">
                    <div className="cb-cmd-send-btn" aria-hidden="true">
                      <Send size={10} color="#FFFFFF" style={{ transform: 'translate(0.5px, -0.5px)' }} />
                    </div>
                  </div>
                </div>

                {/* 7. Security Knowledge Footer */}
                <div className="cb-widget-security-footer">
                  <Lock size={9} color="#64748B" />
                  <span>Secure • Business AI</span>
                </div>
              </div>

              {/* Right Side Callout Annotation: "Available 24/7 on your website" */}
              <div className="cb-annotation-247" aria-hidden="true">
                <div className="cb-annotation-247-text">
                  <span>Available</span>
                  <span>24/7 on</span>
                  <span>your website</span>
                </div>
                <svg className="cb-annotation-247-arrow" width="30" height="26" viewBox="0 0 46 42" fill="none">
                  <path
                    d="M 36 6 C 38 18, 28 32, 8 36"
                    stroke="#60A5FA"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 16 31 L 7 36 L 14 41"
                    stroke="#60A5FA"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

            </div>
          </div>

        </div>

        {/* ─── Tech Stack / Ecosystem Compatibility Strip (Informational - Strictly NO hover) ─── */}
        <section className="cb-ecosystem-section" aria-label="Supported Integrations">
          <p className="cb-ecosystem-label">
            WORKS SEAMLESSLY WITH ANY MODERN CMS & WEB STACK
          </p>
          <div className="cb-ecosystem-grid">
            {['Shopify', 'WordPress', 'Webflow', 'Next.js', 'React', 'Custom HTML'].map((platform) => (
              <div key={platform} className="cb-ecosystem-item">
                <span className="cb-ecosystem-dot" />
                <span className="cb-ecosystem-name">{platform}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Informational Feature Cards Grid (Strictly NO hover elevation or fake buttons) ─── */}
        <div id="features" className="cb-feature-grid">
          {[
            {
              icon: Globe,
              title: 'Instant Knowledge Extraction',
              desc: 'Automatically parses your sitemap, product catalogs, and documentation with zero manual configuration.',
            },
            {
              icon: Palette,
              title: 'Auto-Branded Interface',
              desc: 'Extracts your corporate color palette, logo, and brand fonts to deploy a custom-tailored chat experience.',
            },
            {
              icon: Zap,
              title: 'One-Line Integration',
              desc: 'Embed across any web application or CMS via an asynchronous, lightweight single-line script tag.',
            },
            {
              icon: ShieldCheck,
              title: 'Enterprise AI Guardrails',
              desc: 'Hallucination-resistant, strictly context-bound responses trained exclusively on your verified knowledge.',
            },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="cb-feature-card">
                <div className="cb-feature-card-top">
                  <div className="cb-feature-icon-box">
                    <IconComp size={18} />
                  </div>
                  <h3 className="cb-feature-title">
                    {item.title}
                  </h3>
                  <p className="cb-feature-desc">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Existing AuthModal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
