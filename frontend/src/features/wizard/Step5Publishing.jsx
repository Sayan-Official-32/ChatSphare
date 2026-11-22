/**
 * @file Step5Publishing.jsx
 * @description Wizard Step 5: Agent Publishing, Visibility, Embed Snippets & Multi-Platform Deployment.
 * Designed to match the exact specification from the design references:
 * 1. Agent ID Top Bar with one-click copy.
 * 2. Published Version card with 'View Published Version' and 'Publish Now' actions.
 * 3. Visibility card with Public / Private toggle, contextual guidance banners.
 * 4. Embed section with 3-tab segmented control (Chat Bubble, Floating pill, iframe/Fullscreen),
 *    dynamic snippet generation (supporting public/private keys & layouts), and copy controls.
 * 5. Deploy section with 11-channel integration grid (Slack, WhatsApp, Telegram, Instagram, Zapier, Framer, WordPress, Wix, Squarespace, Shopify, API).
 * 6. Smooth card container scroll layout + attached bottom card footer matching Steps 2, 3, 4.
 */

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
  Lock,
  Clock,
  Shield,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  BookOpen,
  Code,
  CheckCircle2,
  X,
  Key,
} from 'lucide-react';

/* ── Inject CSS keyframes for Stage 5 Welcome Celebration ────────── */
const ANIM_STYLE_ID = 'step5-celebration-anims';
function injectCelebrationStyles() {
  if (typeof document === 'undefined' || document.getElementById(ANIM_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes s5-banner-glide {
      0%   { opacity: 0; transform: translateY(-16px) scale(0.94); }
      65%  { opacity: 1; transform: translateY(2px) scale(1.015); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes s5-glow-shimmer {
      0%   { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0), 0 0 25px rgba(34, 197, 94, 0.15); }
      50%  { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.15), 0 0 45px rgba(124, 58, 237, 0.28); }
      100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0), 0 0 25px rgba(34, 197, 94, 0.15); }
    }
    @keyframes s5-pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.35); opacity: 0.75; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Custom Platform Brand Icons (Crisp Inline SVGs) ─────────────── */

function SlackIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <path d="M26.7 78.4a13.3 13.3 0 1 1-13.3-13.3h13.3v13.3z" fill="#E01E5A" />
      <path d="M33.4 78.4a13.3 13.3 0 0 1 26.6 0v33.2a13.3 13.3 0 1 1-26.6 0V78.4z" fill="#E01E5A" />
      <path d="M46.7 26.7a13.3 13.3 0 1 1 13.3-13.3v13.3H46.7z" fill="#36C5F0" />
      <path d="M46.7 33.4a13.3 13.3 0 0 1 0 26.6H13.5a13.3 13.3 0 1 1 0-26.6h33.2z" fill="#36C5F0" />
      <path d="M98.3 46.7a13.3 13.3 0 1 1 13.3 13.3H98.3V46.7z" fill="#2EB67D" />
      <path d="M91.6 46.7a13.3 13.3 0 0 1-26.6 0V13.5a13.3 13.3 0 1 1 26.6 0v33.2z" fill="#2EB67D" />
      <path d="M78.4 98.3a13.3 13.3 0 1 1-13.3 13.3V98.3h13.3z" fill="#ECB22E" />
      <path d="M78.4 91.6a13.3 13.3 0 0 1 0-26.6h33.2a13.3 13.3 0 1 1 0 26.6H78.4z" fill="#ECB22E" />
    </svg>
  );
}

function WhatsAppIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#25D366" />
      <path
        d="M34.2 29.8c-.5-.3-2.9-1.4-3.4-1.6-.4-.2-.8-.3-1.1.3-.3.6-1.3 1.6-1.6 1.9-.3.3-.6.4-1.1.1-.5-.3-2.2-.8-4.2-2.6-1.6-1.4-2.6-3.1-2.9-3.6-.3-.5 0-.8.2-1 .2-.2.5-.6.8-.9.2-.3.3-.5.5-.8.2-.3.1-.6 0-.9-.1-.2-1.1-2.7-1.5-3.7-.4-1-.8-.8-1.1-.8h-1c-.3 0-.9.1-1.4.6-.5.5-1.9 1.9-1.9 4.6s2 5.3 2.2 5.7c.3.4 3.8 5.8 9.3 8.2 1.3.6 2.3.9 3.1 1.2 1.3.4 2.5.3 3.5.2 1.1-.2 3.4-1.4 3.9-2.7.5-1.3.5-2.5.3-2.7-.2-.2-.6-.4-1.1-.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function TelegramIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#2AABEE" />
      <path
        d="M10 23.5l23.5-9.6c1.1-.4 2.1.3 1.7 1.9l-4 18.9c-.3 1.3-1.1 1.6-2.2 1l-6.1-4.5-2.9 2.8c-.3.3-.6.6-1.2.6l.4-6.2 11.3-10.2c.5-.4-.1-.7-.7-.3L15.9 27.5l-6-1.9c-1.3-.4-1.3-1.3.1-1.8v-.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function InstagramIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <radialGradient id="ig-grad" cx="20%" cy="100%" r="130%">
          <stop offset="0%" stopColor="#ffb900" />
          <stop offset="25%" stopColor="#ff4500" />
          <stop offset="60%" stopColor="#e6007e" />
          <stop offset="100%" stopColor="#7000ff" />
        </radialGradient>
      </defs>
      <rect width="44" height="44" x="2" y="2" rx="12" fill="url(#ig-grad)" />
      <circle cx="24" cy="24" r="7.5" stroke="#fff" strokeWidth="3" fill="none" />
      <rect width="26" height="26" x="11" y="11" rx="7" stroke="#fff" strokeWidth="3" fill="none" />
      <circle cx="31.5" cy="16.5" r="1.8" fill="#fff" />
    </svg>
  );
}

function ZapierIcon({ size = 28 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: 'rgba(255, 74, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24">
        <path
          d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
          stroke="#FF4A00"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function FramerIcon({ size = 28 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #0055FF, #0099FF)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
      </svg>
    </div>
  );
}

function WordPressIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#21759B" />
      <path
        d="M6.2 24c0 7.6 4.7 14.1 11.4 16.7L8.8 17.5C7.2 19.4 6.2 21.6 6.2 24zm28.7-.7c0-2.3-.8-3.9-1.5-5.2-1-1.6-1.9-2.9-1.9-4.5 0-1.7 1.3-3.3 3.1-3.3.1 0 .2 0 .3.1C31.5 7.6 27.9 6 24 6c-6.8 0-12.8 3.7-15.8 9.3 0 .1.1.1.1.1 1-.1 2.3-.1 2.3-.1 1.2-.1 1.5 1.5.3 1.7 0 0-1.8.2-3.8.3L12.5 33l7-20.9-4.2-.2c-1.2-.1-.9-1.7.3-1.6 0 0 2.3.2 3.6.2 1.3 0 3.6-.2 3.6-.2 1.2-.1 1.5 1.5.3 1.7 0 0-1.8.2-3.8.3l6.4 19.1 2.9-9.8c-.8-1.5-1.5-3-1.5-4.4zm-9.3 7.8l-5.3-15.3-4.4 13.2c1.6 1.8 3.5 3.3 5.7 4.3 1.3-.7 2.7-1.5 4-2.2zm7.1 7.1c2.7-1.2 5.1-3.1 6.8-5.5l-5.8-16.7c0 0-.2.6-.4 1.2l-4.5 13.1c1.3 2.6 2.6 5.3 3.9 7.9zm-8.7 1.8c2.2.4 4.4.4 6.6 0l-5.6-16.5-1 3.1 0 .1z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function WixIcon({ size = 28 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: '#0C0D0E',
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      fontWeight: 900,
      fontSize: size * 0.38,
      letterSpacing: '-0.04em',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      WiX
    </div>
  );
}

function SquarespaceIcon({ size = 28 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: '#111215',
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8a3 3 0 0 1 4.24 0l3.52 3.52a3 3 0 0 1 0 4.24l-3.52 3.52a3 3 0 0 1-4.24 0" />
        <path d="M16 16a3 3 0 0 1-4.24 0L8.24 12.48a3 3 0 0 1 0-4.24l3.52-3.52a3 3 0 0 1 4.24 0" />
      </svg>
    </div>
  );
}

function ShopifyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="shop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#95BF47" />
          <stop offset="100%" stopColor="#5E8E3E" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" x="2" y="2" rx="10" fill="url(#shop-grad)" />
      <path
        d="M29.5 13.5s-.8-2-3-2c-2.3 0-3.3 2.1-3.3 3.6 0 2.8 3.7 3.9 3.7 6.9 0 1.5-1 2.5-2.6 2.5-2.2 0-3.4-1.8-3.4-1.8l-1.1 2.3s1.5 2.1 4.3 2.1c3.1 0 5.2-2.1 5.2-4.9 0-3.3-3.7-4.1-3.7-6.8 0-1 .6-1.5 1.5-1.5 1.2 0 2 .9 2 1.9l2-2.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function ApiIcon({ size = 28 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #1e1e2f, #2d2b42)',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px',
    }}>
      <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#c084fc', letterSpacing: '0.05em' }}>API</div>
      <div style={{ display: 'flex', gap: '3px', marginTop: '1px' }}>
        <span style={{ color: '#22c55e', fontSize: '0.6rem', fontWeight: 900 }}>↑</span>
        <span style={{ color: '#ef4444', fontSize: '0.6rem', fontWeight: 900 }}>↓</span>
      </div>
    </div>
  );
}

/** Formats a Date or ISO timestamp string into human-readable format (e.g., Aug 22, 2026, 6:35 PM) */
function formatTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Step5Publishing({
  brandData = {},
  theme = 'dark',
  onProcessAgent,
  onPublishWorkflow,
  onSendPlaygroundChat,
  onFetchEmbedCode,
  onBack,
}) {
  const isDark = theme === 'dark';

  // Core Visibility & Embed Tabs
  const [isPublic, setIsPublic] = useState(true);
  const [activeTab, setActiveTab] = useState('bubble'); // 'bubble' | 'pill' | 'fullscreen'
  
  // Real-time Last Published / Updated Time
  const [lastPublishedText, setLastPublishedText] = useState(() => {
    return formatTimestamp(brandData?.published_at || brandData?.updated_at) || formatTimestamp(new Date());
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishToast, setShowPublishToast] = useState(false);

  // Copy feedback states
  const [copiedAgentId, setCopiedAgentId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Connection dialog / preview states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [connectModalApp, setConnectModalApp] = useState(null);

  // Generate canonical agent identifier with standardized "spbrand_" + full UUID format
  const rawId = brandData?.agent_id || 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362';
  const cleanUuid = rawId.replace(/^(spbrand_|skbrand_|draft-)/, '').replace(/[^a-zA-Z0-9-]/g, '');
  const agentId = `spbrand_${cleanUuid || '6a9150e5-92ed-42dc-baed-810d0e9a4362'}`;

  // Keep lastPublishedText synchronized with incoming brandData updates
  useEffect(() => {
    if (brandData?.published_at || brandData?.updated_at) {
      const formatted = formatTimestamp(brandData.published_at || brandData.updated_at);
      if (formatted) setLastPublishedText(formatted);
    }
  }, [brandData?.published_at, brandData?.updated_at]);

  // Check if this project has already been celebrated (only show once per project)
  const [showCelebration, setShowCelebration] = useState(() => {
    try {
      const alreadyCelebrated = localStorage.getItem(`cb_celebrated_${agentId}`) || sessionStorage.getItem(`cb_celebrated_${agentId}`);
      return !alreadyCelebrated;
    } catch {
      return false;
    }
  });

  // Inject animation keyframes on mount and show Lottie animation for exactly 3 seconds once per project
  useEffect(() => {
    if (!showCelebration) return;
    try {
      localStorage.setItem(`cb_celebrated_${agentId}`, 'true');
      sessionStorage.setItem(`cb_celebrated_${agentId}`, 'true');
    } catch { /* ignore */ }

    injectCelebrationStyles();
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [agentId, showCelebration]);

  // If switched to private mode and fullscreen was active, fallback to bubble
  useEffect(() => {
    if (!isPublic && activeTab === 'fullscreen') {
      setActiveTab('bubble');
    }
  }, [isPublic, activeTab]);

  const handleCopyAgentId = () => {
    navigator.clipboard.writeText(agentId);
    setCopiedAgentId(true);
    setTimeout(() => setCopiedAgentId(false), 2000);
  };

  /** Republishes project on click and updates the last published timestamp */
  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      if (onPublishWorkflow) {
        await onPublishWorkflow();
      } else if (onProcessAgent) {
        await onProcessAgent();
      }
      const now = new Date();
      const formattedDate = formatTimestamp(now);
      setLastPublishedText(formattedDate);
      setShowPublishToast(true);
      setTimeout(() => setShowPublishToast(false), 3500);
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Build snippet strings based on tab & visibility mode (dynamic origin)
  const getEmbedSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chatbook-psi-brown.vercel.app';
    const apiKeyAttr = !isPublic ? ' data-api-key="YOUR_TEAMSPACE_RUNTIME_KEY"' : '';

    if (activeTab === 'bubble') {
      return `<script src="${origin}/widget-embed.js?agent_id=${agentId}"${apiKeyAttr}></script>`;
    }
    if (activeTab === 'pill') {
      return `<script src="${origin}/widget-embed.js?agent_id=${agentId}" data-layout="pill"${apiKeyAttr}></script>`;
    }
    // iframe/Fullscreen (public only)
    return `<iframe src="${origin}/fullscreen-widget/${agentId}" width="100%" height="700px" frameborder="0"></iframe>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  /* 11 Deployment Platforms Catalog matching the Reference Design */
  const deployPlatforms = [
    {
      id: 'slack',
      name: 'Slack',
      icon: SlackIcon,
      locked: true,
      description: 'Connect your agent workflow to a bot that responds when mentioned.',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      locked: true,
      description: 'Messages to your WhatsApp business number will be handled by your Agent workflow.',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: TelegramIcon,
      locked: false,
      description: 'Create and connect a Telegram bot that you or anyone can chat with.',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: InstagramIcon,
      locked: true,
      description: 'Your DMs will be handled by your workflow.',
    },
    {
      id: 'zapier',
      name: 'Zapier',
      icon: ZapierIcon,
      locked: false,
      description: 'Call this agent workflow from your Zapier automations / Zaps.',
    },
    {
      id: 'framer',
      name: 'Framer',
      icon: FramerIcon,
      locked: false,
      description: 'Connect your agent workflow to Framer sites using our guide.',
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: WordPressIcon,
      locked: false,
      description: 'Use the official ChatBook plugin for WordPress to add the widget.',
    },
    {
      id: 'wix',
      name: 'Wix',
      icon: WixIcon,
      locked: false,
      description: 'Integrate your widget or full screen UI with your website easily.',
    },
    {
      id: 'squarespace',
      name: 'Squarespace',
      icon: SquarespaceIcon,
      locked: false,
      description: 'Integrate your widget or full screen UI with your website easily.',
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: ShopifyIcon,
      locked: false,
      description: 'Integrate your widget or full screen UI with your website easily.',
    },
    {
      id: 'api',
      name: 'API',
      icon: ApiIcon,
      locked: true,
      hasDocs: true,
      description: 'Talk to your agent workflow with API calls or Python/TS SDKs with few lines of code.',
    },
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      color: isDark ? '#ffffff' : '#0f172a',
    }}>
      {/* Outer wrapper — matches Steps 2, 3, 4 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1080px',
        width: '100%',
        margin: '0 auto',
        padding: '0 1.5rem',
        boxSizing: 'border-box',
      }}>
        {/* CARD CONTAINER */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: isDark ? '#121319' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          {/* ── SCROLLABLE BODY ────────────────────────────────────────── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2.5rem 3rem 2.5rem',
            boxSizing: 'border-box',
          }}>

            {/* ── WELCOME CELEBRATION WITH LOTTIE ANIMATION ──────────── */}
            {showCelebration && (
              <div style={{
                margin: '0 auto 1.75rem auto',
                padding: '1.25rem 1.75rem',
                borderRadius: '18px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(34, 197, 94, 0.14) 50%, rgba(59, 130, 246, 0.18) 100%)'
                  : 'linear-gradient(135deg, #faf5ff 0%, #f0fdf4 50%, #eff6ff 100%)',
                border: `1.5px solid ${isDark ? 'rgba(124, 58, 237, 0.45)' : '#c4b5fd'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 's5-banner-glide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, s5-glow-shimmer 3s ease-in-out infinite',
                boxShadow: '0 12px 35px rgba(124, 58, 237, 0.25)',
                overflow: 'hidden',
              }}>
                {/* Embedded Lottie Celebration Animation */}
                <div style={{
                  width: '100%',
                  maxWidth: '360px',
                  height: '190px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  margin: '-8px 0 0.5rem 0',
                }}>
                  <iframe
                    src="https://lottie.host/embed/89094edb-2ac2-479f-ac41-84f710c17263/EL1VcsR4iu.lottie"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      pointerEvents: 'none',
                    }}
                    title="Congratulations Celebration Animation"
                  />
                </div>

                {/* Congratulations Header & Subtitle */}
                <div style={{ textAlign: 'center', maxWidth: '680px' }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    color: isDark ? '#ffffff' : '#0f172a',
                    letterSpacing: '-0.01em',
                    marginBottom: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                  }}>
                    <Sparkles size={19} color="#22c55e" />
                    <span>Congratulations! You've Reached Stage 5</span>
                    <Sparkles size={19} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.8)' : '#475569', lineHeight: 1.5 }}>
                    All brand data and tool configurations are safely saved. Test your agent in the interactive sandbox and choose your deployment options below.
                  </div>
                </div>
              </div>
            )}

            {/* ── TOP BAR: AGENT ID ────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}>
              <div
                onClick={handleCopyAgentId}
                title="Click to copy Agent ID"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8rem',
                  color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
                  cursor: 'pointer',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'; }}
              >
                <span>Agent ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {agentId}
                </span>
                {copiedAgentId ? (
                  <Check size={14} color="#22c55e" />
                ) : (
                  <Copy size={14} color={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'} />
                )}
              </div>
            </div>

            {/* ── ROW 1: PUBLISHED VERSION & VISIBILITY (2-COLUMN GRID) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}>
              {/* Card 1: Published Version */}
              <div style={{
                background: isDark ? '#16171e' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '0.4rem',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}>
                    Published Version
                  </h3>
                  <p style={{
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    margin: '0 0 1.25rem 0',
                  }}>
                    The Playground always runs your latest draft changes. Publish to promote them to the deployed version your users interact with.
                  </p>

                  {/* Last Published Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isDark ? '#101116' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#cbd5e1'}`,
                    borderRadius: '10px',
                    padding: '0.65rem 1rem',
                    marginBottom: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                      <Clock size={15} />
                      <span>Last published</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {lastPublishedText}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => setPreviewModalOpen(true)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    View Published Version
                  </button>

                  <button
                    onClick={handlePublishNow}
                    disabled={isPublishing}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      background: '#7c3aed',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!isPublishing) e.currentTarget.style.background = '#6d28d9'; }}
                    onMouseLeave={e => { if (!isPublishing) e.currentTarget.style.background = '#7c3aed'; }}
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw size={15} style={{ animation: 'spin 1.5s linear infinite' }} />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Publish Now</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Visibility */}
              <div style={{
                background: isDark ? '#16171e' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isPublic ? (
                        <Globe size={18} color="#22c55e" />
                      ) : (
                        <Lock size={18} color="#f59e0b" />
                      )}
                      <h3 style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        margin: 0,
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}>
                        Visibility
                      </h3>
                    </div>

                    {/* Toggle Switch */}
                    <div
                      onClick={() => setIsPublic(!isPublic)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '20px',
                      }}
                    >
                      <div style={{
                        width: '46px',
                        height: '24px',
                        borderRadius: '12px',
                        background: isPublic ? '#7c3aed' : (isDark ? '#27272a' : '#cbd5e1'),
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.3s ease',
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transform: isPublic ? 'translateX(22px)' : 'translateX(0px)',
                          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>
                        {isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    margin: '0 0 1.25rem 0',
                  }}>
                    Control access to your agent.
                  </p>

                  {/* Context Info Box */}
                  <div style={{
                    background: isPublic
                      ? (isDark ? 'rgba(34, 197, 94, 0.05)' : '#f0fdf4')
                      : (isDark ? 'rgba(245, 158, 11, 0.05)' : '#fffbeb'),
                    border: `1px solid ${isPublic
                      ? (isDark ? 'rgba(34, 197, 94, 0.25)' : '#86efac')
                      : (isDark ? 'rgba(245, 158, 11, 0.25)' : '#fde68a')}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}>
                    {isPublic ? (
                      <>
                        <ShieldCheck size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', lineHeight: 1.45 }}>
                          Your agent is <strong style={{ color: '#22c55e' }}>publicly accessible</strong>. It can be embedded on websites and integrated via links.
                        </div>
                      </>
                    ) : (
                      <>
                        <Lock size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', lineHeight: 1.45 }}>
                          <strong style={{ color: isDark ? '#fff' : '#000' }}>Web embeds</strong> can run publicly without a credential or privately with a scoped teamspace runtime key. <strong style={{ color: isDark ? '#fff' : '#000' }}>Messaging apps</strong> work in private mode.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: EMBED ─────────────────────────────────────── */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: isDark ? '#c084fc' : '#7c3aed',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  Embed
                </h2>

                <a
                  href="#integration-guide"
                  onClick={e => { e.preventDefault(); alert('Integration guide will open in documentation.'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <span>Integration Guide</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Private Embed Warning Banner (Shown only when Private) */}
              {!isPublic && (
                <div style={{
                  background: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
                  border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '0.85rem 1.15rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  color: isDark ? '#fbbf24' : '#92400e',
                  marginBottom: '1rem',
                }}>
                  Private embeds require a teamspace runtime key scoped only to this agent. Replace the placeholder in the host script and keep the key out of URLs, logs, cookies, and browser storage.{' '}
                  <span
                    onClick={() => alert(`Your Runtime Key: runtime_key_${agentId.slice(-8)}`)}
                    style={{ textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create a runtime key
                  </span>.
                </div>
              )}

              {/* Segmented Control Tabs */}
              <div style={{
                background: isDark ? '#16171e' : '#f1f5f9',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '4px',
                display: 'grid',
                gridTemplateColumns: isPublic ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: '4px',
                marginBottom: '1rem',
              }}>
                <button
                  onClick={() => setActiveTab('bubble')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'bubble'
                      ? (isDark ? '#23242c' : '#ffffff')
                      : 'transparent',
                    color: activeTab === 'bubble'
                      ? (isDark ? '#ffffff' : '#0f172a')
                      : (isDark ? 'rgba(255,255,255,0.55)' : '#64748b'),
                    fontWeight: activeTab === 'bubble' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'bubble' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Chat Bubble
                </button>

                <button
                  onClick={() => setActiveTab('pill')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'pill'
                      ? (isDark ? '#23242c' : '#ffffff')
                      : 'transparent',
                    color: activeTab === 'pill'
                      ? (isDark ? '#ffffff' : '#0f172a')
                      : (isDark ? 'rgba(255,255,255,0.55)' : '#64748b'),
                    fontWeight: activeTab === 'pill' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'pill' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Floating pill
                </button>

                {isPublic && (
                  <button
                    onClick={() => setActiveTab('fullscreen')}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'fullscreen'
                        ? (isDark ? '#23242c' : '#ffffff')
                        : 'transparent',
                      color: activeTab === 'fullscreen'
                        ? (isDark ? '#ffffff' : '#0f172a')
                        : (isDark ? 'rgba(255,255,255,0.55)' : '#64748b'),
                      fontWeight: activeTab === 'fullscreen' ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'fullscreen' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    iframe/Fullscreen
                  </button>
                )}
              </div>

              {/* Tab Description */}
              <p style={{
                fontSize: '0.84rem',
                color: isDark ? 'rgba(255,255,255,0.65)' : '#475569',
                margin: '0 0 0.85rem 0',
                lineHeight: 1.45,
              }}>
                {activeTab === 'bubble' && 'Floating chat widget button that appears in the corner of your website'}
                {activeTab === 'pill' && 'Bottom-center floating glass pill launcher; clicks open the centered chat panel above it.'}
                {activeTab === 'fullscreen' && (
                  <>
                    Embed the public chat interface directly into your webpage content.{' '}
                    <span
                      onClick={() => setPreviewModalOpen(true)}
                      style={{ color: '#a855f7', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      View this agent in fullscreen
                    </span>
                  </>
                )}
              </p>

              {/* Code Snippet Box with Copy Button */}
              <div style={{
                background: isDark ? '#14151b' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <code style={{
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.83rem',
                  color: isDark ? '#cbd5e1' : '#1e293b',
                  lineHeight: 1.5,
                  wordBreak: 'break-all',
                  paddingRight: '2rem',
                }}>
                  {getEmbedSnippet()}
                </code>

                <button
                  onClick={handleCopyCode}
                  title="Copy snippet"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : '#64748b'; }}
                >
                  {copiedCode ? (
                    <Check size={18} color="#22c55e" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* ── SECTION 3: DEPLOY (11-PLATFORM GRID) ─────────────────── */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: isDark ? '#c084fc' : '#7c3aed',
                  margin: '0 0 0.25rem 0',
                  letterSpacing: '-0.01em',
                }}>
                  Deploy
                </h2>
                <div style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
                  Run your agents from
                </div>
              </div>

              {/* 3-Column Grid of 11 Deployment Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1rem',
              }}>
                {deployPlatforms.map(app => {
                  const AppIcon = app.icon;
                  return (
                    <div
                      key={app.id}
                      style={{
                        background: isDark ? '#16171e' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                        borderRadius: '14px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '170px',
                      }}
                    >
                      <div>
                        {/* Icon + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                          <AppIcon size={32} />
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.98rem',
                            color: isDark ? '#ffffff' : '#0f172a',
                          }}>
                            {app.name}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{
                          fontSize: '0.8rem',
                          lineHeight: 1.45,
                          color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                          margin: 0,
                        }}>
                          {app.description}
                        </p>
                      </div>

                      {/* Connect Action Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.15rem' }}>
                        <button
                          onClick={() => setConnectModalApp(app)}
                          style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            background: isDark ? '#101116' : '#ffffff',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#7c3aed';
                            e.currentTarget.style.color = '#a855f7';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1';
                            e.currentTarget.style.color = isDark ? '#ffffff' : '#0f172a';
                          }}
                        >
                          {app.locked && <Lock size={13} />}
                          <span>Connect</span>
                        </button>

                        {app.hasDocs && (
                          <button
                            onClick={() => alert(`API Documentation for ${agentId}`)}
                            title="API Documentation"
                            style={{
                              padding: '0.55rem 0.65rem',
                              borderRadius: '8px',
                              background: isDark ? '#101116' : '#ffffff',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                              color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <BookOpen size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── FOOTER ATTACHED TO CARD BOTTOM (MATCHING STEPS 2, 3, 4) ─── */}
          <div style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: isDark ? '#121319' : '#ffffff',
          }}>
            <span style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
              Step 5 of 5 — Review &amp; Deployment
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isDark ? '#c084fc' : '#7c3aed',
                background: isDark ? 'rgba(124, 58, 237, 0.12)' : '#f5f3ff',
                border: `1px solid ${isDark ? 'rgba(124, 58, 237, 0.3)' : '#ddd6fe'}`,
                padding: '0.45rem 1.15rem',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                  animation: 's5-pulse-dot 2s infinite ease-in-out',
                }} />
                <span>All Data Saved &bull; Final Stage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────── */}
      {showPublishToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          border: '1px solid rgba(124, 58, 237, 0.4)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 100,
          color: '#ffffff',
          animation: 's4-pop-in 0.3s ease-out',
        }}>
          <CheckCircle2 size={20} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Agent Published Successfully</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Live endpoints updated with latest draft changes.</div>
          </div>
        </div>
      )}

      {/* ── PREVIEW / VIEW PUBLISHED VERSION MODAL ────────────────────── */}
      {previewModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: isDark ? '#16171e' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: '18px',
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={18} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Published Agent Preview: {brandData?.display_name || 'Agent'}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#fff' : '#000', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.75rem 1.5rem' }}>
              <div style={{
                background: isDark ? '#0c0d12' : '#f1f5f9',
                borderRadius: '12px',
                padding: '1.5rem',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: brandData?.primary_color || '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}>
                    {(brandData?.display_name || 'A')[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{brandData?.display_name || 'Brand Assistant'}</div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                      {brandData?.role || 'Customer Concierge'} • {isPublic ? 'Public' : 'Private'}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  padding: '1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: isDark ? '#e2e8f0' : '#334155',
                }}>
                  {brandData?.greeting || `Hello! How can I assist you with ${brandData?.brand_name || 'our products'} today?`}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', textAlign: 'center' }}>
                Embed snippet is active and ready to be placed on your websites or landing pages.
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  background: '#7c3aed',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLATFORM INTEGRATION MODAL ────────────────────────────────── */}
      {connectModalApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: isDark ? '#16171e' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: '18px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {React.createElement(connectModalApp.icon, { size: 24 })}
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Connect to {connectModalApp.name}
                </h3>
              </div>
              <button
                onClick={() => setConnectModalApp(null)}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#fff' : '#000', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                {connectModalApp.description}
              </p>

              <div style={{
                background: isDark ? '#0f1015' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontWeight: 600, color: isDark ? '#93c5fd' : '#1e40af', marginBottom: '0.35rem' }}>
                  Configuration Target
                </div>
                <div style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                  Target Agent: <span style={{ fontFamily: 'monospace', color: isDark ? '#fff' : '#000' }}>{agentId}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConnectModalApp(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                    color: isDark ? '#fff' : '#000',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Connection to ${connectModalApp.name} requested! OAuth workflow initiated.`);
                    setConnectModalApp(null);
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    background: '#7c3aed',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Authorize &amp; Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
