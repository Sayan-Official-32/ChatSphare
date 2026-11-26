/**
 * @file Sidebar.jsx
 * @description Enterprise Animated Navigation Sidebar Component with Spring Physics.
 * 
 * Features:
 * 1. Hover-expandable width transition (68px collapsed rail ↔ 264px expanded panel) with spring cubic-bezier curves.
 * 2. Staged inner content fade-in/fade-out transitions.
 * 3. Collapsible multi-level nav groups ('Brand Agents', 'AI Workforce').
 * 4. External fixed profile dropdown menu with space credit balance, profile settings, and multi-layer sign-out.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Bot,
  LayoutGrid,
  Library,
  BarChart2,
  HelpCircle,
  BookOpen,
  User,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  RefreshCw,
  Users,
  Settings,
  Gift,
  LogOut,
  Loader2,
} from 'lucide-react';
import { auth, signOut as firebaseSignOut } from '@/lib/firebaseClient';
import { logoutBFFSession } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import chatSphareLogo from '@/assets/chatsphare_logo.png';


/* Animation Timing Constants */
const RAIL_W      = '68px';
const EXPANDED_W  = '264px';
const SPRING      = 'cubic-bezier(0.34, 1.06, 0.64, 1)';
const EASE_OUT    = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const WIDTH_DUR   = '0.32s';
const FADE_DUR    = '0.18s';

/**
 * Generates an inline style object for animated text and icon elements.
 * 
 * @param {boolean} isExpanded - Whether sidebar is currently expanded.
 * @param {string} [delay='0.14s'] - CSS transition delay string.
 * @returns {React.CSSProperties} CSS properties object.
 */
function fadeStyle(isExpanded, delay = '0.14s') {
  return {
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-6px)',
    transition: isExpanded
      ? `opacity ${FADE_DUR} ${EASE_OUT} ${delay}, transform ${FADE_DUR} ${EASE_OUT} ${delay}`
      : `opacity 0.08s ease 0s, transform 0.08s ease 0s`,
    pointerEvents: isExpanded ? 'auto' : 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };
}

/**
 * Enterprise Animated Sidebar component.
 * 
 * @param {Object} props - React props.
 * @param {Object} [props.user] - Currently authenticated user profile object.
 * @param {string} [props.activeTab='agents'] - Identifier of currently selected tab.
 * @param {Function} props.onSelectTab - Tab selection callback handler.
 * @param {number|null} [props.spaceCredits=null] - Available workspace credit balance.
 * @returns {JSX.Element} Sidebar JSX component.
 */
export default function Sidebar({
  user,
  activeTab  = 'agents',
  onSelectTab,
  spaceCredits = null,
  creditStats = null,
  isRefreshingCredits = false,
  onRefreshCredits,
  isDark: isDarkProp,
  theme: themeProp,
}) {
  const navigate = useNavigate();
  const { setUser } = useAuth(); // To clear global auth state on sign-out

  const { isDark: contextIsDark } = useTheme();

  // Dynamically resolve theme mode with fallback to centralized hook
  const isDark = themeProp
    ? themeProp === 'dark'
    : (isDarkProp !== undefined ? isDarkProp : contextIsDark);


  const [isHovered,        setIsHovered]        = useState(false);
  const [isPinned,         setIsPinned]          = useState(false);
  const [brandAgentsOpen,  setBrandAgentsOpen]   = useState(false);
  const [aiWorkforceOpen,  setAiWorkforceOpen]   = useState(false);
  const [profileMenuOpen,  setProfileMenuOpen]   = useState(false);
  const [signingOut,       setSigningOut]        = useState(false);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [menuAnchor,       setMenuAnchor]        = useState({ left: 0, bottom: 0 });
  const profileCardRef = useRef(null);
  const asideRef       = useRef(null);

  const isExpanded = isHovered || isPinned || profileMenuOpen;
  const isRefreshing = isRefreshingCredits || internalRefreshing;

  const triggerRefreshCredits = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isRefreshing) return;
    setInternalRefreshing(true);
    try {
      if (onRefreshCredits) {
        await onRefreshCredits();
      } else {
        window.dispatchEvent(new CustomEvent('chatsphare:credits_updated'));
      }
    } finally {
      setTimeout(() => setInternalRefreshing(false), 500);
    }
  };

  const [imgError, setImgError] = useState(false);
  const userName  = user?.displayName || user?.display_name
                 || (user?.email ? user.email.split('@')[0] : 'User');
  const userPhoto = user?.photoURL || user?.photo_url || user?.avatar_url || user?.picture || user?.providerData?.[0]?.photoURL || null;

  /* Theme tokens */
  const asideBg = isDark ? '#09090b' : '#ffffff';
  const asideBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.75)' : '#475569';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8';
  const cardBg = isDark ? '#111117' : '#f8fafc';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0';
  const activeSubItemBg = isDark ? '#16161f' : '#f3e8ff';
  const activeSubItemColor = isDark ? '#ffffff' : '#6b21a8';
  const dividerBg = isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0';
  const popupBg = isDark ? '#111117' : '#ffffff';
  const popupBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  /**
   * Toggles profile popup menu and calculates viewport anchor coordinates.
   * Expands sidebar to maximum size (264px) and triggers fresh space credits sync.
   */
  const handleToggleProfileMenu = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!profileMenuOpen) {
      triggerRefreshCredits();
      if (asideRef.current) {
        const rect = asideRef.current.getBoundingClientRect();
        const expandedRight = rect.left + 264; // EXPANDED_W width
        setMenuAnchor({ left: expandedRight + 8, bottom: window.innerHeight - rect.bottom + 4 });
      }
    }
    setProfileMenuOpen(prev => !prev);
  };

  /**
   * Executes multi-layer sign-out (Firebase + BFF Cookie + React Context) and redirects home.
   */
  const handleSignOut = async () => {
    setSigningOut(true);
    setProfileMenuOpen(false);
    try {
      await Promise.allSettled([
        firebaseSignOut(auth),  // Firebase sign-out
        logoutBFFSession(),     // BFF cookie clear
      ]);
      setUser(null);            // Clear React context immediately
      // Purge all user-scoped storage items and residual cached tokens
      try {
        localStorage.removeItem('chatsphare_token');
        sessionStorage.removeItem('chatsphare_token');
        sessionStorage.removeItem('chatsphare_initial_url');
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('chatsphare_wizard_draft') || k.startsWith('cb_conv_') || k.startsWith('cb_celebrated_')) {
            localStorage.removeItem(k);
          }
        });
      } catch (e) {
        console.warn('Storage purge notice:', e);
      }
    } finally {
      setSigningOut(false);
      navigate('/', { replace: true }); // Redirect to home / landing
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        profileCardRef.current && !profileCardRef.current.contains(e.target) &&
        !e.target.closest('[data-profile-menu]')
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  /* Centralized navigation routing for all sidebar tabs */
  const handleNavClick = (id) => {
    if (onSelectTab) onSelectTab(id);
    switch (id) {
      case 'agents':
        navigate('/app/agents');
        break;
      case 'conversations':
        navigate('/app/conversations');
        break;
      case 'leads':
        navigate('/app/leads');
        break;
      case 'agent-spaces':
        navigate('/app/agent-spaces');
        break;
      case 'tools-skills':
        navigate('/app/tools-skills');
        break;
      case 'runs-schedules':
        navigate('/app/runs-schedules');
        break;
      case 'templates':
        navigate('/app/templates');
        break;
      case 'knowledge':
        navigate('/app/knowledge-bases');
        break;
      case 'insights':
        navigate('/app/insights');
        break;
      case 'support':
        navigate('/app/support');
        break;
      case 'documentation':
        navigate('/app/docs');
        break;
      case 'pricing':
        navigate('/app/pricing');
        break;
      case 'profile':
        navigate('/app/profile');
        break;
      default:
        navigate(`/app/${id}`);
        break;
    }
  };

  /* Shared nav-item row style */
  const navRow = (active) => ({
    display:        'flex',
    alignItems:     'center',
    gap:            '0.7rem',
    padding:        '0.52rem 0.65rem',
    borderRadius:   '9px',
    cursor:         'pointer',
    background:     active ? (isDark ? 'rgba(124,58,237,0.18)' : '#ede9fe') : 'transparent',
    color:          active ? (isDark ? '#c4b5fd' : '#6d28d9') : textSecondary,
    transition:     'background 0.18s ease, color 0.18s ease',
    overflow:       'hidden',
  });

  /* Icon wrapper */
  const iconWrap = {
    flexShrink: 0,
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth:   '22px',
  };

  return (
    <>
    {/* Fixed Profile Popup Menu — rendered outside sidebar to prevent clipping */}
    <div
      data-profile-menu
      style={{
        position:   'fixed',
        left:       `${menuAnchor.left}px`,
        bottom:     `${menuAnchor.bottom}px`,
        width:      '240px',
        background: popupBg,
        border:     `1px solid ${popupBorder}`,
        borderRadius: '14px',
        padding:    '0.75rem',
        boxShadow:  isDark ? '0 8px 40px rgba(0,0,0,0.7)' : '0 8px 30px rgba(0,0,0,0.12)',
        zIndex:     9999,
        opacity:        profileMenuOpen ? 1 : 0,
        transform:      profileMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(6px)',
        transformOrigin: 'bottom left',
        pointerEvents:  profileMenuOpen ? 'auto' : 'none',
        transition: [
          'opacity   0.22s ease',
          'transform 0.24s cubic-bezier(0.34,1.06,0.64,1)',
        ].join(', '),
      }}
    >
      {/* User name header */}
      <div style={{ padding: '0.3rem 0.5rem 0.65rem', borderBottom: `1px solid ${dividerBg}`, marginBottom: '0.55rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: textPrimary }}>{userName}</span>
      </div>

      {/* Space Credits card */}
      <div style={{
        background:   isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff',
        border:       `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : '#ddd6fe'}`,
        borderRadius: '10px',
        padding:      '0.65rem 0.75rem',
        marginBottom: '0.55rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
          <div
            onClick={triggerRefreshCredits}
            title="Refresh space credits"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <RefreshCw
              size={14}
              color={isDark ? '#a78bfa' : '#7c3aed'}
              style={{
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
                transition: 'transform 0.3s ease',
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary }}>Space credits</span>
          </div>
          {creditStats?.plan_tier && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.12rem 0.4rem',
              borderRadius: '9999px',
              background: isDark ? 'rgba(124,58,237,0.25)' : '#ede9fe',
              color: isDark ? '#c4b5fd' : '#6d28d9',
            }}>
              {creditStats.plan_tier}
            </span>
          )}
        </div>
        {[
          {
            label: 'Remaining',
            value: creditStats?.remaining !== undefined
              ? creditStats.remaining.toLocaleString()
              : (spaceCredits !== null && spaceCredits !== undefined ? spaceCredits?.toLocaleString() : '—'),
            accent: false,
          },
          {
            label: 'Total',
            value: creditStats?.total !== undefined
              ? creditStats.total.toLocaleString()
              : (spaceCredits !== null && spaceCredits !== undefined ? spaceCredits?.toLocaleString() : '2,000'),
            accent: false,
          },
          {
            label: 'Used',
            value: creditStats?.used !== undefined
              ? creditStats.used.toLocaleString()
              : '0',
            accent: false,
          },
          {
            label: 'Remaining',
            value: creditStats?.remaining_percent !== undefined
              ? `${creditStats.remaining_percent}%`
              : '100%',
            accent: true,
          },
        ].map(({ label, value, accent }) => (
          <div key={label + value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.18rem 0' }}>
            <span style={{ fontSize: '0.78rem', color: textMuted }}>{label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: accent ? (isDark ? '#a78bfa' : '#7c3aed') : textPrimary }}>{value}</span>
          </div>
        ))}
        {/* Subtle Credit Consumption Bar */}
        <div style={{
          marginTop: '0.45rem',
          height: '4px',
          width: '100%',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, creditStats?.remaining_percent ?? 100))}%`,
              background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Menu Items */}
      {[
        { Icon: User,     label: 'Profile',            action: () => { setProfileMenuOpen(false); navigate('/app/profile'); } },
        { Icon: Settings, label: 'Teamspace settings', action: () => setProfileMenuOpen(false) },
        { Icon: Gift,     label: 'Affiliate program',  action: () => setProfileMenuOpen(false) },
      ].map(({ Icon, label, action }) => (
        <div
          key={label}
          onClick={action}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.6rem', borderRadius: '8px', cursor: 'pointer', color: textSecondary, fontSize: '0.88rem', fontWeight: 500, transition: 'background 0.15s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon size={17} />
          <span>{label}</span>
        </div>
      ))}

      {/* Divider */}
      <div style={{ height: '1px', background: dividerBg, margin: '0.35rem 0' }} />

      {/* Sign Out */}
      <div
        onClick={signingOut ? undefined : handleSignOut}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          padding: '0.55rem 0.6rem', borderRadius: '8px',
          cursor:  signingOut ? 'not-allowed' : 'pointer',
          color:   '#ef4444', fontSize: '0.88rem', fontWeight: 600,
          opacity: signingOut ? 0.6 : 1,
          transition: 'background 0.15s ease, opacity 0.15s ease',
        }}
        onMouseEnter={e => { if (!signingOut) e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {signingOut
          ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
          : <LogOut size={17} />}
        <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
      </div>
    </div>

    <aside
      ref={asideRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width:          isExpanded ? EXPANDED_W : RAIL_W,
        height:         '100vh',
        flexShrink:     0,
        background:     asideBg,
        borderRight:    `1px solid ${asideBorder}`,
        boxShadow:      isDark
                          ? (isExpanded ? '6px 0 28px rgba(0,0,0,0.55)' : '2px 0 8px rgba(0,0,0,0.25)')
                          : (isExpanded ? '6px 0 28px rgba(0,0,0,0.08)' : '2px 0 8px rgba(0,0,0,0.03)'),
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        overflow:       'hidden',
        padding:        '1rem 0.7rem',
        boxSizing:      'border-box',
        userSelect:     'none',
        position:       'relative',
        zIndex:         50,
        transition: [
          `width      ${WIDTH_DUR} ${SPRING}`,
          `box-shadow ${WIDTH_DUR} ${EASE_OUT}`,
          `background 0.25s ease`,
          `border-color 0.25s ease`,
        ].join(', '),
      }}
    >
      {/* TOP SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* 1. Header ─ Logo + brand name + pin toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '36px' }}>

          {/* Logo mark */}
          <div style={{
            width:          isExpanded ? '140px' : '34px',
            height:         '34px',
            borderRadius:   '8px',
            overflow:       'hidden',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'flex-start',
            flexShrink:     0,
            transition:     `width ${WIDTH_DUR} ${SPRING}`,
          }}>
            <img
              src={chatSphareLogo}
              alt="ChatSphare Logo"
              style={{
                height: '34px',
                width: isExpanded ? 'auto' : '120px',
                maxHeight: '34px',
                objectFit: isExpanded ? 'contain' : 'cover',
                objectPosition: 'left center',
                filter: isDark ? 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.45))' : 'none',
                transition: `all ${WIDTH_DUR} ${SPRING}`,
                transform: isExpanded ? 'scale(1)' : 'scale(0.95)',
              }}
            />
          </div>

          {/* Pin toggle button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            style={{
              background:   isPinned ? (isDark ? 'rgba(124,58,237,0.3)' : '#ede9fe') : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
              border:       isPinned ? `1px solid ${isDark ? 'rgba(124,58,237,0.55)' : '#c4b5fd'}` : `1px solid ${cardBorder}`,
              borderRadius: '8px',
              color:        isPinned ? (isDark ? '#c4b5fd' : '#7c3aed') : textMuted,
              width:        '28px',
              height:       '28px',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              cursor:       'pointer',
              flexShrink:   0,
              transition:   'all 0.2s ease',
              ...fadeStyle(isExpanded, '0.08s'),
            }}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          >
            <ChevronRight size={15} style={{
              transform:  isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform 0.28s ${SPRING}`,
            }} />
          </button>
        </div>

        {/* 2. Workspace Selector */}
        <div style={{
          background:   cardBg,
          border:       `1px solid ${cardBorder}`,
          borderRadius: '12px',
          padding:      '0.58rem 0.7rem',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          cursor:       'pointer',
          overflow:     'hidden',
          transition:   `border-color 0.2s ease, background 0.2s ease`,
          gap:          '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
            <div style={{
              width:          '28px',
              height:         '28px',
              borderRadius:   '7px',
              background:     isDark ? '#1c1c28' : '#ede9fe',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          isDark ? '#a78bfa' : '#7c3aed',
              flexShrink:     0,
            }}>
              <Users size={15} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...fadeStyle(isExpanded, '0.12s') }}>
              <span style={{ fontSize: '0.83rem', fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>
                {userName.split(' ')[0]}'s Space
              </span>
              <span style={{
                fontSize:   '0.63rem',
                color:      textMuted,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                padding:    '1px 6px',
                borderRadius: '4px',
                marginTop:  '2px',
                width:      'fit-content',
              }}>
                Workspace
              </span>
            </div>
          </div>

          <div style={{ flexShrink: 0, ...fadeStyle(isExpanded, '0.15s') }}>
            <ChevronsUpDown size={15} color={textMuted} />
          </div>
        </div>

        {/* 3. Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>

          {/* BRAND AGENTS group header */}
          <div
            onClick={() => setBrandAgentsOpen(prev => !prev)}
            style={navRow((['agents', 'conversations', 'leads'].includes(activeTab) && !brandAgentsOpen) || (activeTab === 'agents' && !isExpanded))}
            title={!isExpanded ? 'Brand Agents' : undefined}
          >
            <div style={iconWrap}>
              <Megaphone size={19} style={{ transition: `color 0.18s ease` }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1, ...fadeStyle(isExpanded, '0.12s') }}>
              Brand Agents
            </span>
            <div style={{ flexShrink: 0, ...fadeStyle(isExpanded, '0.12s') }}>
              <ChevronDown size={15} style={{
                color:      textMuted,
                transform:  brandAgentsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.22s ease',
              }} />
            </div>
          </div>

          {/* Brand Agents sub-items */}
          <div style={{
            marginLeft:   '1rem',
            paddingLeft:  '0.7rem',
            borderLeft:   `1px solid ${dividerBg}`,
            display:      'flex',
            flexDirection: 'column',
            gap:          '0.2rem',
            overflow:     'hidden',
            maxHeight:    isExpanded && brandAgentsOpen ? '200px' : '0px',
            opacity:      isExpanded && brandAgentsOpen ? 1 : 0,
            transition: [
              `max-height 0.28s ${EASE_OUT} ${isExpanded ? '0.06s' : '0s'}`,
              `opacity    0.20s ease       ${isExpanded && brandAgentsOpen ? '0.10s' : '0s'}`,
            ].join(', '),
          }}>
            {[
              { id: 'agents',        label: 'Agents'        },
              { id: 'conversations', label: 'Conversations' },
              { id: 'leads',         label: 'Leads'         },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  padding:      '0.45rem 0.7rem',
                  borderRadius: '7px',
                  fontSize:     '0.84rem',
                  fontWeight:   activeTab === item.id ? 700 : 500,
                  color:        activeTab === item.id ? activeSubItemColor : textSecondary,
                  background:   activeTab === item.id ? activeSubItemBg : 'transparent',
                  boxShadow:    activeTab === item.id ? 'inset 2px 0 0 #7c3aed' : 'none',
                  cursor:       'pointer',
                  transition:   'background 0.15s ease, color 0.15s ease',
                  whiteSpace:   'nowrap',
                }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* AI WORKFORCE group header */}
          <div
            onClick={() => setAiWorkforceOpen(prev => !prev)}
            style={{ ...navRow((['agent-spaces', 'tools-skills', 'runs-schedules'].includes(activeTab) && !aiWorkforceOpen) || (activeTab === 'workforce' && !isExpanded)), marginTop: '0.35rem' }}
            title={!isExpanded ? 'AI Workforce' : undefined}
          >
            <div style={iconWrap}>
              <Bot size={19} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1, ...fadeStyle(isExpanded, '0.13s') }}>
              AI Workforce
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, ...fadeStyle(isExpanded, '0.13s') }}>
              <span style={{
                fontSize:     '0.6rem',
                fontWeight:   700,
                color:        isDark ? '#a78bfa' : '#7c3aed',
                background:   isDark ? 'rgba(124,58,237,0.2)' : '#ede9fe',
                border:       `1px solid ${isDark ? 'rgba(124,58,237,0.4)' : '#ddd6fe'}`,
                padding:      '1px 5px',
                borderRadius: '9px',
              }}>
                Beta
              </span>
              <ChevronDown size={15} style={{
                color:      textMuted,
                transform:  aiWorkforceOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.22s ease',
              }} />
            </div>
          </div>

          {/* AI Workforce sub-items */}
          <div style={{
            marginLeft:   '1rem',
            paddingLeft:  '0.7rem',
            borderLeft:   `1px solid ${dividerBg}`,
            display:      'flex',
            flexDirection: 'column',
            gap:          '0.2rem',
            overflow:     'hidden',
            maxHeight:    isExpanded && aiWorkforceOpen ? '200px' : '0px',
            opacity:      isExpanded && aiWorkforceOpen ? 1 : 0,
            transition: [
              `max-height 0.28s ${EASE_OUT} ${isExpanded ? '0.07s' : '0s'}`,
              `opacity    0.20s ease       ${isExpanded && aiWorkforceOpen ? '0.11s' : '0s'}`,
            ].join(', '),
          }}>
            {[
              { id: 'agent-spaces',    label: 'Agent Spaces'    },
              { id: 'tools-skills',    label: 'Tools & Skills'  },
              { id: 'runs-schedules',  label: 'Runs / Schedules' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  padding:      '0.45rem 0.7rem',
                  borderRadius: '7px',
                  fontSize:     '0.84rem',
                  fontWeight:   activeTab === item.id ? 700 : 500,
                  color:        activeTab === item.id ? activeSubItemColor : textSecondary,
                  background:   activeTab === item.id ? activeSubItemBg : 'transparent',
                  boxShadow:    activeTab === item.id ? 'inset 2px 0 0 #7c3aed' : 'none',
                  cursor:       'pointer',
                  transition:   'background 0.15s ease, color 0.15s ease',
                  whiteSpace:   'nowrap',
                }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Single nav items (Templates, Knowledge, Insights) */}
          {[
            { id: 'templates', label: 'Templates',       Icon: LayoutGrid },
            { id: 'knowledge', label: 'Knowledge Bases', Icon: Library    },
            { id: 'insights',  label: 'Insights',        Icon: BarChart2  },
          ].map(({ id, label, Icon }, i) => (
            <div
              key={id}
              onClick={() => handleNavClick(id)}
              style={navRow(activeTab === id)}
              title={!isExpanded ? label : undefined}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={iconWrap}>
                <Icon size={19} />
              </div>
              <span style={{
                fontWeight: 600,
                fontSize:   '0.88rem',
                ...fadeStyle(isExpanded, `${0.14 + i * 0.02}s`),
              }}>
                {label}
              </span>
            </div>
          ))}

        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

        {/* Upgrade Space button */}
        <div style={{
          overflow:   'hidden',
          maxHeight:  isExpanded ? '60px' : '0px',
          opacity:    isExpanded ? 1 : 0,
          transition: [
            `max-height 0.28s ${EASE_OUT} ${isExpanded ? '0.08s' : '0s'}`,
            `opacity    0.20s ease       ${isExpanded ? '0.14s' : '0s'}`,
          ].join(', '),
        }}>
          <button
            onClick={() => handleNavClick('pricing')}
            style={{
              width:          '100%',
              padding:        '0.65rem 1rem',
              borderRadius:   '11px',
              background:     activeTab === 'pricing'
                ? 'linear-gradient(135deg,#9333ea 0%,#4f46e5 100%)'
                : 'linear-gradient(135deg,#7c3aed 0%,#6366f1 100%)',
              border:         activeTab === 'pricing'
                ? '2px solid rgba(255,255,255,0.85)'
                : 'none',
              color:          '#fff',
              fontWeight:     700,
              fontSize:       '0.88rem',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.45rem',
              cursor:         'pointer',
              boxShadow:      activeTab === 'pricing'
                ? '0 0 0 3px rgba(167,139,250,0.5), 0 6px 22px rgba(124,58,237,0.65)'
                : '0 4px 16px rgba(124,58,237,0.45)',
              whiteSpace:     'nowrap',
              transform:      activeTab === 'pricing' ? 'scale(1.02)' : 'none',
              transition:     'all 0.2s ease',
            }}
          >
            <Sparkles size={15} />
            <span>Upgrade Space</span>
            <Zap size={15} />
          </button>
        </div>

        {/* Support & Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {[
            { id: 'support',       Icon: HelpCircle, label: 'Contact Support' },
            { id: 'documentation', Icon: BookOpen,   label: 'Documentation'   },
          ].map(({ id, Icon, label }, i) => (
            <div
              key={id}
              onClick={() => handleNavClick(id)}
              style={navRow(activeTab === id)}
              title={!isExpanded ? label : undefined}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={iconWrap}><Icon size={18} /></div>
              <span style={{ fontSize: '0.86rem', fontWeight: 500, ...fadeStyle(isExpanded, `${0.10 + i * 0.03}s`) }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: dividerBg, flexShrink: 0 }} />

        {/* User Account Card + Profile Dropdown trigger */}
        <div ref={profileCardRef} style={{ position: 'relative' }}>
          <div
            onClick={handleToggleProfileMenu}
            style={{
              background:     profileMenuOpen ? (isDark ? '#1a1a26' : '#ede9fe') : cardBg,
              border:         `1px solid ${profileMenuOpen ? (isDark ? 'rgba(124,58,237,0.4)' : '#c4b5fd') : cardBorder}`,
              borderRadius:   '12px',
              padding:        '0.58rem 0.65rem',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              cursor:         isExpanded ? 'pointer' : 'default',
              overflow:       'hidden',
              gap:            '0.5rem',
              transition:     'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            {/* Avatar */}
            <div style={{
              width:          '32px',
              height:         '32px',
              borderRadius:   '50%',
              background:     isDark ? '#1e1b4b' : '#ede9fe',
              border:         `1px solid ${isDark ? 'rgba(124,58,237,0.5)' : '#c4b5fd'}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          isDark ? '#a78bfa' : '#7c3aed',
              overflow:       'hidden',
              flexShrink:     0,
            }}>
              {userPhoto && !imgError ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + credits */}
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              flex:          1,
              overflow:      'hidden',
              ...fadeStyle(isExpanded, '0.13s'),
            }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
              <span style={{ fontSize: '0.72rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1px' }}>
                {spaceCredits !== null && spaceCredits !== undefined ? `${spaceCredits.toLocaleString()} ` : ''}Space credits
                {isRefreshing && (
                  <RefreshCw
                    size={10}
                    color={isDark ? '#a78bfa' : '#7c3aed'}
                    style={{ animation: 'spin 0.8s linear infinite', marginLeft: '2px' }}
                  />
                )}
              </span>
            </div>

            {/* Right chevron */}
            <div style={{
              flexShrink: 0,
              color: profileMenuOpen ? '#a78bfa' : textMuted,
              transition: 'color 0.2s ease',
              ...fadeStyle(isExpanded, '0.15s'),
            }}>
              <ChevronRight
                size={15}
                style={{
                  transform:  profileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.34,1.06,0.64,1)',
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </aside>
    </>
  );
}
