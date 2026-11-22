/**
 * @file AppLayout.jsx
 * @description Enterprise Common Application Shell Layout.
 * 
 * Provides a persistent Left Navigation Sidebar for all authenticated app routes (/app/*).
 * Ensures that navigating between /app/agents, /app/pricing, /app/conversations, etc.
 * maintains sidebar DOM persistence without unmounting, resetting animations, or visual flickers.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import { fetchUserCredits } from '@/services/api';

export default function AppLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const location = useLocation();

  // Active credit balance stats
  const [creditStats, setCreditStats] = useState(null);
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);

  const loadCredits = async (silent = false) => {
    if (!silent) setIsRefreshingCredits(true);
    try {
      const res = await fetchUserCredits();
      if (res) {
        setCreditStats(res);
      }
    } catch (err) {
      // Silent fallback to maintain UI resilience
    } finally {
      if (!silent) {
        setTimeout(() => setIsRefreshingCredits(false), 500);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial credit load
    loadCredits(false);

    // 2. Event listener for explicit updates
    const handleCreditUpdate = () => {
      loadCredits(false);
    };
    window.addEventListener('chatbook:credits_updated', handleCreditUpdate);

    // 3. Keep active auto-refresh running periodically (every 20 seconds) while tab is visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadCredits(true);
      }
    }, 20000);

    // 4. Actively refresh immediately when window regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCredits(true);
      }
    };
    const handleFocus = () => {
      loadCredits(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => { 
      isMounted = false; 
      window.removeEventListener('chatbook:credits_updated', handleCreditUpdate);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [location.pathname]);

  // Dynamically resolve active sidebar tab from URL path
  const activeTab = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/app/agents') || p.startsWith('/app/brand-agents') || p.startsWith('/app/brand-agent')) {
      return 'agents';
    }
    if (p.startsWith('/app/conversations')) {
      return 'conversations';
    }
    if (p.startsWith('/app/leads')) {
      return 'leads';
    }
    if (p.startsWith('/app/agent-spaces')) {
      return 'agent-spaces';
    }
    if (p.startsWith('/app/tools-skills')) {
      return 'tools-skills';
    }
    if (p.startsWith('/app/runs-schedules')) {
      return 'runs-schedules';
    }
    if (p.startsWith('/app/templates')) {
      return 'templates';
    }
    if (p.startsWith('/app/knowledge')) {
      return 'knowledge';
    }
    if (p.startsWith('/app/insights')) {
      return 'insights';
    }
    if (p.startsWith('/app/support')) {
      return 'support';
    }
    if (p.startsWith('/app/docs') || p.startsWith('/app/documentation')) {
      return 'documentation';
    }
    if (p.startsWith('/app/pricing')) {
      return 'pricing';
    }
    if (p.startsWith('/app/profile')) {
      return 'profile';
    }
    return 'agents';
  }, [location.pathname]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: isDark ? '#09090b' : '#f8fafc',
        color: isDark ? '#ffffff' : '#0f172a',
      }}
    >
      {/* 1. Single Persistent Left Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        isDark={isDark}
        theme={theme}
        spaceCredits={creditStats?.remaining}
        creditStats={creditStats}
        isRefreshingCredits={isRefreshingCredits}
        onRefreshCredits={() => loadCredits(false)}
      />

      {/* 2. Main Page Content Canvas */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
