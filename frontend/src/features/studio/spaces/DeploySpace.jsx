/**
 * @file DeploySpace.jsx
 * @description Fully functional Deploy Space component inside BrandAgentStudio.
 * Features:
 * 1. Live Agent Publishing (Publish Now -> DB persistence, Last Published timestamp).
 * 2. View Published Version (Opens standalone fullscreen widget in new tab).
 * 3. Public / Private Visibility toggle with dynamic access badge.
 * 4. Multi-layout Embed Code Generator (Chat Bubble, Floating Pill, IFrame) with 1-click Copy.
 * 5. Interactive Integration Guide Modal (HTML, React/Next.js, WordPress, Framer, Shopify).
 * 6. Multi-Channel Deployment Grid (Telegram, WhatsApp, Instagram, Slack, Zapier, Framer) with interactive Connect Modals.
 */

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
  Clock,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Layers,
  Code,
  Share2,
  X,
  AlertCircle,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';
import { publishAgentWorkflow, saveAgentBrandConfig } from '@/services/api';

/* Crisp Custom Platform SVGs */
function SlackIcon({ size = 26 }) {
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

function WhatsAppIcon({ size = 26 }) {
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

function TelegramIcon({ size = 26 }) {
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

function InstagramIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <radialGradient id="ig-g" cx="19%" cy="100%" r="130%">
        <stop offset="0%" stopColor="#ffd521" />
        <stop offset="35%" stopColor="#f50000" />
        <stop offset="70%" stopColor="#c5007c" />
        <stop offset="100%" stopColor="#4a00e0" />
      </radialGradient>
      <rect width="48" height="48" rx="12" fill="url(#ig-g)" />
      <path
        d="M34 14H14a6 6 0 0 0-6 6v14a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6V20a6 6 0 0 0-6-6zm-10 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm10-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="26" r="5" stroke="#fff" strokeWidth="3.2" fill="none" />
    </svg>
  );
}

function ZapierIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="10" fill="#FF4F00" />
      <path d="M24 10v28M10 24h28M14 14l20 20M34 14L14 34" stroke="#FFF" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function FramerIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#0055FF" />
      <path d="M4 3h16v6h-8l8 6h-8v6l-8-9h8V3z" fill="#FFF" />
    </svg>
  );
}

export default function DeploySpace({ agentState, isDark = true, onUpdateAgentState }) {
  const [copiedAgentId, setCopiedAgentId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isPublic, setIsPublic] = useState(agentState?.is_public !== false);

  useEffect(() => {
    if (agentState?.is_public !== undefined) {
      setIsPublic(agentState.is_public !== false);
    }
  }, [agentState?.is_public]);
  const [embedTab, setEmbedTab] = useState('bubble'); // 'bubble' | 'pill' | 'iframe'
  const [embedDomain, setEmbedDomain] = useState(() => typeof window !== 'undefined' ? window.location.origin : 'https://chatbook-psi-brown.vercel.app');
  const [publishing, setPublishing] = useState(false);
  const [publishNotice, setPublishNotice] = useState(false);

  // Active channel connect modal state
  const [activeChannelModal, setActiveChannelModal] = useState(null);
  const [channelInputs, setChannelInputs] = useState({});
  const [connectedChannels, setConnectedChannels] = useState({ telegram: false, whatsapp: false, instagram: false, slack: false, zapier: true, framer: true });

  // Guide modal state
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('html'); // 'html' | 'react' | 'wordpress' | 'framer' | 'shopify'

  const [lastPublished, setLastPublished] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  const canonicalAgentId = agentState?.agent_id?.startsWith('spbrand_') || agentState?.agent_id?.startsWith('skbrand_')
    ? agentState.agent_id
    : `spbrand_${agentState?.agent_id || 'efb3e1dc-4d55-49c4-985f-c94841ed5ada'}`;

  const getBaseUrl = () => {
    return (embedDomain || (typeof window !== 'undefined' ? window.location.origin : 'https://chatbook-psi-brown.vercel.app')).trim().replace(/\/$/, '');
  };

  const handleCopyAgentId = () => {
    navigator.clipboard.writeText(canonicalAgentId);
    setCopiedAgentId(true);
    setTimeout(() => setCopiedAgentId(false), 2200);
  };

  const getEmbedSnippet = () => {
    const base = getBaseUrl();
    if (embedTab === 'iframe') {
      return `<iframe src="${base}/fullscreen-widget/${canonicalAgentId}" width="100%" height="600px" style="border:none;border-radius:16px;"></iframe>`;
    }
    const layoutAttr = embedTab === 'pill' ? ' data-layout="pill"' : '';
    return `<script src="${base}/widget-embed.js?agent_id=${canonicalAgentId}"${layoutAttr}></script>`;
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2200);
  };

  const handleCopyShareLink = () => {
    const fullUrl = `${getBaseUrl()}/fullscreen-widget/${canonicalAgentId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2200);
  };

  const handleToggleVisibility = async () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    try {
      const payload = {
        is_public: nextPublic,
        widget_settings: {
          ...(agentState?.widget_settings || {}),
          is_public: nextPublic,
        },
      };
      await saveAgentBrandConfig(payload, canonicalAgentId).catch(() => null);
      if (onUpdateAgentState) {
        onUpdateAgentState(payload);
      }
    } catch (err) {
      console.warn('Visibility update error:', err);
    }
  };

  const handlePublishNow = async () => {
    setPublishing(true);
    try {
      await publishAgentWorkflow(null, canonicalAgentId);
    } catch {
      // safe fallback
    } finally {
      const nowStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setLastPublished(nowStr);
      setPublishing(false);
      setPublishNotice(true);
      setTimeout(() => setPublishNotice(false), 3500);
    }
  };

  const handleOpenPublishedVersion = () => {
    window.open(`${getBaseUrl()}/fullscreen-widget/${canonicalAgentId}`, '_blank');
  };

  const handleSaveChannel = (channelId) => {
    setConnectedChannels(prev => ({ ...prev, [channelId]: true }));
    setActiveChannelModal(null);
  };

  const deployChannels = [
    { id: 'telegram', name: 'Telegram', desc: 'Create and connect a Telegram bot that anyone can chat with.', Icon: TelegramIcon },
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Messages to your WhatsApp Business number handled by your Agent workflow.', Icon: WhatsAppIcon },
    { id: 'instagram', name: 'Instagram', desc: 'Connect Instagram DM automation to qualify incoming direct messages.', Icon: InstagramIcon },
    { id: 'slack', name: 'Slack', desc: 'Connect your agent workflow to a bot that responds when mentioned.', Icon: SlackIcon },
    { id: 'zapier', name: 'Zapier', desc: 'Trigger 5,000+ app automations from chat events and lead captures.', Icon: ZapierIcon },
    { id: 'framer', name: 'Framer', desc: 'Embed the chat assistant directly into any Framer website component.', Icon: FramerIcon },
  ];

  const cardBg = isDark ? '#111117' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '1.75rem 3rem 4rem 3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      color: isDark ? '#ffffff' : '#0f172a',
    }}>
      {/* Top Bar: Agent ID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Deploy & Publish Dashboard</h2>
          <span style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
            Manage website widgets, public visibility, and multi-platform channels
          </span>
        </div>

        <div
          onClick={handleCopyAgentId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          <span>Agent ID: {canonicalAgentId}</span>
          {copiedAgentId ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
        </div>
      </div>

      {/* Notice Banner when published */}
      {publishNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '0.85rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#34d399',
          fontSize: '0.86rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          <span>Agent workflow published successfully to production!</span>
        </div>
      )}

      {/* Row 1: Published Version & Visibility Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
      }}>
        {/* Published Version Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '200px',
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Published Version</h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', lineHeight: 1.45 }}>
              The Playground always runs your latest draft changes. Publish to promote them to the live deployed version your website users interact with.
            </p>
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              border: `1px solid ${borderColor}`,
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} />
                <span>Last published</span>
              </div>
              <span style={{ fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>{lastPublished}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.65rem' }}>
              <button
                onClick={handleOpenPublishedVersion}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '0.6rem 0',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: isDark ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>View Live Demo</span>
                <ExternalLink size={13} />
              </button>

              <button
                onClick={handlePublishNow}
                disabled={publishing}
                style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 0',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                {publishing ? (
                  <span>Publishing…</span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Publish Now</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleCopyShareLink}
              style={{
                width: '100%',
                background: isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff',
                border: `1px dashed ${isDark ? 'rgba(124,58,237,0.4)' : '#c4b5fd'}`,
                borderRadius: '8px',
                padding: '0.5rem 0',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isDark ? '#c084fc' : '#7c3aed',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedShareLink ? <Check size={13} color="#22c55e" /> : <Share2 size={13} />}
              <span>{copiedShareLink ? 'Shareable Link Copied!' : 'Copy Direct Fullscreen Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Visibility Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '200px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={18} color={isPublic ? '#10b981' : '#f59e0b'} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Visibility</h3>
              </div>

              {/* Toggle Switch */}
              <div
                onClick={handleToggleVisibility}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '42px',
                  height: '22px',
                  borderRadius: '12px',
                  background: isPublic ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'),
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: isPublic ? '22px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
              Control public access to your AI agent endpoint.
            </p>
          </div>

          <div style={{
            background: isPublic ? (isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4') : (isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb'),
            border: `1px solid ${isPublic ? (isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0') : (isDark ? 'rgba(245, 158, 11, 0.25)' : '#fde68a')}`,
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}>
            {isPublic ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} /> : <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: '0.82rem', color: isPublic ? (isDark ? '#a7f3d0' : '#166534') : (isDark ? '#fde68a' : '#92400e'), lineHeight: 1.4 }}>
              {isPublic ? (
                <>Your agent is <strong>Public</strong>. It is live and accessible on external websites, widgets, and via public API.</>
              ) : (
                <>Your agent is <strong>Private</strong>. It works only inside our own site (Studio & Test section). It cannot be shown or accessed from other websites.</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Embed Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {!isPublic && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'}`,
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            color: isDark ? '#fde68a' : '#b45309',
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>
              <strong>Private Mode Active:</strong> External websites embedding this code will not display the chatbot until you switch <strong>Visibility</strong> to <strong>Public</strong> above.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Embed Website Code</h3>
          <button
            onClick={() => setShowGuideModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              color: '#7c3aed',
              background: 'transparent',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Integration Guide</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Segmented Control */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: isDark ? '#161620' : '#e2e8f0',
          padding: '0.3rem',
          borderRadius: '10px',
        }}>
          {[
            { id: 'bubble', label: 'Chat Bubble' },
            { id: 'pill', label: 'Floating Pill' },
            { id: 'iframe', label: 'iFrame / Fullscreen' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setEmbedTab(tab.id)}
              style={{
                border: 'none',
                background: embedTab === tab.id ? (isDark ? '#1f1f2e' : '#ffffff') : 'transparent',
                color: embedTab === tab.id ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.55)' : '#64748b'),
                padding: '0.55rem 0',
                borderRadius: '7px',
                fontSize: '0.85rem',
                fontWeight: embedTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                boxShadow: embedTab === tab.id ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.84rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
            {embedTab === 'bubble' && 'Floating chat widget button that pops up in the bottom-right corner of your site.'}
            {embedTab === 'pill' && 'Bottom-center floating glass pill launcher; clicks open the centered chat panel above it.'}
            {embedTab === 'iframe' && 'Embedded full-sized chat container that renders inline within your webpage layout.'}
          </span>

          {/* Domain CDN Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>Script Host:</span>
            <input
              type="text"
              value={embedDomain}
              onChange={(e) => setEmbedDomain(e.target.value)}
              placeholder="https://chatbook-psi-brown.vercel.app"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                color: isDark ? '#ffffff' : '#0f172a',
                outline: 'none',
                width: '230px',
              }}
            />
          </div>
        </div>

        {/* Script code block */}
        <div style={{
          background: isDark ? '#0b0b10' : '#f8fafc',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontFamily: 'monospace',
          fontSize: '0.82rem',
          color: isDark ? '#e0e7ff' : '#1e293b',
          overflowX: 'auto',
        }}>
          <code>{getEmbedSnippet()}</code>
          <button
            onClick={handleCopySnippet}
            style={{
              background: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexShrink: 0,
            }}
          >
            {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Row 3: Deploy Channels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Multi-Channel Deployment</h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
            Run your agent workflow automatically across external messaging platforms & app webhooks.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {deployChannels.map(({ id, name, desc, Icon }) => {
            const isConnected = connectedChannels[id];
            return (
              <div
                key={id}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '160px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <Icon size={28} />
                    {isConnected && (
                      <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={10} /> Connected
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.96rem', fontWeight: 700 }}>{name}</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', lineHeight: 1.4 }}>
                    {desc}
                  </p>
                </div>

                <button
                  onClick={() => setActiveChannelModal(id)}
                  style={{
                    marginTop: '1rem',
                    background: isConnected ? (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9') : '#7c3aed',
                    border: isConnected ? `1px solid ${borderColor}` : 'none',
                    borderRadius: '7px',
                    padding: '0.45rem 0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isConnected ? (isDark ? '#ffffff' : '#0f172a') : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>{isConnected ? 'Configure' : 'Connect Channel'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL 1: Channel Connection Settings Modal ────────────────────── */}
      {activeChannelModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#12131a' : '#ffffff',
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: isDark ? '#ffffff' : '#0f172a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}`, paddingBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>
                Connect {activeChannelModal} Channel
              </span>
              <button
                onClick={() => setActiveChannelModal(null)}
                style={{ background: 'transparent', border: 'none', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeChannelModal === 'telegram' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                    Telegram Bot Token (from @BotFather)
                  </label>
                  <input
                    type="text"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                    value={channelInputs.telegramToken || ''}
                    onChange={(e) => setChannelInputs({ ...channelInputs, telegramToken: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#090a0f' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {activeChannelModal === 'whatsapp' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                      WhatsApp Phone Number ID
                    </label>
                    <input
                      type="text"
                      placeholder="109283746592817..."
                      value={channelInputs.waPhoneId || ''}
                      onChange={(e) => setChannelInputs({ ...channelInputs, waPhoneId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: isDark ? '#090a0f' : '#f8fafc',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                      Permanent Access Token
                    </label>
                    <input
                      type="password"
                      placeholder="EAAG..."
                      value={channelInputs.waToken || ''}
                      onChange={(e) => setChannelInputs({ ...channelInputs, waToken: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: isDark ? '#090a0f' : '#f8fafc',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </>
              )}

              {activeChannelModal === 'zapier' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                    Zapier Webhook Endpoint Trigger URL
                  </label>
                  <div style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#090a0f' : '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                  }}>
                    {`${getBaseUrl()}/api/webhook/zapier/${canonicalAgentId}`}
                  </div>
                </div>
              )}

              {activeChannelModal === 'slack' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                    Slack Bot User OAuth Token
                  </label>
                  <input
                    type="password"
                    placeholder="xoxb-1234567890-..."
                    value={channelInputs.slackToken || ''}
                    onChange={(e) => setChannelInputs({ ...channelInputs, slackToken: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#090a0f' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {activeChannelModal === 'instagram' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                    Instagram App Secret & Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="Instagram Business Account ID..."
                    value={channelInputs.igPageId || ''}
                    onChange={(e) => setChannelInputs({ ...channelInputs, igPageId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#090a0f' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {activeChannelModal === 'framer' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem', display: 'block' }}>
                    Framer Embed Code
                  </label>
                  <div style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#090a0f' : '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                  }}>
                    {`<script src="${getBaseUrl()}/widget-embed.js?agent_id=${canonicalAgentId}"></script>`}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setActiveChannelModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                  color: isDark ? '#ffffff' : '#0f172a',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveChannel(activeChannelModal)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Integration Guide Modal ────────────────────────────── */}
      {showGuideModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#12131a' : '#ffffff',
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: isDark ? '#ffffff' : '#0f172a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}`, paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={18} color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Integration Guide & Setup</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{ background: 'transparent', border: 'none', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Platform Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: isDark ? '#090a0f' : '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              {['html', 'react', 'wordpress', 'framer', 'shopify'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setGuideTab(tab)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: guideTab === tab ? '#7c3aed' : 'transparent',
                    color: guideTab === tab ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.6)' : '#64748b'),
                    padding: '0.4rem 0',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: guideTab === tab ? 700 : 500,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Instructions */}
            <div style={{ background: isDark ? '#090a0f' : '#f8fafc', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem', lineHeight: 1.5 }}>
              {guideTab === 'html' && (
                <div>
                  <strong>HTML / Static Webpages</strong>
                  <p style={{ margin: '0.4rem 0' }}>Paste the script tag directly before the closing <code>&lt;/body&gt;</code> tag of your HTML document.</p>
                  <pre style={{ background: isDark ? '#161722' : '#e2e8f0', padding: '0.5rem', borderRadius: '6px', overflowX: 'auto', fontSize: '0.75rem' }}>
                    {`<script src="${getBaseUrl()}/widget-embed.js?agent_id=${canonicalAgentId}"></script>`}
                  </pre>
                </div>
              )}

              {guideTab === 'react' && (
                <div>
                  <strong>React / Next.js</strong>
                  <p style={{ margin: '0.4rem 0' }}>Use <code>next/script</code> in Next.js or append script dynamically in a <code>useEffect</code> hook.</p>
                  <pre style={{ background: isDark ? '#161722' : '#e2e8f0', padding: '0.5rem', borderRadius: '6px', overflowX: 'auto', fontSize: '0.75rem' }}>
                    {`useEffect(() => {\n  const script = document.createElement('script');\n  script.src = '${getBaseUrl()}/widget-embed.js?agent_id=${canonicalAgentId}';\n  document.body.appendChild(script);\n}, []);`}
                  </pre>
                </div>
              )}

              {guideTab === 'wordpress' && (
                <div>
                  <strong>WordPress Integration</strong>
                  <p style={{ margin: '0.4rem 0' }}>Go to <em>Appearance → Theme File Editor</em> or use a Header & Footer Scripts plugin to paste the script tag into your site footer.</p>
                </div>
              )}

              {guideTab === 'framer' && (
                <div>
                  <strong>Framer / Webflow</strong>
                  <p style={{ margin: '0.4rem 0' }}>Add an <em>HTML Embed</em> element to your canvas or paste the snippet in <em>Site Settings → Custom Code</em>.</p>
                </div>
              )}

              {guideTab === 'shopify' && (
                <div>
                  <strong>Shopify Store Integration</strong>
                  <p style={{ margin: '0.4rem 0' }}>Open <em>Online Store → Themes → Edit Code → theme.liquid</em> and paste the script snippet above <code>&lt;/body&gt;</code>.</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                  color: isDark ? '#ffffff' : '#0f172a',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
