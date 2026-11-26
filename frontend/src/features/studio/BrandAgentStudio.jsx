/**
 * @file BrandAgentStudio.jsx
 * @description Master Brand Agent Studio component containing the 3 unified spaces:
 * Edit Space (?tab=edit), Test Space (?tab=playground), and Deploy Space (?tab=publish).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  Share2,
  ChevronDown,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { fetchAgentDetails, fetchActiveWizardDraft } from '@/services/api';
import Modal from '@/components/common/Modal';
import useTheme from '@/lib/useTheme';

const EditSpace = React.lazy(() => import('./spaces/EditSpace'));
const TestSpace = React.lazy(() => import('./spaces/TestSpace'));
const DeploySpace = React.lazy(() => import('./spaces/DeploySpace'));

export default function BrandAgentStudio() {
  const { agentId: routeAgentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Active space tab: 'edit' | 'playground' | 'publish'
  const rawTab = searchParams.get('tab') || 'edit';
  const currentTab = rawTab === 'test' ? 'playground' : (rawTab === 'deploy' ? 'publish' : rawTab);

  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();


  // Agent State
  const [agentState, setAgentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load agent data by ID
  useEffect(() => {
    async function loadStudioAgent() {
      setLoading(true);
      try {
        const canonicalId = routeAgentId?.startsWith('spbrand_')
          ? routeAgentId
          : (routeAgentId ? `spbrand_${routeAgentId}` : 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362');

        const userDraftKey = currentUser?.uid ? `chatsphare_wizard_draft_${currentUser.uid}` : 'chatsphare_wizard_draft';
        const res = await fetchAgentDetails(canonicalId).catch(() => null);
        if (res && (res.agent_id || res.id || res.brand_id || res.display_name || res.brand_name)) {
          setAgentState(res);
        } else {
          // Check active wizard draft in localStorage for current user only
          const localDraft = localStorage.getItem(userDraftKey);
          if (localDraft) {
            const parsed = JSON.parse(localDraft);
            setAgentState(parsed);
          } else {
            setAgentState({
              agent_id: canonicalId,
              brand_name: 'My Brand',
              display_name: 'AI Assistant',
              role: 'Customer Support Specialist',
              tone: 'Professional & Helpful',
              model: 'DeepSeek V4 Pro',
              system_prompt: 'Role\nYou are the official AI Assistant.\n\nMission\nDeliver fast, accurate, and friendly support.\n\nDo\n• Answer first, then add only context that helps.',
              knowledge_items: [{ id: 'k1', title: 'Knowledge Base', type: 'Web Crawl', status: 'Indexed' }],
              tools: [{ id: 'lead_capture', name: 'Lead Capture Form', enabled: true }],
            });
          }
        }
      } catch (err) {
        console.warn('Studio agent fetch notice:', err);
        const userDraftKey = currentUser?.uid ? `chatsphare_wizard_draft_${currentUser.uid}` : 'chatsphare_wizard_draft';
        const localDraft = localStorage.getItem(userDraftKey);
        if (localDraft) {
          try {
            setAgentState(JSON.parse(localDraft));
          } catch {
            setAgentState(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadStudioAgent();
  }, [routeAgentId, currentUser?.uid]);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const handleUpdateAgentState = (updatedState) => {
    setAgentState(updatedState);
    const userDraftKey = currentUser?.uid ? `chatsphare_wizard_draft_${currentUser.uid}` : 'chatsphare_wizard_draft';
    localStorage.setItem(userDraftKey, JSON.stringify(updatedState));
  };

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: isDark ? '#09090b' : '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: isDark ? '#ffffff' : '#0f172a',
      }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed' }} />
        <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Loading Agent Studio...</span>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      background: isDark ? '#09090b' : '#f8fafc',
      color: isDark ? '#ffffff' : '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      transition: 'background 0.25s ease, color 0.25s ease',
    }}>
        {/* Global Studio Header */}
        <header style={{
          height: '56px',
          borderBottom: `1px solid ${borderColor}`,
          background: isDark ? '#0e0e14' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          zIndex: 40,
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}>
          {/* Left: Draft Status Pill Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '6px',
              padding: '3px 9px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#f59e0b',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
              <span>Draft</span>
            </div>
          </div>

          {/* Center: Segmented Pill Navigation Switcher */}
          <div style={{
            display: 'flex',
            background: isDark ? '#161620' : '#e2e8f0',
            padding: '0.22rem',
            borderRadius: '10px',
            gap: '0.15rem',
          }}>
            {[
              { id: 'edit', label: 'Edit' },
              { id: 'playground', label: 'Test' },
              { id: 'publish', label: 'Deploy' },
            ].map(tab => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    border: 'none',
                    background: isActive ? (isDark ? '#222232' : '#ffffff') : 'transparent',
                    color: isActive ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.6)' : '#64748b'),
                    padding: '0.38rem 1.15rem',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right: Share/Demo & Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Share2 size={14} />
              <span>Share/Demo</span>
              <ChevronDown size={13} color={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'} />
            </button>

            <button
              onClick={handleToggleTheme}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                color: isDark ? '#fbbf24' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Studio Active Space Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <React.Suspense fallback={
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          }>
            {currentTab === 'edit' && (
              <EditSpace
                agentState={agentState}
                isDark={isDark}
                onUpdateAgentState={handleUpdateAgentState}
                agentId={routeAgentId}
              />
            )}

            {currentTab === 'playground' && (
              <TestSpace
                agentState={agentState}
                user={currentUser}
                isDark={isDark}
              />
            )}

            {currentTab === 'publish' && (
              <DeploySpace
                agentState={agentState}
                isDark={isDark}
                onUpdateAgentState={handleUpdateAgentState}
              />
            )}
          </React.Suspense>
        </div>

      {/* Share / Demo Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share & Demo Chatbot"
        icon={Share2}
        isDark={isDark}
        footer={
          <button
            onClick={() => setShowShareModal(false)}
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
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.4rem', display: 'block' }}>
              Direct Fullscreen Demo URL
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || 'http://localhost:5173')}/fullscreen-widget/${agentState?.agent_id || 'default'}`}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? '#090a0f' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.8rem',
                }}
              />
              <button
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || 'http://localhost:5173');
                  navigator.clipboard.writeText(`${origin}/fullscreen-widget/${agentState?.agent_id || 'default'}`);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.4rem', display: 'block' }}>
              Embed Widget Script Code
            </label>
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              background: isDark ? '#090a0f' : '#f8fafc',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: isDark ? '#38bdf8' : '#0284c7',
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}>
              {`<script src="${typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || 'http://localhost:5173')}/widget-embed.js?agent_id=${agentState?.agent_id || 'default'}"></script>`}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}

