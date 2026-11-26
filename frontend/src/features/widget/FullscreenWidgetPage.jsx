/**
 * @file FullscreenWidgetPage.jsx
 * @description Standalone 2-Column Fullscreen Embeddable Widget Page for external websites and iframes.
 * Features:
 * 1. 2-Column Layout matching the Test section:
 *    - Left Rail (260px): Conversation History Rail (+ New Chat, sessions list, on-hover delete).
 *    - Middle Section (Flex: 1): Center Chat Simulator Canvas with greeting, prompt suggestion chips,
 *      markdown message formatting, typing indicator, and bottom input.
 *    - Right Rail: Completely hidden/omitted (no internal workspace files shown to visitors).
 * 2. Top Header: Circular borderless brand logo + {brandName} Workspace and live agent status.
 * 3. Visitor Session Isolation: Isolated visitor_id and conversation storage for public website visitors.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Send,
  RefreshCw,
  Sparkles,
  Trash2,
  ChevronRight,
  ArrowDown,
  Loader2,
  Lock,
} from 'lucide-react';
import FormattedMessage from '@/components/common/FormattedMessage';

export default function FullscreenWidgetPage() {
  const { agentId } = useParams();

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isPrivateLocked, setIsPrivateLocked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const chatBodyRef = useRef(null);
  const chatInputRef = useRef(null);

  // Visitor ID generator / persistent storage
  const [visitorId] = useState(() => {
    const key = 'chatsphare_visitor_id';
    let vid = localStorage.getItem(key);
    if (!vid) {
      vid = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(key, vid);
    }
    return vid;
  });

  // Storage key for visitor's conversations for this specific agent
  const convStorageKey = `cb_fs_convs_${agentId}`;

  // 1. Fetch public bot config
  useEffect(() => {
    async function loadConfig() {
      if (!agentId) return;
      try {
        const res = await fetch(`/api/v1/bot/${agentId}/config`);
        if (res.status === 403) {
          setIsPrivateLocked(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.is_public === false) {
            const hasAuth = localStorage.getItem('chatsphare_token') || localStorage.getItem('chatsphare_user') || localStorage.getItem('token');
            if (!hasAuth) {
              setIsPrivateLocked(true);
              return;
            }
          }
          setConfig(data);
        } else {
          // Fallback minimal config
          setConfig({
            display_name: 'AI Assistant',
            brand_name: 'Brand',
            primary_color: '#10b981',
            greeting: 'Hello! How can I help you today?',
            widget_settings: {
              suggestions: ['What are your services?', 'How do I get started?', 'Can I talk to human support?']
            }
          });
        }
      } catch (err) {
        console.warn('Public config fetch warning:', err);
        setConfig({
          display_name: 'AI Assistant',
          brand_name: 'Brand',
          primary_color: '#10b981',
          greeting: 'Hello! How can I help you today?',
          widget_settings: {
            suggestions: ['What are your services?', 'How do I get started?']
          }
        });
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, [agentId]);

  // 2. Load visitor conversation history from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(convStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          const first = parsed[0];
          setActiveConvId(first.id);
          setMessages(first.messages || []);
          return;
        }
      }
    } catch {
      // ignore
    }
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
  }, [convStorageKey]);

  const rawBrandName = config?.brand_name || config?.widget_settings?.brand_name || 'Brand';
  const cleanBrandName = String(rawBrandName).replace(/\s*workspace\b/gi, '').trim() || rawBrandName;
  const displayName = config?.display_name || config?.widget_settings?.display_name || cleanBrandName || 'AI Assistant';
  const primaryColor = config?.primary_color || config?.widget_settings?.primary_color || '#10b981';
  const greetingMessage = config?.greeting || config?.widget_settings?.greeting || `Hello! I'm your ${displayName} assistant. How can I help you today?`;
  const agentAvatar = config?.logo_url || config?.widget_settings?.avatar_url || null;
  const initials = (cleanBrandName || displayName || 'B').charAt(0).toUpperCase();

  const suggestedPrompts = Array.isArray(config?.widget_settings?.suggestions) && config.widget_settings.suggestions.length > 0
    ? config.widget_settings.suggestions
    : ['What are your services?', 'How do I get started?', 'Can I talk to human support?'];

  const themeRaw = config?.theme || config?.widget_settings?.theme || 'Light';
  const isDark = String(themeRaw).toLowerCase() === 'dark';

  const pageBg = isDark ? '#09090b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const headerBg = isDark ? '#0e0e14' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const panelBg = isDark ? '#0e0e14' : '#f9fafb';
  const chatCanvasBg = isDark ? '#09090b' : '#ffffff';

  // Left rail tokens
  const newChatBorder = isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #a7f3d0';
  const newChatBg = isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5';
  const newChatColor = isDark ? '#34d399' : '#059669';
  const convActiveBg = isDark ? 'rgba(255,255,255,0.06)' : '#eff6ff';
  const convHoverBg = isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6';
  const convTitleActive = isDark ? '#ffffff' : '#111827';
  const convTitleInactive = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const convTimeColor = isDark ? 'rgba(255,255,255,0.35)' : '#6b7280';

  // Canvas badge
  const badgeBg = isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6';
  const badgeText = isDark ? 'rgba(255,255,255,0.65)' : '#4b5563';
  const badgeHighlightBg = isDark ? 'rgba(255,255,255,0.08)' : '#ffffff';
  const badgeHighlightText = isDark ? '#ffffff' : '#111827';

  // Chips
  const chipBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const chipBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const chipText = isDark ? '#ffffff' : '#374151';

  // Messages
  const botBubbleBg = isDark ? '#1a1a24' : '#f3f4f6';
  const botBubbleBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb';
  const botBubbleColor = isDark ? '#ffffff' : '#1f2937';
  const userBubbleBg = isDark ? primaryColor : '#0f172a';

  // Input
  const inputContainerBg = isDark ? '#09090b' : '#ffffff';
  const inputBarBg = isDark ? '#111117' : '#ffffff';
  const inputBarBorder = isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e5e7eb';
  const inputTextColor = isDark ? '#ffffff' : '#111827';
  const inputPlaceholderColor = isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af';

  // Reset button
  const resetBtnBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const resetBtnBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb';
  const resetBtnColor = isDark ? '#cbd5e1' : '#374151';

  // Footer branding
  const poweredColor = isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af';

  // Save/update conversation
  const saveConversation = (convId, title, msgs) => {
    setConversations(prev => {
      const existingIdx = prev.findIndex(c => c.id === convId);
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let updated;
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: updated[existingIdx].title || title,
          timestamp,
          messages: msgs,
        };
      } else {
        updated = [{ id: convId, title, timestamp, messages: msgs }, ...prev];
      }
      try {
        localStorage.setItem(convStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Start new chat
  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputVal('');
    chatInputRef.current?.focus();
  };

  // Select conversation
  const handleSelectConversation = (c) => {
    setActiveConvId(c.id);
    setMessages(c.messages || []);
    chatInputRef.current?.focus();
  };

  // Delete conversation
  const handleDeleteConversation = (convId, e) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== convId);
    setConversations(updated);
    try {
      localStorage.setItem(convStorageKey, JSON.stringify(updated));
    } catch {}
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const content = (textToSend || inputVal).trim();
    if (!content || sending) return;

    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    if (!textToSend) setInputVal('');
    setSending(true);

    const targetConvId = activeConvId || `conv_${Date.now()}`;
    if (!activeConvId) {
      setActiveConvId(targetConvId);
    }

    try {
      const res = await fetch(`/api/v1/bot/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          conversation_id: targetConvId,
          visitor_id: visitorId,
        }),
      });

      const data = await res.json();
      const assistantText = data?.answer || data?.content || data?.response || data?.message || "I'm sorry, I couldn't generate a response.";
      const finalMessages = [...updatedMessages, { role: 'assistant', content: assistantText }];
      setMessages(finalMessages);

      const title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      saveConversation(targetConvId, title, finalMessages);
    } catch (err) {
      console.error('Public chat error:', err);
      const errorMsg = { role: 'assistant', content: 'Unable to reach agent. Please verify server connection.' };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  const handleChatScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  if (loadingConfig) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#09090b',
        color: '#ffffff',
      }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
      </div>
    );
  }

  if (isPrivateLocked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#09090b',
        color: '#ffffff',
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          background: '#121217',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            marginBottom: '1.25rem',
          }}>
            <Lock size={30} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '1rem',
            letterSpacing: '0.02em',
          }}>
            <Lock size={12} />
            <span>Private Chatbot</span>
          </div>

          <h2 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#ffffff',
          }}>
            This Chatbot is Private
          </h2>

          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.6)',
          }}>
            The owner has set this AI assistant to private. It is not accessible to external websites or visitors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: pageBg,
      color: textColor,
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* ── Top Bar (Matching Test Section) ────────────────────── */}
      <div style={{
        height: '50px',
        borderBottom: 'none',
        background: headerBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        flexShrink: 0,
        zIndex: 20,
      }}>
        {/* Left: Round borderless logo + Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: agentAvatar ? 'transparent' : primaryColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            overflow: 'hidden',
            flexShrink: 0,
            border: 'none',
          }}>
            {agentAvatar ? (
              <img src={agentAvatar} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials
            )}
          </div>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: textColor }}>
            {cleanBrandName}
          </span>
        </div>
      </div>

      {/* ── 2-Column Body (Left Rail + Center Canvas, NO right rail) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: pageBg }}>
        {/* 1. Left Conversation History Rail */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          borderRight: `1px solid ${borderColor}`,
          background: panelBg,
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          boxSizing: 'border-box',
        }}>
          <button
            onClick={handleStartNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.6rem 0',
              borderRadius: '9px',
              border: newChatBorder,
              background: newChatBg,
              color: newChatColor,
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'background 0.15s ease',
            }}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {conversations.length === 0 ? (
              <div style={{
                fontSize: '0.76rem',
                color: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280',
                textAlign: 'center',
                padding: '1.5rem 0.5rem',
                lineHeight: 1.4,
              }}>
                No saved conversations yet. Send a message to start a new history thread!
              </div>
            ) : (
              conversations.map(c => {
                const isActive = activeConvId === c.id;
                const isHovered = hoveredConvId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    onMouseEnter={() => setHoveredConvId(c.id)}
                    onMouseLeave={() => setHoveredConvId(null)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: isActive ? convActiveBg : (isHovered ? convHoverBg : 'transparent'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? convTitleActive : convTitleInactive,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: convTimeColor }}>
                        {c.timestamp}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      {isHovered && (
                        <button
                          onClick={(e) => handleDeleteConversation(c.id, e)}
                          title="Delete history"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '3px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <ChevronRight size={13} color={isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Middle Section (Center Chat Simulator Canvas) */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          background: chatCanvasBg,
        }}>
          {/* Scrollable Message Thread */}
          <div
            ref={chatBodyRef}
            onScroll={handleChatScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
              gap: '1rem',
              maxWidth: '860px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
              background: chatCanvasBg,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', maxWidth: '580px', margin: 'auto 0' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: textColor }}>
                  {greetingMessage}
                </h2>
                {suggestedPrompts && suggestedPrompts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '20px',
                          border: `1px solid ${chipBorder}`,
                          background: chipBg,
                          color: chipText,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease',
                          boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = primaryColor;
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = chipBorder;
                          e.currentTarget.style.background = chipBg;
                        }}
                      >
                        <span>{p}</span>
                        <Sparkles size={11} color={primaryColor} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      width: '100%',
                      display: 'flex',
                      gap: '0.65rem',
                      alignItems: 'flex-start',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isUser && (
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: agentAvatar ? 'transparent' : primaryColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        marginTop: '2px',
                        border: 'none',
                      }}>
                        {agentAvatar ? (
                          <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>{initials}</span>
                        )}
                      </div>
                    )}

                    <div style={{
                      maxWidth: '80%',
                      padding: '0.8rem 1.15rem',
                      borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                      background: isUser ? userBubbleBg : botBubbleBg,
                      border: isUser ? 'none' : botBubbleBorder,
                      color: isUser ? '#ffffff' : botBubbleColor,
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      boxShadow: isUser ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                    }}>
                      <FormattedMessage content={m.content} isDark={isDark} />
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: primaryColor, fontSize: '0.82rem', alignSelf: 'flex-start' }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>{displayName} is typing...</span>
              </div>
            )}
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                position: 'absolute',
                bottom: '95px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isDark ? '#1e1f2b' : '#ffffff',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              <ArrowDown size={15} />
            </button>
          )}

          {/* Bottom Chat Input Form Area */}
          <div style={{ padding: '1rem 2rem 1.5rem 2rem', maxWidth: '860px', width: '100%', margin: '0 auto', boxSizing: 'border-box', background: inputContainerBg }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              style={{
                background: inputBarBg,
                border: inputBarBorder,
                borderRadius: '16px',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Ask a question..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.88rem',
                  color: inputTextColor,
                }}
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || sending}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: inputVal.trim() && !sending ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                  color: inputVal.trim() && !sending ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'),
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputVal.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                }}
              >
                <Send size={14} />
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: poweredColor, padding: '0.5rem 0 0.1rem 0' }}>
              Powered by <strong style={{ color: primaryColor, fontWeight: 700 }}>ChatSphare</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
