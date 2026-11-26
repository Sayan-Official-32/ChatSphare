/**
 * @file ConversationsPage.jsx
 * @description Enterprise Conversations & Live Inbox history page for ChatSphare.
 * Faithfully implements the split-pane layout matching the reference mockup:
 * 1. Global left navigation sidebar integration with active 'Conversations' tab.
 * 2. Header with title, subtitle, and light/dark theme toggle.
 * 3. Main card with uppercase AGENT label and agent dropdown selector.
 * 4. Split-pane layout:
 *    - Left: Conversation threads list for the selected agent with search & refresh.
 *    - Right: Selected conversation transcript stream or empty state matching reference.
 * 5. Full transcript inspection with FormattedMessage markdown parsing, copy transcript, and delete actions.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bot,
  Search,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  RefreshCw,
  Clock,
  User,
  X,
} from 'lucide-react';
import FormattedMessage from '@/components/common/FormattedMessage';
import {
  fetchUserAgents,
  fetchPlaygroundConversations,
  fetchPlaygroundConversationMessages,
  deletePlaygroundConversation,
} from '@/services/api';
import useTheme from '@/lib/useTheme';

/**
 * Formats ISO timestamp to human-friendly relative or calendar string.
 * @param {string} ts - ISO timestamp string.
 * @returns {string} Formatted timestamp.
 */
function formatConvTimestamp(ts) {
  if (!ts) return 'Recent';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Recent';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today, ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }

    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return 'Recent';
  }
}

export default function ConversationsPage() {
  // Unified theme state
  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();

  // Agent selection state
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Conversations list state
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [deletingConvId, setDeletingConvId] = useState(null);

  // Active conversation messages state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAgentDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch User's Agents on mount
  useEffect(() => {
    let mounted = true;
    async function loadAgents() {
      setLoadingAgents(true);
      try {
        const res = await fetchUserAgents();
        if (mounted && res && Array.isArray(res.agents)) {
          setAgents(res.agents);
        }
      } catch (err) {
        console.warn('Error loading agents in ConversationsPage:', err);
      } finally {
        if (mounted) setLoadingAgents(false);
      }
    }
    loadAgents();
    return () => { mounted = false; };
  }, []);

  // 2. Fetch Conversations whenever selectedAgent changes
  const loadConversationsForAgent = async (agentId) => {
    if (!agentId) {
      setConversations([]);
      setSelectedConvId(null);
      setMessages([]);
      return;
    }
    setLoadingConversations(true);
    try {
      const res = await fetchPlaygroundConversations(agentId);
      if (res && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.warn('Error loading conversations:', err);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (selectedAgent) {
      const agentId = selectedAgent.agent_id || selectedAgent.id;
      loadConversationsForAgent(agentId);
      setSelectedConvId(null);
      setMessages([]);
    } else {
      setConversations([]);
      setSelectedConvId(null);
      setMessages([]);
    }
  }, [selectedAgent]);

  // 3. Fetch Messages when a conversation thread is selected
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetchPlaygroundConversationMessages(selectedConvId);
        if (mounted) {
          if (res && Array.isArray(res.messages)) {
            setMessages(res.messages);
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.warn('Error loading messages for conversation:', err);
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }
    loadMessages();
    return () => { mounted = false; };
  }, [selectedConvId]);

  // 4. Delete Conversation Handler
  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation session?')) return;
    
    setDeletingConvId(convId);
    try {
      await deletePlaygroundConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConvId === convId) {
        setSelectedConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingConvId(null);
    }
  };

  // 5. Copy Transcript Handler
  const handleCopyTranscript = () => {
    if (!messages || messages.length === 0) return;
    const transcriptText = messages
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n');

    navigator.clipboard.writeText(transcriptText).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    });
  };

  // Filtered conversations by search query
  const filteredConversations = useMemo(() => {
    if (!conversationSearch.trim()) return conversations;
    const q = conversationSearch.toLowerCase().trim();
    return conversations.filter(c => (c.title || '').toLowerCase().includes(q));
  }, [conversations, conversationSearch]);

  // Active selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // Theme-aware color palette
  const colors = {
    pageBg: isDark ? '#0a0a0f' : '#f8fafc',
    cardBg: isDark ? '#12131a' : '#ffffff',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    titleColor: isDark ? '#ffffff' : '#0f172a',
    subtitleColor: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748b',
    labelColor: isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b',
    buttonBg: isDark ? '#181924' : '#ffffff',
    buttonBorder: isDark ? 'rgba(255, 255, 255, 0.14)' : '#cbd5e1',
    buttonHover: isDark ? '#212230' : '#f1f5f9',
    itemHover: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
    itemActive: isDark ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff',
    itemActiveBorder: '#7c3aed',
    userBubbleBg: isDark ? '#7c3aed' : '#7c3aed',
    userBubbleColor: '#ffffff',
    botBubbleBg: isDark ? '#181924' : '#f1f5f9',
    botBubbleBorder: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
    botBubbleColor: isDark ? '#f8fafc' : '#1e293b',
    emptyIconColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#cbd5e1',
    emptyTextColor: isDark ? 'rgba(255, 255, 255, 0.45)' : '#94a3b8',
  };

  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: colors.pageBg,
      color: colors.titleColor,
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    }}>
        {/* Top Header */}
        <header style={{
          padding: '1.5rem 2.5rem 1rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 0.35rem 0',
              color: colors.titleColor,
            }}>
              Conversations
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: colors.subtitleColor,
              lineHeight: 1.4,
            }}>
              See what people are asking your brand agents
            </p>
          </div>

          {/* Top Right Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              background: colors.buttonBg,
              border: `1px solid ${colors.borderColor}`,
              color: colors.titleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          padding: '0 2.5rem 2rem 2.5rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Main Rounded Card Matching Mockup */}
          <div style={{
            flex: 1,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '16px',
            boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            
            {/* ── Top Bar: AGENT label & Agent Selector ── */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${colors.borderColor}`,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: colors.labelColor,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}>
                AGENT
              </div>

              {/* Agent Dropdown Button */}
              <div ref={dropdownRef} style={{ position: 'relative', width: '280px' }}>
                <button
                  type="button"
                  onClick={() => setIsAgentDropdownOpen(prev => !prev)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 1rem',
                    backgroundColor: colors.buttonBg,
                    border: `1px solid ${colors.buttonBorder}`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: colors.titleColor,
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                    {selectedAgent ? (
                      <>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          border: '1px solid rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}>
                          {selectedAgent.logo_url || selectedAgent.agent_icon ? (
                            <img
                              src={selectedAgent.logo_url || selectedAgent.agent_icon}
                              alt="Logo"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Bot size={14} color="#7c3aed" />
                          )}
                        </div>
                        <span style={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {selectedAgent.brand_name || selectedAgent.name || 'Brand Agent'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: colors.subtitleColor }}>Choose an agent</span>
                    )}
                  </div>
                  <ChevronDown size={16} style={{
                    color: colors.subtitleColor,
                    transform: isAgentDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }} />
                </button>

                {/* Dropdown Menu Popover */}
                {isAgentDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '100%',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '12px',
                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.6)' : '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '0.4rem',
                  }}>
                    {loadingAgents ? (
                      <div style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.8rem', color: colors.subtitleColor }}>
                        Loading agents...
                      </div>
                    ) : agents.length === 0 ? (
                      <div style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.8rem', color: colors.subtitleColor }}>
                        No brand agents found. Create one in Studio!
                      </div>
                    ) : (
                      agents.map((agent) => {
                        const agentId = agent.agent_id || agent.id;
                        const isCurrent = selectedAgent && (selectedAgent.agent_id === agentId || selectedAgent.id === agentId);
                        return (
                          <div
                            key={agentId}
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsAgentDropdownOpen(false);
                            }}
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              cursor: 'pointer',
                              backgroundColor: isCurrent ? colors.itemActive : 'transparent',
                              color: isCurrent ? '#7c3aed' : colors.titleColor,
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = colors.itemHover; }}
                            onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              border: '1px solid rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}>
                              {agent.logo_url || agent.agent_icon ? (
                                <img
                                  src={agent.logo_url || agent.agent_icon}
                                  alt="Logo"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Bot size={13} color="#7c3aed" />
                              )}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {agent.brand_name || agent.name || 'Agent'}
                            </span>
                            {isCurrent && <Check size={14} color="#7c3aed" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Split-Pane Layout ── */}
            <div style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}>
              
              {/* Left Column: Conversation List */}
              <div style={{
                width: '320px',
                borderRight: `1px solid ${colors.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : '#fafafa',
              }}>
                {selectedAgent ? (
                  <>
                    {/* Search & Refresh Filter Bar */}
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderBottom: `1px solid ${colors.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <div style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', color: colors.subtitleColor }} />
                        <input
                          type="text"
                          value={conversationSearch}
                          onChange={e => setConversationSearch(e.target.value)}
                          placeholder="Search conversations..."
                          style={{
                            width: '100%',
                            height: '32px',
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.buttonBorder}`,
                            borderRadius: '8px',
                            paddingLeft: '30px',
                            paddingRight: conversationSearch ? '26px' : '10px',
                            fontSize: '0.78rem',
                            color: colors.titleColor,
                            outline: 'none',
                          }}
                        />
                        {conversationSearch && (
                          <X
                            size={13}
                            onClick={() => setConversationSearch('')}
                            style={{ position: 'absolute', right: '8px', cursor: 'pointer', color: colors.subtitleColor }}
                          />
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const agentId = selectedAgent.agent_id || selectedAgent.id;
                          loadConversationsForAgent(agentId);
                        }}
                        disabled={loadingConversations}
                        title="Refresh conversations"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.buttonBorder}`,
                          color: colors.subtitleColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={13} style={{ animation: loadingConversations ? 'spin 1s linear infinite' : 'none' }} />
                      </button>
                    </div>

                    {/* Conversation List Scroll Area */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '0.5rem',
                    }}>
                      {loadingConversations ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: colors.subtitleColor, fontSize: '0.82rem' }}>
                          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem', display: 'inline-block' }} />
                          <div>Loading conversations...</div>
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: colors.subtitleColor, fontSize: '0.8rem' }}>
                          {conversationSearch ? 'No matching conversations' : 'No saved conversations yet for this agent.'}
                        </div>
                      ) : (
                        filteredConversations.map(conv => {
                          const isSelected = selectedConvId === conv.id;
                          return (
                            <div
                              key={conv.id}
                              onClick={() => setSelectedConvId(conv.id)}
                              style={{
                                padding: '0.75rem 0.85rem',
                                borderRadius: '10px',
                                marginBottom: '0.35rem',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? colors.itemActive : 'transparent',
                                border: `1px solid ${isSelected ? colors.itemActiveBorder : 'transparent'}`,
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                position: 'relative',
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = colors.itemHover;
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <span style={{
                                  fontSize: '0.84rem',
                                  fontWeight: isSelected ? 700 : 600,
                                  color: isSelected ? (isDark ? '#c4b5fd' : '#7c3aed') : colors.titleColor,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  flex: 1,
                                }}>
                                  {conv.title || 'Conversation'}
                                </span>

                                <button
                                  type="button"
                                  onClick={e => handleDeleteConversation(conv.id, e)}
                                  title="Delete conversation"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: colors.subtitleColor,
                                    cursor: 'pointer',
                                    padding: '2px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.6,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = colors.subtitleColor; e.currentTarget.style.opacity = '0.6'; }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: colors.subtitleColor }}>
                                <Clock size={11} />
                                <span>{formatConvTimestamp(conv.created_at || conv.timestamp)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  /* Empty state for left pane when no agent chosen */
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: colors.subtitleColor, fontSize: '0.8rem', textAlign: 'center' }}>
                    Select an agent above
                  </div>
                )}
              </div>

              {/* Right Column: Chat Transcript Canvas */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: colors.cardBg,
              }}>
                {/* Header Bar */}
                <div style={{
                  height: '49px',
                  padding: '0 1.5rem',
                  borderBottom: `1px solid ${colors.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: activeConversation ? colors.titleColor : colors.subtitleColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {activeConversation ? (activeConversation.title || 'Conversation') : 'Select a conversation'}
                    </span>

                    {activeConversation && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        color: colors.subtitleColor,
                        fontWeight: 500,
                      }}>
                        {formatConvTimestamp(activeConversation.created_at || activeConversation.timestamp)}
                      </span>
                    )}
                  </div>

                  {/* Actions (Copy transcript & Delete) */}
                  {activeConversation && messages.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={handleCopyTranscript}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: colors.buttonBg,
                          border: `1px solid ${colors.buttonBorder}`,
                          borderRadius: '7px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 500,
                          color: copiedTranscript ? '#10b981' : colors.titleColor,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {copiedTranscript ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedTranscript ? 'Copied!' : 'Copy Transcript'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteConversation(activeConversation.id)}
                        title="Delete this conversation"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'transparent',
                          border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'}`,
                          borderRadius: '7px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 500,
                          color: '#ef4444',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Canvas */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {!selectedAgent ? (
                    /* ── Exact Reference Mockup Empty State (No Agent Selected) ── */
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.85rem',
                      color: colors.emptyTextColor,
                      padding: '2rem',
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.emptyIconColor,
                      }}>
                        <Bot size={44} strokeWidth={1.3} />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: colors.emptyTextColor }}>
                        Select an agent to view conversations
                      </span>
                    </div>
                  ) : !selectedConvId ? (
                    /* ── State when Agent is chosen but no conversation selected ── */
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.85rem',
                      color: colors.emptyTextColor,
                      padding: '2rem',
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.emptyIconColor,
                      }}>
                        <Bot size={44} strokeWidth={1.3} />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: colors.emptyTextColor }}>
                        Select a conversation from the left to view messages
                      </span>
                    </div>
                  ) : loadingMessages ? (
                    /* Loading messages spinner */
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      color: colors.subtitleColor,
                      fontSize: '0.85rem',
                    }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Loading conversation history...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.subtitleColor,
                      fontSize: '0.85rem',
                    }}>
                      No messages recorded in this conversation.
                    </div>
                  ) : (
                    /* ── Full Chat Transcript Message Stream ── */
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}>
                      {messages.map((m, idx) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.65rem',
                              justifyContent: isUser ? 'flex-end' : 'flex-start',
                              width: '100%',
                            }}
                          >
                            {!isUser && (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}>
                                {selectedAgent?.logo_url || selectedAgent?.agent_icon ? (
                                  <img
                                    src={selectedAgent.logo_url || selectedAgent.agent_icon}
                                    alt="Agent Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Bot size={16} color="#7c3aed" />
                                )}
                              </div>
                            )}

                            <div style={{
                              maxWidth: '75%',
                              padding: '0.75rem 1.05rem',
                              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              backgroundColor: isUser ? colors.userBubbleBg : colors.botBubbleBg,
                              border: isUser ? 'none' : colors.botBubbleBorder,
                              color: isUser ? colors.userBubbleColor : colors.botBubbleColor,
                              fontSize: '0.86rem',
                              lineHeight: 1.5,
                              boxShadow: isUser ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none',
                              wordBreak: 'break-word',
                            }}>
                              <FormattedMessage content={m.content} isDark={isDark} />
                            </div>

                            {isUser && (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#262738' : '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '2px',
                                color: isDark ? '#c4b5fd' : '#64748b',
                              }}>
                                <User size={15} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
