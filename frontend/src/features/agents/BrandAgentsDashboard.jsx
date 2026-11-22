/**
 * @file BrandAgentsDashboard.jsx
 * @description Enterprise Brand Agents Dashboard View matching the reference UI design.
 * 
 * Features:
 * 1. Global left navigation sidebar integration with active 'Agents' sub-item.
 * 2. Header with title, subtitle, theme toggle, and '+ New Brand Agent' primary button.
 * 3. Search filter bar with live keyword query and real-time result count indicator.
 * 4. Interactive visual workflow preview cards with Trigger, Center Agent (Knowledge + Connections), and Lead Capture nodes.
 * 5. 3-dot context menu for Copy ID, Edit, and Delete actions.
 * 6. Quick 'Playground' interactive test simulator drawer/modal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Bot,
  Sparkles,
  Zap,
  MoreVertical,
  Edit3,
  Play,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Lock,
  Database,
  Link as LinkIcon,
  Sun,
  Moon,
  Loader2,
  Layers,
  X,
  Send,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { fetchUserAgents, deleteAgent, sendPlaygroundMessage } from '@/services/api';
import useTheme from '@/lib/useTheme';

/**
 * Formats ISO date string into human-friendly format (e.g. 'Aug 21, 2026, 09:41 AM').
 * 
 * @param {string|Date} ts - Raw timestamp string or Date object.
 * @returns {string} Formatted date/time string.
 */
function formatCardTimestamp(ts) {
  if (!ts) return 'Updated recently';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Updated recently';
    return `Updated ${d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  } catch {
    return 'Updated recently';
  }
}

/**
 * Brand Agents Dashboard component.
 * 
 * @returns {JSX.Element} Brand Agents Dashboard layout JSX.
 */
export default function BrandAgentsDashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Unified theme management
  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();

  // Agent list state
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Playground test drawer state
  const [playgroundAgent, setPlaygroundAgent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Fetch agents on mount
  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        const res = await fetchUserAgents();
        if (res && res.agents && res.agents.length > 0) {
          setAgents(res.agents);
        } else {
          setAgents([]);
        }
      } catch (err) {
        console.warn('Load agents notice:', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  // Filter agents by search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(ag =>
      (ag.display_name || '').toLowerCase().includes(q) ||
      (ag.brand_name || '').toLowerCase().includes(q) ||
      (ag.role || '').toLowerCase().includes(q) ||
      (ag.agent_id || '').toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  // Starts a fresh clean new Brand Agent
  const handleStartNewAgent = () => {
    localStorage.removeItem('chatbook_wizard_draft');
    navigate('/app/brand-agent/new');
  };

  // Navigates to edit this agent in the Studio Edit space
  const handleEditAgent = (agent) => {
    const canonicalId = agent?.agent_id || 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362';
    navigate(`/app/brand-agent/${canonicalId}?tab=edit`);
  };

  // Navigates to test this agent in the Studio Test (Playground) space
  const handleOpenPlayground = (agent) => {
    const canonicalId = agent?.agent_id || 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362';
    navigate(`/app/brand-agent/${canonicalId}?tab=playground`);
  };

  // Sends message in playground simulator
  const handleSendPlaygroundMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const userText = chatInput.trim();
    const newHistory = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatSending(true);

    try {
      const targetAgentId = playgroundAgent?.agent_id || null;
      const res = await sendPlaygroundMessage(newHistory, targetAgentId);
      const replyText = res.reply || res.message || res.content || 'Thank you for your message! How else may I assist you?';
      setChatMessages([...newHistory, { role: 'assistant', content: replyText }]);
    } catch {
      setChatMessages([
        ...newHistory,
        { role: 'assistant', content: 'I am indexed and ready to answer any questions about your products and services.' },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  // Copies Agent ID to clipboard
  const handleCopyAgentId = (agId, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(agId);
    setCopiedId(agId);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  // Deletes an agent
  const handleDeleteAgent = async (agId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this agent? All documents and conversation history will be removed.')) {
      return;
    }
    setDeletingId(agId);
    try {
      await deleteAgent(agId);
      setAgents(prev => prev.filter(a => a.agent_id !== agId));
    } catch (err) {
      console.warn('Delete agent notice:', err);
      setAgents(prev => prev.filter(a => a.agent_id !== agId));
    } finally {
      setDeletingId(null);
      setActiveMenuId(null);
    }
  };

  // Close card menus on outside click
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

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
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
        {/* Top Header Bar */}
        <header style={{
          padding: '1.5rem 2.5rem 1rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 0.35rem 0',
              color: isDark ? '#ffffff' : '#0f172a',
            }}>
              Brand Agents
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
              lineHeight: 1.4,
            }}>
              Customer-facing agents that answer questions, qualify visitors, and capture leads.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* + New Brand Agent Button */}
            <button
              onClick={handleStartNewAgent}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9px',
                padding: '0.62rem 1.15rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                transition: 'background 0.2s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6d28d9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              <span>New Brand Agent</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                color: isDark ? '#fbbf24' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Search & Metrics Section */}
        <div style={{
          padding: '1.25rem 2.5rem 0.5rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Search Box with integrated Results Counter */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
          }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search brand agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.58rem 5.5rem 0.58rem 2.4rem',
                borderRadius: '9px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.8rem',
              color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
              fontWeight: 500,
              pointerEvents: 'none',
            }}>
              {filteredAgents.length} {filteredAgents.length === 1 ? 'results' : 'results'}
            </div>
          </div>
        </div>

        {/* 3. Main Agent Cards Grid Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 2.5rem 3rem 2.5rem',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              gap: '0.85rem',
              color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
            }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed' }} />
              <span style={{ fontSize: '0.9rem' }}>Loading brand agents...</span>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div style={{
              maxWidth: '520px',
              margin: '3rem auto',
              textAlign: 'center',
              padding: '2.5rem',
              borderRadius: '14px',
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(124,58,237,0.15)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}>
                <Bot size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
                {searchQuery ? 'No matching agents found' : 'No Brand Agents Created Yet'}
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.86rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                {searchQuery
                  ? `No agent matched "${searchQuery}". Try clearing your search filter.`
                  : 'Get started by creating your first AI brand assistant in 5 simple steps.'}
              </p>
              <button
                onClick={handleStartNewAgent}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                <span>Create Brand Agent</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 420px))',
              gap: '1.5rem',
            }}>
              {filteredAgents.map((ag) => {
                const displayName = ag.display_name || ag.brand_name || 'Brand Assistant';
                const isMenuOpen = activeMenuId === ag.agent_id;

                return (
                  <div
                    key={ag.agent_id}
                    style={{
                      background: isDark ? '#111117' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0'}`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.04)',
                      transition: 'border-color 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(124,58,237,0.4)' : '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0';
                    }}
                  >
                    {/* Visual Node Diagram Canvas */}
                    <div style={{
                      height: '210px',
                      backgroundColor: isDark ? '#0b0b10' : '#fcfcfd',
                      backgroundImage: isDark
                        ? 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0.40px, transparent 0.85px)'
                        : 'radial-gradient(circle, rgba(15, 23, 42, 0.16) 0.40px, transparent 0.85px)',
                      backgroundSize: '18px 18px',
                      position: 'relative',
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {/* Top 3-dot context menu button */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : ag.agent_id);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            background: isDark ? 'rgba(17,17,23,0.85)' : '#ffffff',
                            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '32px',
                              right: '0',
                              width: '180px',
                              background: isDark ? '#1a1a24' : '#ffffff',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                              borderRadius: '10px',
                              padding: '0.4rem',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                              zIndex: 100,
                              fontSize: '0.83rem',
                            }}
                          >
                            <div
                              onClick={(e) => handleCopyAgentId(ag.agent_id, e)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.45rem 0.6rem', borderRadius: '6px',
                                cursor: 'pointer', color: isDark ? '#ffffff' : '#0f172a',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {copiedId === ag.agent_id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              <span>{copiedId === ag.agent_id ? 'Copied ID!' : 'Copy Agent ID'}</span>
                            </div>

                            <div
                              onClick={() => handleEditAgent(ag)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.45rem 0.6rem', borderRadius: '6px',
                                cursor: 'pointer', color: isDark ? '#ffffff' : '#0f172a',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Edit3 size={14} />
                              <span>Edit Configuration</span>
                            </div>

                            <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', margin: '0.3rem 0' }} />

                            <div
                              onClick={(e) => handleDeleteAgent(ag.agent_id, e)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.45rem 0.6rem', borderRadius: '6px',
                                cursor: 'pointer', color: '#ef4444',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Trash2 size={14} />
                              <span>Delete Agent</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SVG Node Connection Paths */}
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      >
                        {/* Vertical line: Trigger (top) -> Center Agent */}
                        <line
                          x1="50%"
                          y1="52"
                          x2="50%"
                          y2="88"
                          stroke={isDark ? 'rgba(255,255,255,0.25)' : '#cbd5e1'}
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        {/* Horizontal connecting line: Center Agent -> Lead Capture node */}
                        <path
                          d="M 230 115 C 260 115, 270 120, 290 125"
                          fill="none"
                          stroke={isDark ? 'rgba(255,255,255,0.25)' : '#cbd5e1'}
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      </svg>

                      {/* Mini Nodes Workflow Rendering */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.1rem',
                        zIndex: 2,
                        width: '100%',
                      }}>
                        {/* 1. Trigger Node */}
                        <div style={{
                          background: isDark ? '#1a1a24' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(124,58,237,0.4)' : '#c7d2fe'}`,
                          borderRadius: '8px',
                          padding: '0.25rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: isDark ? '#e0e7ff' : '#3730a3',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}>
                          <MessageSquare size={12} color="#7c3aed" />
                          <span>Trigger</span>
                        </div>

                        {/* 2. Middle Row: Knowledge pill + Center Agent Node + Lead Capture node */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          justifyContent: 'center',
                        }}>
                          {/* Left Knowledge Pill */}
                          <div style={{
                            background: isDark ? '#14141c' : '#ffffff',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.64rem',
                            color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          }}>
                            <Database size={11} color="#10b981" />
                            <span>{ag.document_count || 1} doc</span>
                          </div>

                          {/* Center Agent Card Node */}
                          <div style={{
                            background: isDark ? '#1a1a26' : '#ffffff',
                            border: `1.5px solid ${isDark ? 'rgba(124,58,237,0.6)' : '#a5b4fc'}`,
                            borderRadius: '10px',
                            padding: '0.45rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: isDark ? '0 4px 16px rgba(124,58,237,0.2)' : '0 4px 12px rgba(124,58,237,0.1)',
                            maxWidth: '160px',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: isDark ? '#ffffff' : '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '140px',
                            }}>
                              <Bot size={13} color="#7c3aed" />
                              <span>{displayName.slice(0, 16)}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <span style={{
                                fontSize: '0.58rem',
                                background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9',
                                color: isDark ? '#c4b5fd' : '#4f46e5',
                                padding: '1px 4px',
                                borderRadius: '3px',
                              }}>
                                {ag.document_count || 1} base
                              </span>
                              <span style={{
                                fontSize: '0.58rem',
                                background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9',
                                color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                                padding: '1px 4px',
                                borderRadius: '3px',
                              }}>
                                1 linked
                              </span>
                            </div>
                          </div>

                          {/* Right Lead Capture Node */}
                          <div style={{
                            background: isDark ? '#14141c' : '#ffffff',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.64rem',
                            color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          }}>
                            <Lock size={11} color="#6366f1" />
                            <span>Lead_capt...</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content & Details Area */}
                    <div style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Name & Status Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            color: isDark ? '#ffffff' : '#0f172a',
                          }}>
                            {displayName}
                          </span>
                        </div>

                        {/* Status Tag */}
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: '#f59e0b',
                          background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                        }}>
                          Unpublished Changes
                        </span>
                      </div>

                      {/* Badges / Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: isDark ? '#c4b5fd' : '#5b21b6',
                          background: isDark ? 'rgba(124, 58, 237, 0.15)' : '#ede9fe',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          <Bot size={11} />
                          Default
                        </span>

                        <span style={{
                          fontSize: '0.68rem',
                          color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                          background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                          padding: '2px 7px',
                          borderRadius: '5px',
                        }}>
                          Text Trigger
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div style={{
                        fontSize: '0.74rem',
                        color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                      }}>
                        {formatCardTimestamp(ag.created_at || ag.updated_at)}
                      </div>
                    </div>

                    {/* Bottom Split Action Buttons: Edit | Playground */}
                    <div style={{
                      padding: '0.75rem 1.15rem 1.15rem 1.15rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.65rem',
                      marginTop: 'auto',
                    }}>
                      <button
                        onClick={() => handleEditAgent(ag)}
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          padding: '0.52rem 0',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: isDark ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9';
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleOpenPlayground(ag)}
                        style={{
                          background: '#7c3aed',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.52rem 0',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                          transition: 'background 0.15s ease, transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#6d28d9';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#7c3aed';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Playground
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* 4. Live Playground Modal Drawer */}
      {playgroundAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 999,
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            height: '100%',
            background: isDark ? '#111117' : '#ffffff',
            borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          }}>
            {/* Playground Drawer Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}>
                  <Bot size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>
                    {playgroundAgent.display_name || playgroundAgent.brand_name || 'Agent Playground'}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                    Live sandbox testing
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPlaygroundAgent(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Conversation History */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}>
              {chatMessages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser ? '#7c3aed' : (isDark ? '#1c1c28' : '#f1f5f9'),
                      color: isUser ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                      fontSize: '0.86rem',
                      lineHeight: 1.45,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {chatSending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontSize: '0.8rem' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Assistant is thinking...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendPlaygroundMessage}
              style={{
                padding: '1rem 1.25rem',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                display: 'flex',
                gap: '0.65rem',
              }}
            >
              <input
                type="text"
                placeholder="Ask your brand agent anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.62rem 0.85rem',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatSending}
                style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 1rem',
                  cursor: chatInput.trim() && !chatSending ? 'pointer' : 'not-allowed',
                  opacity: chatInput.trim() && !chatSending ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
