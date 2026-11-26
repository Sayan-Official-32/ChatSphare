/**
 * @file LiveWidgetPreview.jsx
 * @description Real-Time AI Chat Widget Simulator Component.
 * 
 * Features:
 * 1. Simulates the actual floating website embed widget in real-time as users edit brand colors, name, logo, greeting, and suggestions.
 * 2. Supports Light and Dark widget theme rendering.
 * 3. Supports Right and Left screen launcher button alignment.
 * 4. Allows interactive typing and chat turns directly inside the preview window.
 */

import React, { useState, useEffect } from 'react';
import { Maximize2, Edit3, Send, MessageSquare, Sparkles } from 'lucide-react';
import FormattedMessage from '@/components/common/FormattedMessage';

/**
 * Live Widget Preview component.
 * 
 * @param {Object} props - React props.
 * @param {Object} props.brandData - Dynamic brand fields object (primary_color, display_name, greeting, suggestions, theme, position, logo_url).
 * @returns {JSX.Element} Simulated chat widget UI element.
 */
export default function LiveWidgetPreview({ brandData }) {
  const primaryColor = brandData?.primary_color || '#6366f1';
  const displayName = brandData?.display_name || brandData?.brand_name || 'SayanBot';
  const greeting = brandData?.greeting || `Hello! I'm your ${displayName} assistant. How can I help?`;
  const suggestions = brandData?.suggestions || ['What are your services?', 'Contact support'];
  const placeholder = brandData?.placeholder || 'Type your message...';
  const position = brandData?.position || 'Right';
  const isDark = brandData?.theme === 'Dark';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: greeting }
    ]);
  }, [greeting]);

  /**
   * Appends user chat message to local preview state.
   * 
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: inputText.trim() }]);
    setInputText('');
  };

  const agentAvatar = brandData?.agent_icon || brandData?.logo_url;
  const widgetAvatar = brandData?.widget_icon || brandData?.logo_url;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      gap: '0.65rem',
      boxSizing: 'border-box',
    }}>
      
      {/* Widget Window */}
      <div style={{
        width: '100%',
        maxWidth: '340px',
        backgroundColor: isDark ? '#14151f' : '#ffffff',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: isDark ? '0 15px 45px rgba(0,0,0,0.5)' : '0 15px 35px rgba(0,0,0,0.12)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}>
        {/* Header Bar */}
        <div style={{
          backgroundColor: primaryColor,
          padding: '0.85rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          transition: 'background-color 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '30px', height: '30px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: primaryColor,
              fontWeight: 700,
              fontSize: '0.8rem',
              overflow: 'hidden',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'none',
              flexShrink: 0,
            }}>
              {agentAvatar ? (
                <img src={agentAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {displayName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#ffffff', opacity: 0.9 }}>
            <Maximize2 size={15} style={{ cursor: 'pointer' }} />
            <Edit3 size={15} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Chat Area */}
        <div style={{
          padding: '1rem 0.9rem',
          flex: 1,
          backgroundColor: isDark ? '#14151f' : '#fcfcfd',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          height: '380px',
          minHeight: '320px',
          overflowY: 'auto',
          transition: 'background-color 0.3s ease',
        }}>
          
          {/* Assistant & User Messages */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.55rem',
                alignItems: 'flex-start',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{
                  width: '26px', height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  marginTop: '2px',
                  border: '1px solid #e2e8f0',
                }}>
                  {agentAvatar ? (
                    <img src={agentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: primaryColor }}>{initials}</span>
                  )}
                </div>
              )}
              <div style={{
                backgroundColor: m.role === 'user' ? primaryColor : `${primaryColor}18`,
                color: m.role === 'user' ? '#ffffff' : (isDark ? '#f1f5f9' : '#1e293b'),
                padding: '0.65rem 0.85rem',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: '0.82rem',
                lineHeight: 1.4,
                maxWidth: '85%',
              }}>
                <FormattedMessage content={m.content} isDark={isDark} />
              </div>
            </div>
          ))}

          {/* Dynamic Suggestion Prompt Chips */}
          {suggestions && suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginBottom: '0.1rem' }}>
                Here are some suggestions, or ask me anything!
              </span>
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setMessages(prev => [...prev, { role: 'user', content: s }])}
                  style={{
                    backgroundColor: isDark ? '#1e2030' : '#edf2f7',
                    color: isDark ? '#e2e8f0' : '#334155',
                    fontSize: '0.78rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '14px 14px 4px 14px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '0.65rem 0.85rem 0.45rem', backgroundColor: isDark ? '#14151f' : '#ffffff' }}>
          <form onSubmit={handleSend} style={{
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
            borderRadius: '24px',
            padding: '0.35rem 0.35rem 0.35rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#1e2030' : '#ffffff',
          }}>
            <input
              type="text"
              placeholder={placeholder}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '0.8rem',
                color: isDark ? '#f8fafc' : '#1f2937',
                outline: 'none',
              }}
            />
            <button type="submit" style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              backgroundColor: primaryColor,
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              cursor: 'pointer',
            }}>
              <Send size={13} />
            </button>
          </form>

          {/* Branding Line */}
          {!brandData?.hide_branding && (
            <div style={{
              padding: '0.4rem 0 0.1rem',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
            }}>
              Powered by <strong style={{ color: '#6366f1' }}>ChatSphare</strong>
            </div>
          )}
        </div>
      </div>

      {/* Floating Launcher: Pill (Centered) or Circular Bubble (Corner) */}
      {(() => {
        const isPill = brandData?.layout === 'pill' || brandData?.layout === 'floating' || brandData?.widget_settings?.layout === 'pill';
        return (
          <div style={{
            display: 'flex',
            justifyContent: isPill ? 'center' : (position === 'Left' ? 'flex-start' : 'flex-end'),
            width: '100%',
            maxWidth: '340px',
          }}>
            {isPill ? (
              <div style={{
                height: '42px',
                padding: '0 18px',
                borderRadius: '9999px',
                backgroundColor: isDark ? 'rgba(18, 19, 25, 0.92)' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid #e2e8f0',
                boxShadow: isDark
                  ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 16px ${primaryColor}70`
                  : '0 8px 24px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
              }}>
                {widgetAvatar ? (
                  <img src={widgetAvatar} alt="Launcher" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={13} color="#ffffff" />
                  </div>
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#ffffff' : '#1e293b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                  Chat with{' '}
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
                    {brandData?.brand_name || displayName}
                  </strong>
                </span>
                <Sparkles size={13} color={primaryColor} />
              </div>
            ) : (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                border: '2px solid #ffffff',
                overflow: 'hidden',
              }}>
                {widgetAvatar ? (
                  <img src={widgetAvatar} alt="Launcher" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} color="#ffffff" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
