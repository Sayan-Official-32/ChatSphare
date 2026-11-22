/**
 * @file TestSpace.jsx
 * @description Interactive Test (Playground) Space component inside BrandAgentStudio.
 * 
 * Features:
 * 1. 3-Mode External Website Test Environment:
 *    - Mode A: Chat Bubble (Floating corner launcher + 390x570 chat window over external website)
 *    - Mode B: Floating Pill (Floating bottom-center glass pill + 390x570 chat window over external website)
 *    - Mode C: Full Screen (Standalone 2-column view with session history rail & full canvas)
 * 2. Realistic Simulated Host Website:
 *    - Browser frame with URL bar, navigation, hero banner, feature/product showcase, and footer.
 *    - Preset toggles: "SaaS Platform" and "E-Commerce Store".
 *    - Creator can toggle widget open/closed to test both initial launcher appearance and popup chat window.
 * 3. Real Backend & LLM Performance Testing:
 *    - Fully connected to live RAG knowledge base chunks, custom instructions, and configured LLM.
 *    - Supports clickable prompt suggestions, message history persistence, instant chat reset, and markdown formatting.
 * 4. Developer Workspace:
 *    - Preserves the 3-column workspace (session history, playground canvas with @mentions, workspace files inspector).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Paperclip,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderGit2,
  FileText,
  FileCode,
  Eye,
  Copy,
  Check,
  X,
  ArrowDown,
  Loader2,
  ExternalLink,
  Globe,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Laptop,
} from 'lucide-react';
import {
  sendPlaygroundMessage,
  fetchPlaygroundConversations,
  fetchPlaygroundConversationMessages,
  deletePlaygroundConversation,
  uploadKnowledgeFile,
} from '@/services/api';
import FormattedMessage from '@/components/common/FormattedMessage';

export default function TestSpace({ agentState, user, isDark = true }) {
  // Test Mode: 'bubble' | 'pill' | 'fullscreen' | 'workspace'
  const [testMode, setTestMode] = useState('bubble');

  // Widget open state on the simulated website (for bubble and pill modes)
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);

  // Simulated host website preset: 'saas' | 'store'
  const [siteTheme, setSiteTheme] = useState('saas');

  // Chat conversation state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState(null);

  // File tree collapse states for developer workspace
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);
  const [isAgentExpanded, setIsAgentExpanded] = useState(true);

  // Modals & Attachments State
  const [previewFile, setPreviewFile] = useState(null);
  const [copiedFile, setCopiedFile] = useState(false);
  const [customAttachments, setCustomAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Autocomplete mention popup state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Scroll to bottom floating button state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // Agent brand configuration
  const agentId = agentState?.agent_id || null;
  const widgetSettings = agentState?.widget_settings || {};
  const brandName = agentState?.brand_name || widgetSettings.brand_name || agentState?.display_name || 'Brand';
  const agentDisplayName = widgetSettings.display_name || agentState?.display_name || brandName || 'AI Assistant';
  const userName = user?.displayName || user?.display_name || 'User';
  const primaryColor = widgetSettings.primary_color || widgetSettings.primaryColor || agentState?.primary_color || '#10b981';
  const secondaryColor = widgetSettings.secondary_color || widgetSettings.secondaryColor || agentState?.secondary_color || '#374151';
  const greetingMessage = widgetSettings.greeting || agentState?.greeting || `Hello! I'm your ${agentDisplayName} assistant. How can I help you today?`;
  const agentAvatar = widgetSettings.avatar_url || agentState?.logo_url || agentState?.avatar_url || null;
  const initials = (brandName || agentDisplayName || 'B').charAt(0).toUpperCase();

  // Position: Left or Right
  const posVal = widgetSettings.position || agentState?.position || 'Right';
  const isLeft = String(posVal).toLowerCase() === 'left';

  const suggestedPrompts = Array.isArray(widgetSettings.suggestions) && widgetSettings.suggestions.length > 0
    ? widgetSettings.suggestions
    : (Array.isArray(agentState?.suggestions) && agentState.suggestions.length > 0
        ? agentState.suggestions
        : ['What are your services?', 'How do I get started?', 'Can I talk to human support?']);

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const panelBg = isDark ? '#0e0e14' : '#ffffff';

  // Load real conversations from Supabase on mount or agent change
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetchPlaygroundConversations(agentId);
        if (res && Array.isArray(res.conversations) && res.conversations.length > 0) {
          setConversations(res.conversations);
          const firstId = res.conversations[0].id;
          setActiveConvId(firstId);
          loadMessagesForConv(firstId);
        } else {
          setConversations([]);
          setActiveConvId(null);
          setMessages([]);
        }
      } catch (err) {
        console.warn('Could not fetch conversations:', err);
      }
    }
    loadConversations();
  }, [agentId]);

  // Load messages when selecting a conversation session
  const loadMessagesForConv = async (convId) => {
    if (!convId) return;
    setLoadingHistory(true);
    try {
      const res = await fetchPlaygroundConversationMessages(convId);
      if (res && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('Could not load messages for conversation:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
    try {
      await deletePlaygroundConversation(convId);
    } catch (err) {
      console.warn('Could not delete conversation:', err);
    }
  };

  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    loadMessagesForConv(convId);
  };

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputVal('');
  };

  const handleSendMessage = async (textToSend = null) => {
    const content = (textToSend || inputVal).trim();
    if (!content || sending) return;

    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    if (!textToSend) setInputVal('');
    setShowMentionMenu(false);
    setSending(true);

    try {
      const res = await sendPlaygroundMessage(updatedMessages, agentId, activeConvId);
      const assistantText = res?.answer || res?.response || res?.message || res?.content || "I couldn't generate a response.";
      setMessages([...updatedMessages, { role: 'assistant', content: assistantText }]);

      if (res?.conversation_id) {
        const returnedConvId = res.conversation_id;
        setActiveConvId(returnedConvId);
        const refreshRes = await fetchPlaygroundConversations(agentId).catch(() => null);
        if (refreshRes && Array.isArray(refreshRes.conversations)) {
          setConversations(refreshRes.conversations);
        }
      }
    } catch (err) {
      console.error('Playground chat error:', err);
      setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${err.message || 'Failed to reach AI engine'}` }]);
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

  // Keyboard shortcut: ESC to toggle widget or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewFile) {
          setPreviewFile(null);
        } else if (testMode === 'workspace') {
          setTestMode('bubble');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFile, testMode]);

  // Build Workspace Files List dynamically for developer workspace
  const sanitizeFilename = (str) => str.toLowerCase().replace(/[^a-z0-9_.]/g, '_');

  const projectFiles = [
    {
      id: 'p1',
      name: 'system_instructions.md',
      size: `${agentState?.system_prompt ? agentState.system_prompt.length : 2523} bytes`,
      type: 'md',
      content: agentState?.system_prompt || 'Role\nYou are the official AI Assistant.\n\nMission\nDeliver fast, accurate, and friendly support.',
    },
    {
      id: 'p2',
      name: 'brand_identity.json',
      size: '1.2 KB',
      type: 'json',
      content: JSON.stringify({
        brand_name: agentState?.brand_name || 'My Brand',
        display_name: agentDisplayName,
        role: agentState?.role || 'Support Specialist',
        tone: agentState?.tone || 'Professional & Helpful',
        primary_color: primaryColor,
      }, null, 2),
    },
    ...(Array.isArray(agentState?.knowledge_items)
      ? agentState.knowledge_items.map((k, idx) => ({
          id: `p_k_${idx}`,
          name: `${sanitizeFilename(k.title || 'knowledge_document')}.pdf`,
          size: `${k.size || 9218} bytes`,
          type: 'pdf',
          content: k.content || k.snippet || 'Structured knowledge base document indexed for RAG vector retrieval.',
        }))
      : [
          {
            id: 'p3',
            name: `${sanitizeFilename(agentDisplayName)}_knowledge_base.pdf`,
            size: '9218 bytes',
            type: 'pdf',
            content: 'Verified knowledge base document containing services, documentation, and operational facts.',
          },
        ]),
  ];

  const agentFiles = [
    {
      id: 'a1',
      name: 'tools_config.json',
      size: '640 bytes',
      type: 'json',
      content: JSON.stringify(agentState?.tools || [{ id: 'lead_capture', enabled: true }], null, 2),
    },
    {
      id: 'a2',
      name: 'session_metadata.json',
      size: '320 bytes',
      type: 'json',
      content: JSON.stringify({ active_conv_id: activeConvId || 'session-live', agent_id: agentId }, null, 2),
    },
    ...customAttachments,
  ];

  const allWorkspaceFiles = [...projectFiles, ...agentFiles];

  const handleMentionFile = (file) => {
    const fileTag = `@${file.name}`;
    setInputVal(prev => {
      if (prev.endsWith('@')) {
        return prev.slice(0, -1) + fileTag + ' ';
      }
      return prev ? `${prev} ${fileTag} ` : `${fileTag} `;
    });
    setShowMentionMenu(false);
    chatInputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || val[lastAtIdx - 1] === ' ')) {
      const query = val.slice(lastAtIdx + 1);
      if (!query.includes(' ')) {
        setMentionFilter(query.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await uploadKnowledgeFile(file, agentId);
      const newFileObj = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: `${file.size} bytes`,
        type: file.name.split('.').pop() || 'txt',
        content: `Attached document content: ${file.name}\n(Uploaded to Agent Sandbox)`,
      };
      setCustomAttachments(prev => [newFileObj, ...prev]);
    } catch (err) {
      console.warn('Workspace file upload fallback:', err);
      const fallbackFile = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: `${file.size} bytes`,
        type: file.name.split('.').pop() || 'txt',
        content: `Document: ${file.name}\n(Locally staged for playground mention)`,
      };
      setCustomAttachments(prev => [fallbackFile, ...prev]);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyFileContent = (content) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // =========================================================================
  // SUB-COMPONENT: Reusable Chat Widget Box (Used in Bubble & Pill Views)
  // =========================================================================
  const renderInteractiveChatWidget = (isFloatingPill = false) => {
    return (
      <div style={{
        width: '390px',
        maxWidth: 'calc(100% - 32px)',
        height: '570px',
        maxHeight: 'calc(100% - 96px)',
        background: isDark ? '#11121a' : '#ffffff',
        borderRadius: '20px',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
        boxShadow: isDark
          ? '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 24px 50px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'absolute',
        zIndex: 50,
        bottom: isFloatingPill ? '88px' : '88px',
        left: isFloatingPill ? '50%' : (isLeft ? '24px' : 'auto'),
        right: isFloatingPill ? 'auto' : (isLeft ? 'auto' : '24px'),
        transform: isFloatingPill ? 'translateX(-50%)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        {/* Header Bar */}
        <div style={{
          background: primaryColor,
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: primaryColor,
              fontWeight: 800,
              fontSize: '0.88rem',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {agentAvatar ? (
                <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                {agentDisplayName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Online</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={handleStartNewChat}
              title="Start new conversation"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '7px',
                padding: '5px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => setIsWidgetOpen(false)}
              title="Close chat"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '7px',
                padding: '5px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable Message History Body */}
        <div
          ref={chatBodyRef}
          onScroll={handleChatScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.1rem 0.95rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: isDark ? '#0d0e14' : '#ffffff',
            position: 'relative',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: 'auto 0' }}>
              <div style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                border: `1px solid ${borderColor}`,
                borderRadius: '14px',
                padding: '1rem 1.15rem',
                fontSize: '0.84rem',
                color: isDark ? '#ffffff' : '#0f172a',
                lineHeight: 1.5,
              }}>
                {greetingMessage}
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8', paddingLeft: '4px' }}>
                    Suggested questions:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={sending}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '10px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                          background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                          color: isDark ? 'rgba(255,255,255,0.85)' : '#334155',
                          fontSize: '0.76rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = primaryColor;
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
                        }}
                      >
                        <span>{prompt}</span>
                        <Sparkles size={11} color={primaryColor} style={{ flexShrink: 0, marginLeft: '6px' }} />
                      </button>
                    ))}
                  </div>
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
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isUser && (
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      marginBottom: '2px',
                    }}>
                      {agentAvatar ? (
                        <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: primaryColor }}>{initials}</span>
                      )}
                    </div>
                  )}

                  <div style={{
                    maxWidth: '85%',
                    padding: '0.7rem 0.95rem',
                    borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                    background: isUser ? primaryColor : (isDark ? '#1a1b24' : '#f1f5f9'),
                    color: isUser ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                    border: !isUser ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}>
                    <FormattedMessage content={m.content} isDark={isDark} />
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: primaryColor, fontSize: '0.78rem', alignSelf: 'flex-start', paddingLeft: '0.5rem' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              <span>{agentDisplayName} is typing...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '0.75rem 0.95rem 0.5rem 0.95rem', background: isDark ? '#12131b' : '#ffffff', borderTop: `1px solid ${borderColor}` }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              background: isDark ? '#090a0f' : '#ffffff',
              border: `1.5px solid ${primaryColor}`,
              borderRadius: '14px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.82rem',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || sending}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: inputVal.trim() && !sending ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputVal.trim() && !sending ? 'pointer' : 'not-allowed',
                flexShrink: 0,
              }}
            >
              <Send size={12} />
            </button>
          </form>
          <div style={{ textAlign: 'center', fontSize: '0.62rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8', padding: '0.4rem 0 0.2rem 0' }}>
            Powered by <strong style={{ color: primaryColor }}>ChatBook</strong>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-COMPONENT: Simulated Host Website (Preview of External Site)
  // =========================================================================
  const renderSimulatedWebsite = (mode) => {
    const isPill = mode === 'pill';
    const currentUrl = siteTheme === 'saas'
      ? 'https://apexcloud.io/products'
      : 'https://lumina-boutique.store/collection';

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '1rem 1.5rem 1.5rem 1.5rem',
        boxSizing: 'border-box',
      }}>
        {/* Mock Browser Chrome Bar */}
        <div style={{
          width: '100%',
          height: '42px',
          background: isDark ? '#1a1b26' : '#e2e8f0',
          borderRadius: '14px 14px 0 0',
          border: `1px solid ${borderColor}`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          {/* 3 Window Control Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>

          {/* Browser URL Input Box */}
          <div style={{
            flex: 1,
            maxWidth: '520px',
            margin: '0 auto',
            height: '26px',
            background: isDark ? '#0f1015' : '#ffffff',
            borderRadius: '6px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#cbd5e1'}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.65rem',
            gap: '0.45rem',
            fontSize: '0.74rem',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
          }}>
            <Globe size={12} color="#10b981" />
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUrl}
            </span>
          </div>

          {/* Quick Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setSiteTheme(siteTheme === 'saas' ? 'store' : 'saas')}
              title="Switch simulated website background"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isDark ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {siteTheme === 'saas' ? <Laptop size={12} /> : <ShoppingBag size={12} />}
              <span>{siteTheme === 'saas' ? 'SaaS Site' : 'Store Site'}</span>
            </button>
          </div>
        </div>

        {/* Mock Website Viewport Container */}
        <div style={{
          flex: 1,
          background: siteTheme === 'saas'
            ? (isDark ? '#0a0a0f' : '#f8fafc')
            : (isDark ? '#0c0d12' : '#ffffff'),
          borderRadius: '0 0 14px 14px',
          border: `1px solid ${borderColor}`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Scrollable Mock Website Page Content (Subtly blurred demo template) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            opacity: 0.9,
            filter: 'blur(3px)',
            transform: 'scale(1.01)',
            transformOrigin: 'top center',
            transition: 'filter 0.25s ease, opacity 0.25s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {/* 1. Mock Website Navbar */}
            <div style={{
              height: '56px',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              background: isDark ? 'rgba(15,16,23,0.8)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2rem',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: primaryColor }} />
                  <span>{siteTheme === 'saas' ? 'Apex Cloud' : 'Lumina Boutique'}</span>
                </div>
                <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                  <span>{siteTheme === 'saas' ? 'Features' : 'New Arrivals'}</span>
                  <span>{siteTheme === 'saas' ? 'Solutions' : 'Collections'}</span>
                  <span>{siteTheme === 'saas' ? 'Pricing' : 'Lookbook'}</span>
                  <span>{siteTheme === 'saas' ? 'Documentation' : 'About Us'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button style={{
                  background: primaryColor,
                  border: 'none',
                  borderRadius: '7px',
                  padding: '0.35rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  {siteTheme === 'saas' ? 'Get Started' : 'Shop Spring 2026'}
                </button>
              </div>
            </div>

            {/* 2. Mock Hero Section */}
            <div style={{
              padding: '3rem 2rem 2.5rem 2rem',
              textAlign: 'center',
              maxWidth: '720px',
              margin: '0 auto',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                padding: '0.3rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: primaryColor,
                marginBottom: '1rem',
              }}>
                <Sparkles size={12} />
                <span>{siteTheme === 'saas' ? 'Next-Gen Autonomous Workflow Engine' : 'Exclusive Sustainable Luxury'}</span>
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                lineHeight: 1.25,
                margin: '0 0 1rem 0',
                color: isDark ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.02em',
              }}>
                {siteTheme === 'saas'
                  ? 'Intelligent Infrastructure for Modern Business Teams'
                  : 'Curated Elegance & Modern Essentials for Every Season'}
              </h1>
              <p style={{
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b',
                margin: '0 0 1.75rem 0',
              }}>
                {siteTheme === 'saas'
                  ? 'Accelerate response times, streamline support escalations, and delight users across all digital touchpoints with our 24/7 intelligent brand assistant.'
                  : 'Discover bespoke craftsmanship, sustainably sourced organic textiles, and timeless pieces designed to inspire your everyday wardrobe.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button style={{
                  background: primaryColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '0.6rem 1.4rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}>
                  {siteTheme === 'saas' ? 'Start 14-Day Free Trial' : 'Explore New Arrivals'}
                </button>
                <button style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '9px',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  {siteTheme === 'saas' ? 'Watch Interactive Demo' : 'Read Our Journal'}
                </button>
              </div>
            </div>

            {/* 3. Mock Cards / Product Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem',
              maxWidth: '860px',
              margin: '0 auto',
              padding: '0 2rem 3rem 2rem',
            }}>
              {[
                {
                  title: siteTheme === 'saas' ? 'Instant 24/7 RAG Support' : 'Italian Merino Knitwear',
                  desc: siteTheme === 'saas' ? 'Queries resolved within 2 seconds using verified company knowledge.' : 'Ultra-fine 19.5 micron virgin wool for supreme softness.',
                  tag: siteTheme === 'saas' ? 'RAG Engine' : '$195.00',
                },
                {
                  title: siteTheme === 'saas' ? 'Omnichannel Embeds' : 'Tailored Wool Trench',
                  desc: siteTheme === 'saas' ? 'Embed floating bubbles, pills, or full standalone workspaces anywhere.' : 'Structured silhouette with water-repellent organic cotton twill.',
                  tag: siteTheme === 'saas' ? 'Zero-Code' : '$340.00',
                },
                {
                  title: siteTheme === 'saas' ? 'SOC2 Enterprise Safety' : 'Minimalist Silk Blouse',
                  desc: siteTheme === 'saas' ? 'Isolated workspace memory and strict role-based access control.' : 'Pure mulberry silk with mother-of-pearl button accents.',
                  tag: siteTheme === 'saas' ? 'Encrypted' : '$160.00',
                },
              ].map((item, cIdx) => (
                <div key={cIdx} style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: primaryColor }}>{item.tag}</span>
                    <ShieldCheck size={14} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isDark ? '#ffffff' : '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING EMBED LAYER: Renders over the simulated website                 */}
          {/* ========================================================================= */}

          {/* 1. Open Chat Widget Window */}
          {isWidgetOpen && renderInteractiveChatWidget(isPill)}

          {/* 2. Mode A: Chat Bubble Launcher Button */}
          {!isPill && (
            <button
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              title={isWidgetOpen ? 'Minimize chat' : 'Open chat'}
              style={{
                position: 'absolute',
                bottom: '24px',
                right: isLeft ? 'auto' : '24px',
                left: isLeft ? '24px' : 'auto',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: primaryColor,
                border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 60,
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isWidgetOpen ? (
                <X size={24} />
              ) : agentAvatar ? (
                <img src={agentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <MessageSquare size={24} />
              )}
            </button>
          )}

          {/* 3. Mode B: Floating Glass Pill Launcher */}
          {isPill && (
            <button
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              title={isWidgetOpen ? 'Minimize chat' : 'Open chat'}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: isDark ? 'rgba(18, 19, 27, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)'
                  : '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                borderRadius: '9999px',
                padding: '0.65rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                zIndex: 60,
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.88rem',
                fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.04)';
                e.currentTarget.style.borderColor = primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)';
              }}
            >
              {!isWidgetOpen && (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: agentAvatar ? '#ffffff' : primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {agentAvatar ? (
                    <img src={agentAvatar} alt="Pill Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
              )}
              <span style={{ whiteSpace: 'nowrap', fontWeight: isWidgetOpen ? 700 : 600, display: 'flex', alignItems: 'center' }}>
                {isWidgetOpen ? (
                  'Close Chat'
                ) : (
                  <>
                    Chat with
                    <strong style={{
                      color: primaryColor,
                      fontWeight: 700,
                      backgroundColor: `${primaryColor}24`,
                      boxShadow: `0 0 12px ${primaryColor}40`,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      marginLeft: '4px',
                      display: 'inline-block',
                      letterSpacing: '0.01em',
                    }}>
                      {brandName || agentDisplayName}
                    </strong>
                  </>
                )}
              </span>
              <Sparkles size={14} color={primaryColor} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-COMPONENT: Mode C - Full Screen Embed Simulator
  // =========================================================================
  const renderFullscreenSimulator = () => {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '1rem 1.5rem 1.5rem 1.5rem',
        boxSizing: 'border-box',
      }}>
        {/* Browser Frame Bar */}
        <div style={{
          width: '100%',
          height: '42px',
          background: isDark ? '#1a1b26' : '#e2e8f0',
          borderRadius: '14px 14px 0 0',
          border: `1px solid ${borderColor}`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          <div style={{
            flex: 1,
            maxWidth: '520px',
            margin: '0 auto',
            height: '26px',
            background: isDark ? '#0f1015' : '#ffffff',
            borderRadius: '6px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#cbd5e1'}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.65rem',
            gap: '0.45rem',
            fontSize: '0.74rem',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
          }}>
            <Globe size={12} color="#10b981" />
            <span style={{ fontWeight: 500 }}>
              {`${window.location.origin}/fullscreen-widget/${agentId || 'demo'}`}
            </span>
          </div>
          <button
            onClick={() => window.open(`/fullscreen-widget/${agentId}`, '_blank')}
            title="Open in new browser tab"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
              borderRadius: '6px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: isDark ? '#ffffff' : '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <ExternalLink size={12} />
            <span>Open in New Tab</span>
          </button>
        </div>

        {/* 2-Column Full Screen Widget Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          background: isDark ? '#090a0f' : '#ffffff',
          borderRadius: '0 0 14px 14px',
          border: `1px solid ${borderColor}`,
          overflow: 'hidden',
        }}>
          {/* Left History Rail */}
          <div style={{
            width: '260px',
            flexShrink: 0,
            borderRight: `1px solid ${borderColor}`,
            background: isDark ? '#0e0f17' : '#f8fafc',
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
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'}`,
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
                color: isDark ? '#34d399' : '#059669',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              <Plus size={14} />
              <span>New Conversation</span>
            </button>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {conversations.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                  No saved conversations yet.
                </div>
              ) : (
                conversations.map(c => {
                  const isActive = activeConvId === c.id;
                  const isHovered = hoveredConvId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      onMouseEnter={() => setHoveredConvId(c.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0') : (isHovered ? (isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9') : 'transparent'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: isActive ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? (isActive ? '#ffffff' : 'rgba(255,255,255,0.7)') : '#0f172a' }}>
                          {c.title}
                        </span>
                        <span style={{ fontSize: '0.66rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                          {c.timestamp}
                        </span>
                      </div>
                      {isHovered && (
                        <button
                          onClick={(e) => handleDeleteConversation(c.id, e)}
                          title="Delete history"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Canvas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Top Bar */}
            <div style={{
              height: '52px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.5rem',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: agentAvatar ? '#ffffff' : primaryColor,
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                }}>
                  {agentAvatar ? <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{agentDisplayName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>Online Standalone Application</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartNewChat}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '7px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  color: isDark ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <RefreshCw size={12} />
                <span>Reset Chat</span>
              </button>
            </div>

            {/* Scrollable Conversation Canvas */}
            <div
              ref={chatBodyRef}
              onScroll={handleChatScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto 0', maxWidth: '560px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                    {greetingMessage}
                  </h2>
                  {suggestedPrompts && suggestedPrompts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                      {suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(p)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: `1px solid ${borderColor}`,
                            background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
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
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        width: '100%',
                      }}
                    >
                      {!isUser && (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: agentAvatar ? '#ffffff' : primaryColor,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}>
                          {agentAvatar ? <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '80%',
                        padding: '0.75rem 1.15rem',
                        borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                        background: isUser ? primaryColor : (isDark ? '#1a1b24' : '#f1f5f9'),
                        color: isUser ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                      }}>
                        <FormattedMessage content={m.content} isDark={isDark} />
                      </div>
                    </div>
                  );
                })
              )}

              {sending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: primaryColor, fontSize: '0.8rem', alignSelf: 'flex-start' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{agentDisplayName} is typing...</span>
                </div>
              )}
            </div>

            {/* Bottom Input Form */}
            <div style={{ padding: '1rem 2rem 1.5rem 2rem', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                style={{
                  background: isDark ? '#111117' : '#ffffff',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1'}`,
                  borderRadius: '16px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.86rem', color: isDark ? '#ffffff' : '#0f172a' }}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || sending}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: inputVal.trim() && !sending ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'),
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputVal.trim() && !sending ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-COMPONENT: Mode D - Developer Workspace View (3-Column Power Mode)
  // =========================================================================
  const renderDeveloperWorkspace = () => {
    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: isDark ? '#09090b' : '#fafafa',
        color: isDark ? '#ffffff' : '#0f172a',
      }}>
        {/* Main 3-Column Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'}`,
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
                color: isDark ? '#34d399' : '#059669',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              <Plus size={15} />
              <span>New Chat</span>
            </button>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {conversations.length === 0 ? (
                <div style={{ fontSize: '0.76rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', textAlign: 'center', padding: '1.5rem 0.5rem', lineHeight: 1.4 }}>
                  No saved conversations yet.
                </div>
              ) : (
                conversations.map(c => {
                  const isActive = activeConvId === c.id;
                  const isHovered = hoveredConvId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      onMouseEnter={() => setHoveredConvId(c.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: isActive ? (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9') : (isHovered ? (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc') : 'transparent'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? (isActive ? '#ffffff' : 'rgba(255,255,255,0.7)') : '#0f172a' }}>
                          {c.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                          {c.timestamp}
                        </span>
                      </div>
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
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Center Chat Simulator Canvas */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            background: isDark ? '#09090b' : '#ffffff',
          }}>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
              gap: '1rem',
              maxWidth: '820px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', maxWidth: '580px', margin: 'auto 0' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: isDark ? '#ffffff' : '#0f172a' }}>
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
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                            background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
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
                messages.map((m, idx) => (
                  <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '0.75rem 1.15rem',
                      borderRadius: m.role === 'user' ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                      background: m.role === 'user' ? primaryColor : (isDark ? '#1a1b24' : '#f1f5f9'),
                      color: m.role === 'user' ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                      <FormattedMessage content={m.content} isDark={isDark} />
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: primaryColor, fontSize: '0.82rem', alignSelf: 'flex-start' }}>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{agentDisplayName} is typing...</span>
                </div>
              )}
            </div>

            {/* Bottom Input Area with @ Mention Menu */}
            <div style={{ padding: '1rem 2rem 1.5rem 2rem', maxWidth: '820px', width: '100%', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>
              {showMentionMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '2rem',
                  right: '2rem',
                  marginBottom: '8px',
                  background: isDark ? '#14151f' : '#ffffff',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                  padding: '0.5rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 50,
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', padding: '0.25rem 0.5rem' }}>
                    MENTION WORKSPACE FILE
                  </div>
                  {allWorkspaceFiles
                    .filter(f => f.name.toLowerCase().includes(mentionFilter))
                    .map(file => (
                      <div
                        key={file.id}
                        onClick={() => handleMentionFile(file)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          background: isDark ? 'transparent' : '#ffffff',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <FileCode size={13} color={primaryColor} />
                          <span style={{ fontWeight: 600 }}>@{file.name}</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                          {file.size}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                style={{
                  background: isDark ? '#111117' : '#ffffff',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                  borderRadius: '16px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Paperclip
                  size={18}
                  color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach document"
                />
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Type your message... Type @ to reference files"
                  value={inputVal}
                  onChange={handleInputChange}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', color: isDark ? '#ffffff' : '#0f172a' }}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || sending}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: inputVal.trim() && !sending ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'),
                    color: '#fff',
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
            </div>
          </div>

          {/* 3. Right Workspace Panel */}
          <div style={{
            width: '280px',
            flexShrink: 0,
            borderLeft: `1px solid ${borderColor}`,
            background: panelBg,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Workspace Files</span>
                <div style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                  Click to mention or preview
                </div>
              </div>
            </div>

            {/* Project Files */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginBottom: '0.25rem' }}>
                PROJECT FILES
              </div>
              <div onClick={() => setIsProjectExpanded(!isProjectExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                {isProjectExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={15} color="#3b82f6" />
                <span>project</span>
              </div>
              {isProjectExpanded && (
                <div style={{ paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {projectFiles.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '0.25rem 0.4rem',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div onClick={() => handleMentionFile(file)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', flex: 1 }}>
                        <FileText size={13} color="#38bdf8" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{file.name}</span>
                      </div>
                      <Eye
                        size={12}
                        color={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setPreviewFile(file)}
                        title="Preview file"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Workspace */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginBottom: '0.25rem' }}>
                AGENT WORKSPACE
              </div>
              <div onClick={() => setIsAgentExpanded(!isAgentExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                {isAgentExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderGit2 size={15} color={primaryColor} />
                <span>agent</span>
              </div>
              {isAgentExpanded && (
                <div style={{ paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {agentFiles.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '0.25rem 0.4rem',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div onClick={() => handleMentionFile(file)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', flex: 1 }}>
                        <FileCode size={13} color={primaryColor} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{file.name}</span>
                      </div>
                      <Eye
                        size={12}
                        color={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setPreviewFile(file)}
                        title="Preview file"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      color: isDark ? '#ffffff' : '#0f172a',
      background: isDark ? '#09090b' : '#fafafa',
      position: 'relative',
    }}>
      {/* Hidden File Input for Workspace Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '620px',
            maxHeight: '80vh',
            background: isDark ? '#12131a' : '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={17} color={primaryColor} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{previewFile.name}</div>
                  <div style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                    {previewFile.size} • {previewFile.type.toUpperCase()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopyFileContent(previewFile.content)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                  }}
                >
                  {copiedFile ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              background: isDark ? '#0a0a0f' : '#f8fafc',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {previewFile.content}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP SUB-HEADER: 3-MODE SELECTOR & TESTING TOOLBAR                         */}
      {/* ========================================================================= */}
      <div style={{
        height: '52px',
        borderBottom: `1px solid ${borderColor}`,
        background: isDark ? '#0e0e14' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        flexShrink: 0,
        zIndex: 20,
      }}>
        {/* Left: Brand / Agent Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: agentAvatar ? '#ffffff' : primaryColor,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.78rem',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {agentAvatar ? <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
            {agentDisplayName}
          </span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
            color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
            fontWeight: 500,
          }}>
            Live Test
          </span>
        </div>

        {/* Center: 3 Primary Test Modes Switcher */}
        <div style={{
          display: 'flex',
          background: isDark ? '#161620' : '#e2e8f0',
          padding: '0.2rem',
          borderRadius: '9px',
          gap: '0.2rem',
        }}>
          {[
            { id: 'bubble', label: 'Chat Bubble', icon: MessageSquare },
            { id: 'pill', label: 'Floating Pill', icon: Sparkles },
            { id: 'fullscreen', label: 'Full Screen', icon: Maximize2 },
          ].map(tab => {
            const isActive = testMode === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTestMode(tab.id);
                  if (tab.id === 'bubble' || tab.id === 'pill') {
                    setIsWidgetOpen(true);
                  }
                }}
                style={{
                  border: 'none',
                  background: isActive ? (isDark ? '#222232' : '#ffffff') : 'transparent',
                  color: isActive ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.6)' : '#64748b'),
                  padding: '0.35rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} color={isActive ? primaryColor : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Controls & Developer Workspace Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {(testMode === 'bubble' || testMode === 'pill') && (
            <button
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '0.32rem 0.75rem',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: isDark ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {isWidgetOpen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isWidgetOpen ? 'Collapse Widget' : 'Open Widget'}</span>
            </button>
          )}

          <button
            onClick={() => setTestMode(testMode === 'workspace' ? 'bubble' : 'workspace')}
            style={{
              background: testMode === 'workspace' ? primaryColor : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
              border: `1px solid ${testMode === 'workspace' ? primaryColor : borderColor}`,
              borderRadius: '8px',
              padding: '0.32rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: testMode === 'workspace' ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Toggle advanced 3-column files and session workspace"
          >
            <FolderGit2 size={13} />
            <span>{testMode === 'workspace' ? 'Exit Workspace' : 'Dev Workspace'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE MODE VIEWPORT                                                      */}
      {/* ========================================================================= */}
      {(testMode === 'bubble' || testMode === 'pill') && renderSimulatedWebsite(testMode)}
      {testMode === 'fullscreen' && renderFullscreenSimulator()}
      {testMode === 'workspace' && renderDeveloperWorkspace()}
    </div>
  );
}
