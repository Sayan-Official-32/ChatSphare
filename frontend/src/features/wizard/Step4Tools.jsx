/**
 * @file Step4Tools.jsx
 * @description Wizard Step 4: Tools & Connect Phase Integrations.
 * Layout and scroll container match Step 2 (Brand) and Step 3 (Knowledge) with:
 * 1. Smooth scrollable content container.
 * 2. Fixed bottom card footer matching previous wizard steps.
 * 3. Top 'Connect Apps (optional)' and 'Uploading data sources...' progress card.
 * 4. Built-in Capabilities, Productivity & Data (Calendar, Sheets, Drive), More Integrations, Security Banner.
 * 5. Gated 'Proceed to Playground & Sandbox' button until data sources finish uploading.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Globe,
  Navigation,
  Calendar,
  Table,
  FolderSync,
  Lock,
  Unlock,
  Check,
  ArrowRight,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Mail,
  FileText,
  MessageSquare,
  Building,
  Shield,
  EyeOff,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { fetchToolsCatalog, toggleTool } from '@/services/api';
import LeadCaptureModal from './tools/LeadCaptureModal';
import OAuthConnectModal from './tools/OAuthConnectModal';

/* ── Inject CSS keyframes for success animations (once) ────────────── */
const ANIM_STYLE_ID = 'step4-success-anims';
function injectAnimStyles() {
  if (document.getElementById(ANIM_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes s4-pop-in {
      0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
      50%  { opacity: 1; transform: scale(1.03) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes s4-glow-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.0), 0 0 20px rgba(34,197,94,0.08); }
      50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0.12), 0 0 35px rgba(34,197,94,0.18); }
    }
    @keyframes s4-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes s4-check-draw {
      0%   { stroke-dashoffset: 36; opacity: 0; }
      40%  { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 1; }
    }
    @keyframes s4-text-reveal {
      0%   { opacity: 0; transform: translateY(8px); filter: blur(4px); }
      100% { opacity: 1; transform: translateY(0); filter: blur(0); }
    }
    @keyframes s4-particle-float {
      0%   { opacity: 0; transform: translateY(0) scale(0); }
      15%  { opacity: 1; transform: translateY(-6px) scale(1); }
      80%  { opacity: 0.8; }
      100% { opacity: 0; transform: translateY(-45px) scale(0.3); }
    }
    @keyframes s4-confetti-1 {
      0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0); }
      20%  { opacity: 1; transform: translate(-18px, -22px) rotate(90deg) scale(1); }
      100% { opacity: 0; transform: translate(-30px, -50px) rotate(270deg) scale(0.2); }
    }
    @keyframes s4-confetti-2 {
      0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0); }
      25%  { opacity: 1; transform: translate(20px, -28px) rotate(-60deg) scale(1); }
      100% { opacity: 0; transform: translate(35px, -55px) rotate(-180deg) scale(0.2); }
    }
    @keyframes s4-confetti-3 {
      0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0); }
      22%  { opacity: 1; transform: translate(-8px, -30px) rotate(120deg) scale(1.1); }
      100% { opacity: 0; transform: translate(-12px, -60px) rotate(360deg) scale(0.15); }
    }
    @keyframes s4-confetti-4 {
      0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0); }
      18%  { opacity: 1; transform: translate(14px, -18px) rotate(-45deg) scale(0.9); }
      100% { opacity: 0; transform: translate(25px, -42px) rotate(-200deg) scale(0.2); }
    }
    @keyframes s4-bar-fill {
      0%   { width: 0%; }
      100% { width: 100%; }
    }
    @keyframes s4-badge-pop {
      0%   { opacity: 0; transform: scale(0.5); }
      60%  { transform: scale(1.15); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

/** Icon lookup mapping */
const TOOL_ICON_MAP = {
  ClipboardList,
  Globe,
  Navigation,
  Calendar,
  Table,
  FolderSync,
};

/** Floating success particles */
const PARTICLES = [
  { color: '#22c55e', size: 5, left: '18%', delay: '0s', dur: '1.8s' },
  { color: '#4ade80', size: 4, left: '35%', delay: '0.2s', dur: '2s' },
  { color: '#86efac', size: 6, left: '52%', delay: '0.35s', dur: '1.6s' },
  { color: '#22c55e', size: 4, left: '68%', delay: '0.15s', dur: '2.1s' },
  { color: '#4ade80', size: 5, left: '82%', delay: '0.4s', dur: '1.9s' },
];

/** Confetti specs burst from the check icon */
const CONFETTI = [
  { color: '#22c55e', anim: 's4-confetti-1', size: 6, delay: '0.1s' },
  { color: '#a855f7', anim: 's4-confetti-2', size: 5, delay: '0.15s' },
  { color: '#3b82f6', anim: 's4-confetti-3', size: 7, delay: '0.05s' },
  { color: '#f59e0b', anim: 's4-confetti-4', size: 5, delay: '0.2s' },
];

export default function Step4Tools({
  agentState,
  theme,
  isKnowledgeUploading = false,
  isKnowledgeReady = true,
  onToggleTool,
  onNext,
  onBack,
}) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModalTool, setSelectedModalTool] = useState(null);
  const [modalType, setModalType] = useState(null); // 'lead_capture' | 'oauth'
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const prevReadyRef = useRef(isKnowledgeReady);

  // Inject keyframes on mount
  useEffect(() => { injectAnimStyles(); }, []);

  // Trigger success animation when isKnowledgeReady transitions false → true
  useEffect(() => {
    if (isKnowledgeReady && !prevReadyRef.current) {
      setShowSuccessAnim(true);
    }
    prevReadyRef.current = isKnowledgeReady;
  }, [isKnowledgeReady]);

  const agentId = agentState?.agent_id || 'agent-cb-99';
  const isDark = theme === 'dark';

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetchToolsCatalog(agentId);
        if (res && res.tools && res.tools.length > 0) {
          setTools(res.tools);
        } else {
          setTools(agentState?.tools || []);
        }
      } catch (err) {
        console.warn('Catalog load note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [agentId]);

  const handleOpenToolModal = (tool) => {
    setSelectedModalTool(tool);
    if (tool.id === 'lead_capture') {
      setModalType('lead_capture');
    } else {
      setModalType('oauth');
    }
  };

  const handleToolSaved = (toolId, newConfig, isEnabled) => {
    setTools(prev => prev.map(t => {
      if (t.id === toolId) {
        return {
          ...t,
          enabled: isEnabled,
          auth_status: isEnabled ? 'connected' : 'disconnected',
          configuration: newConfig,
        };
      }
      return t;
    }));
    if (onToggleTool) {
      onToggleTool(toolId, isEnabled);
    }
  };

  const handleDirectToggle = async (tool) => {
    const nextState = !tool.enabled;
    try {
      await toggleTool(tool.id, nextState, agentId);
      setTools(prev => prev.map(t => (t.id === tool.id ? {
        ...t,
        enabled: nextState,
        auth_status: nextState ? 'connected' : 'disconnected',
      } : t)));
      if (onToggleTool) {
        onToggleTool(tool.id, nextState);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const builtinTools = tools.filter(t => t.category === 'Built-in');
  const activeBuiltinCount = builtinTools.filter(t => t.enabled || t.auth_status === 'connected').length;

  const productivityCapabilities = {
    google_calendar: [
      'View, create, and update events',
      'Check availability',
      'Send meeting invites',
    ],
    google_sheets: [
      'Read and search data',
      'Append or update rows',
      'Create new spreadsheets',
    ],
    google_drive: [
      'Search and list files',
      'Upload and download files',
      'Manage folders and permissions',
    ],
  };

  const moreIntegrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      badge: 'OAuth',
      subtitle: 'Send & manage emails',
      iconColor: '#ef4444',
      iconBg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
      icon: Mail,
    },
    {
      id: 'notion',
      name: 'Notion',
      badge: 'OAuth',
      subtitle: 'Docs & knowledge base',
      iconColor: isDark ? '#ffffff' : '#111827',
      iconBg: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
      icon: FileText,
    },
    {
      id: 'slack',
      name: 'Slack',
      badge: 'OAuth',
      subtitle: 'Channel & messages',
      iconColor: '#e11d48',
      iconBg: isDark ? 'rgba(225, 29, 72, 0.15)' : '#ffe4e6',
      icon: MessageSquare,
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      badge: 'OAuth',
      subtitle: 'CRM & contacts',
      iconColor: '#f97316',
      iconBg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#ffedd5',
      icon: Building,
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
      {/* Outer wrapper — matches Step 2 & 3 maxWidth */}
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
        }}>
          {/* ── SCROLLABLE BODY ────────────────────────────────────────── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem',
            boxSizing: 'border-box',
          }}>
            {/* ── TOP SECTION: CONNECT APPS (OPTIONAL) ────────────────── */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                marginBottom: '0.35rem',
                letterSpacing: '-0.01em',
                color: isDark ? '#ffffff' : '#0f172a',
              }}>
                Connect Apps (optional)
              </h2>
              <p style={{
                color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b',
                fontSize: '0.88rem',
                lineHeight: 1.45,
                marginBottom: '1.25rem',
              }}>
                Link tools like email, CRM, or calendar so your agent can take real actions—or skip this and add them later from your agent dashboard.
              </p>

              {/* Uploading data sources banner */}
              <div style={{
                border: isKnowledgeReady
                  ? (isDark ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #86efac')
                  : (isDark ? '1.5px solid rgba(168, 85, 247, 0.5)' : '1.5px solid #c084fc'),
                borderRadius: '16px',
                padding: '1.6rem 1.5rem',
                textAlign: 'center',
                background: isKnowledgeReady
                  ? (isDark ? 'rgba(34, 197, 94, 0.05)' : '#f0fdf4')
                  : (isDark ? 'rgba(168, 85, 247, 0.04)' : '#faf5ff'),
                marginBottom: '1.25rem',
                boxShadow: isKnowledgeReady
                  ? 'none'
                  : '0 0 25px rgba(168, 85, 247, 0.12)',
                transition: 'all 0.5s ease',
                position: 'relative',
                overflow: 'hidden',
                ...(isKnowledgeReady ? {
                  animation: 's4-pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, s4-glow-pulse 2.5s ease-in-out 0.6s 3',
                } : {}),
              }}>
                {/* Shimmer overlay on success */}
                {isKnowledgeReady && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.08) 45%, rgba(34,197,94,0.15) 50%, rgba(34,197,94,0.08) 55%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 's4-shimmer 2.5s ease-in-out 0.4s 2',
                    pointerEvents: 'none',
                    borderRadius: '16px',
                  }} />
                )}

                {/* Floating particles on success */}
                {isKnowledgeReady && PARTICLES.map((p, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: p.left,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    borderRadius: '50%',
                    background: p.color,
                    animation: `s4-particle-float ${p.dur} ease-out ${p.delay} forwards`,
                    pointerEvents: 'none',
                  }} />
                ))}

                {!isKnowledgeReady ? (
                  <>
                    <div style={{
                      color: isDark ? '#c084fc' : '#7c3aed',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}>
                      <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                      <span>Uploading data sources...</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
                      This usually takes under a minute—please keep this tab open.
                    </div>
                    {/* Animated progress bar */}
                    <div style={{
                      marginTop: '1rem',
                      height: '4px',
                      borderRadius: '2px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '2px',
                        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
                        animation: 's4-bar-fill 8s ease-out forwards',
                        maxWidth: '92%',
                      }} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Animated check icon with confetti burst */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.65rem',
                      position: 'relative',
                    }}>
                      {/* Confetti particles */}
                      {CONFETTI.map((c, i) => (
                        <div key={i} style={{
                          position: 'absolute',
                          width: `${c.size}px`,
                          height: `${c.size}px`,
                          borderRadius: c.size > 5 ? '2px' : '50%',
                          background: c.color,
                          animation: `${c.anim} 1.2s ease-out ${c.delay} forwards`,
                          pointerEvents: 'none',
                        }} />
                      ))}

                      {/* Green circle with animated check */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 's4-badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 36, animation: 's4-check-draw 0.6s ease-out 0.3s forwards', opacity: 0 }}>
                          <polyline points="6 12 10 16 18 8" />
                        </svg>
                      </div>
                    </div>

                    {/* Success title with staggered reveal */}
                    <div style={{
                      color: '#16a34a',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      animation: 's4-text-reveal 0.5s ease-out 0.45s forwards',
                      opacity: 0,
                    }}>
                      <Sparkles size={18} color="#22c55e" />
                      <span>Data sources uploaded & indexed successfully</span>
                    </div>

                    {/* Subtitle with later reveal */}
                    <div style={{
                      fontSize: '0.85rem',
                      color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
                      animation: 's4-text-reveal 0.5s ease-out 0.65s forwards',
                      opacity: 0,
                    }}>
                      {(agentState?.knowledge_items?.length || 0)} knowledge source(s) stored and embedded into vector memory.
                    </div>

                    {/* Completed progress bar */}
                    <div style={{
                      marginTop: '1rem',
                      height: '4px',
                      borderRadius: '2px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                      overflow: 'hidden',
                      animation: 's4-text-reveal 0.4s ease-out 0.8s forwards',
                      opacity: 0,
                    }}>
                      <div style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '2px',
                        background: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac)',
                      }} />
                    </div>
                  </>
                )}
              </div>

              {/* Click Connect helper text */}
              <div style={{
                fontSize: '0.85rem',
                color: isDark ? 'rgba(255,255,255,0.75)' : '#475569',
                marginBottom: '1.15rem',
              }}>
                Click <strong style={{ color: isDark ? '#fff' : '#0f172a' }}>Connect</strong> to configure and add connectors to your agent.{' '}
                <span style={{ color: '#8b5cf6', fontWeight: 600, cursor: 'pointer' }}>
                  Manage connected accounts.
                </span>
              </div>

              {/* Project connection access info box */}
              <div style={{
                background: isDark ? 'rgba(59, 130, 246, 0.05)' : '#eff6ff',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'}`,
                borderRadius: '12px',
                padding: '0.9rem 1.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}>
                <ShieldCheck size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isDark ? '#93c5fd' : '#1e40af', marginBottom: '0.15rem' }}>
                    Project connection access
                  </div>
                  <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.65)' : '#3b82f6', lineHeight: 1.45 }}>
                    Accounts connected here are available to members who can access the Default project. Credentials stay scoped to this project.
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 1: BUILT-IN CAPABILITIES ──────────────────────── */}
            <div style={{
              background: isDark ? '#16171e' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                      Built-in Capabilities
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}>
                      {activeBuiltinCount} of {builtinTools.length || 3} Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '2px' }}>
                    Core capabilities available to your agent.
                  </div>
                </div>
                <button
                  onClick={() => handleOpenToolModal(builtinTools[0] || { id: 'lead_capture' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <SlidersHorizontal size={13} color="#8b5cf6" />
                  <span>Manage Built-ins</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.2rem',
              }}>
                {builtinTools.map(tool => {
                  const IconComponent = TOOL_ICON_MAP[tool.icon] || Globe;
                  const isConnected = tool.enabled || tool.auth_status === 'connected';

                  return (
                    <div
                      key={tool.id}
                      style={{
                        background: isDark ? '#111218' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#ede9fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8b5cf6',
                            flexShrink: 0,
                          }}>
                            <IconComponent size={20} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tool.name}</span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              background: isConnected ? 'rgba(34, 197, 94, 0.15)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                              color: isConnected ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.5)' : '#64748b'),
                            }}>
                              {isConnected ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          color: isDark ? 'rgba(255,255,255,0.65)' : '#475569',
                          marginBottom: '1.15rem',
                          minHeight: '2.5rem',
                        }}>
                          {tool.description}
                        </p>
                      </div>

                      {tool.id === 'lead_capture' ? (
                        <button
                          onClick={() => handleOpenToolModal(tool)}
                          style={{
                            width: '100%',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                            background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <Settings size={14} color="#8b5cf6" />
                          <span>Configure Form</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDirectToggle(tool)}
                          style={{
                            width: '100%',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            border: isConnected
                              ? `1px solid ${isDark ? 'rgba(34,197,94,0.35)' : '#86efac'}`
                              : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                            background: isConnected
                              ? (isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4')
                              : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
                            color: isConnected ? '#22c55e' : (isDark ? '#ffffff' : '#0f172a'),
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          {isConnected ? (
                            <>
                              <Check size={14} />
                              <span>Connected</span>
                            </>
                          ) : (
                            <span>Connect</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 2: PRODUCTIVITY & DATA (Calendar, Sheets, Drive) ─── */}
            <div style={{
              background: isDark ? '#16171e' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Productivity & Data
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '2px' }}>
                  Connect tools to let your agent work with your data and daily workflows.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['google_calendar', 'google_sheets', 'google_drive'].map(toolId => {
                  const tool = tools.find(t => t.id === toolId) || {
                    id: toolId,
                    name: toolId === 'google_calendar' ? 'Google Calendar' : toolId === 'google_sheets' ? 'Google Sheets' : 'Google Drive',
                    badge: 'OAuth',
                    enabled: false,
                    auth_status: 'disconnected',
                  };
                  const isConnected = tool.enabled || tool.auth_status === 'connected';

                  const getToolRowMeta = (id) => {
                    if (id === 'google_calendar') {
                      return {
                        icon: Calendar,
                        iconColor: '#3b82f6',
                        iconBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
                        description: 'Schedule meetings, check availability, and manage events.',
                      };
                    }
                    if (id === 'google_sheets') {
                      return {
                        icon: Table,
                        iconColor: '#10b981',
                        iconBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
                        description: 'Read, write, and manage your spreadsheets.',
                      };
                    }
                    return {
                      icon: FolderSync,
                      iconColor: '#f59e0b',
                      iconBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                      description: 'Access, search, and manage files and folders.',
                    };
                  };

                  const meta = getToolRowMeta(toolId);
                  const RowIcon = meta.icon;
                  const bullets = productivityCapabilities[toolId] || [];

                  return (
                    <div
                      key={toolId}
                      style={{
                        background: isDark ? '#111218' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(240px, 1.2fr) minmax(220px, 1.2fr) 180px',
                        gap: '1.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: meta.iconBg,
                          color: meta.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <RowIcon size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>{tool.name}</span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(234, 179, 8, 0.15)',
                              color: '#eab308',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                            }}>
                              Coming Soon
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                            margin: 0,
                          }}>
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, paddingLeft: '1.25rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          What your agent can do
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.75)' : '#334155', lineHeight: 1.45 }}>
                          {bullets.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.65rem 1rem',
                            borderRadius: '8px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <Lock size={14} />
                          <span>Coming Soon</span>
                        </button>
                        <span style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                          Native OAuth in development
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 3: MORE INTEGRATIONS ──────────────────────────── */}
            <div style={{
              background: isDark ? '#16171e' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    More Integrations
                  </div>
                  <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '2px' }}>
                    Expand your agent's capabilities with 3rd party apps and services.
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8', cursor: 'pointer' }}>
                  View All Integrations &gt;
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
              }}>
                {moreIntegrations.map(app => {
                  const AppIcon = app.icon;
                  return (
                    <div
                      key={app.id}
                      style={{
                        background: isDark ? '#111218' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: app.iconBg,
                            color: app.iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <AppIcon size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{app.name}</span>
                              <span style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(124, 58, 237, 0.15)',
                                color: '#a855f7',
                              }}>
                                {app.badge}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', marginBottom: '0.75rem' }}>
                          {app.subtitle}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenToolModal({ id: app.id, name: app.name, icon: 'Globe', badge: 'OAuth', description: app.subtitle, default_config: {} })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#818cf8',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <span>Connect</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 4: SECURITY BANNER ────────────────────────────── */}
            <div style={{
              background: isDark ? 'rgba(99, 102, 241, 0.04)' : '#f8faff',
              border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff'}`,
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', maxWidth: '480px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Lock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Your data is secure</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', lineHeight: 1.4 }}>
                    We use industry-standard encryption and OAuth protocols. You're always in control.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#22c55e', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>End-to-end encryption</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                  <Shield size={16} />
                  <span>Read-only when possible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#f43f5e', fontWeight: 600 }}>
                  <XCircle size={16} />
                  <span>Revoke anytime</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER ATTACHED TO CARD BOTTOM (MATCHING PREVIOUS PAGES) ── */}
          <div style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: isDark ? '#121319' : '#ffffff',
          }}>
            <span style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#64748b' }}>
              Step 4 of 5
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onBack}
                style={{
                  background: 'transparent',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                  color: isDark ? '#fff' : '#0f172a',
                  padding: '0.55rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <ArrowLeft size={16} />
                <span>Back to Knowledge</span>
              </button>

              <button
                onClick={() => {
                  if (isKnowledgeReady && onNext) {
                    onNext();
                  }
                }}
                disabled={!isKnowledgeReady}
                style={{
                  background: isKnowledgeReady ? '#7c3aed' : (isDark ? 'rgba(124,58,237,0.3)' : '#e2e8f0'),
                  border: 'none',
                  color: isKnowledgeReady ? '#fff' : (isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'),
                  padding: '0.6rem 2.2rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: isKnowledgeReady ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s ease',
                  boxShadow: isKnowledgeReady ? '0 4px 18px rgba(124,58,237,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={e => { if (isKnowledgeReady) e.currentTarget.style.background = '#6d28d9'; }}
                onMouseLeave={e => { if (isKnowledgeReady) e.currentTarget.style.background = '#7c3aed'; }}
              >
                <span>{!isKnowledgeReady ? 'Processing Knowledge Base...' : 'Proceed to Playground & Sandbox'}</span>
                {isKnowledgeReady ? (
                  <ArrowRight size={16} />
                ) : (
                  <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      {selectedModalTool && modalType === 'lead_capture' && (
        <LeadCaptureModal
          agentId={agentId}
          tool={selectedModalTool}
          theme={theme}
          onClose={() => setSelectedModalTool(null)}
          onSave={handleToolSaved}
        />
      )}

      {selectedModalTool && modalType === 'oauth' && (
        <OAuthConnectModal
          agentId={agentId}
          tool={selectedModalTool}
          theme={theme}
          onClose={() => setSelectedModalTool(null)}
          onSave={handleToolSaved}
        />
      )}
    </div>
  );
}
