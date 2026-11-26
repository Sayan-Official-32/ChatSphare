import React, { useState, useRef, useEffect } from 'react';
import {
  X, Sun, Moon, Info, Upload, Shuffle, ChevronDown, ChevronLeft, Plus, Send, MessageSquare, Maximize2, Edit3, Sparkles
} from 'lucide-react';

const LOCAL_AGENT_ICONS = [
  '/assets/agent-icons/agent-icon-1.jpg',
  '/assets/agent-icons/agent-icon-2.avif',
  '/assets/agent-icons/agent-icon-3.jpg',
  '/assets/agent-icons/agent-icon-4.jpg',
  '/assets/agent-icons/agent-icon-5.avif',
  '/assets/agent-icons/agent-icon-6.jpg',
  '/assets/agent-icons/agent-icon-7.avif',
  '/assets/agent-icons/agent-icon-8.webp',
  '/assets/agent-icons/agent-icon-9.webp',
  '/assets/agent-icons/agent-icon-10.webp',
];
const RANDOM_ICONS = LOCAL_AGENT_ICONS;

// Color Conversion Helpers
function hexToRgb(hex) {
  let c = (hex || '#e86a2e').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 232, g: 106, b: 46 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h, s, v) {
  h = (h % 360 + 360) % 360;
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

import WidgetColorPicker from './WidgetColorPicker';

const CustomColorPicker = WidgetColorPicker;


export default function CustomizeWidgetModal({
  isOpen,
  onClose,
  brandData,
  onSave,
  widgetSettings,
  onSaveWidgetSettings,
  brandName,
  logoUrl,
  isDark = true,
}) {
  const agentIconRef = useRef(null);
  const widgetIconRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Appearance'); // 'Appearance' | 'Content'
  const [previewMode, setPreviewMode] = useState('Widget');  // 'Widget' | 'Fullscreen' | 'Floating'

  // Resolve initial data from either brandData or individual props
  const effectiveData = brandData || {
    ...widgetSettings,
    display_name: brandName,
    brand_name: brandName,
    logo_url: logoUrl,
    primary_color: widgetSettings?.primaryColor || widgetSettings?.primary_color,
  };

  const [settings, setSettings] = useState({
    theme: effectiveData?.theme || 'Light',
    primary_color: effectiveData?.primary_color || effectiveData?.primaryColor || '#7c3aed',
    agent_icon: effectiveData?.agent_icon || effectiveData?.logo_url || RANDOM_ICONS[0],
    widget_icon: effectiveData?.widget_icon || effectiveData?.logo_url || RANDOM_ICONS[0],
    widget_icon_type: effectiveData?.widget_icon_type || 'Custom Icon',
    position: effectiveData?.position || 'Right',
    hide_branding: effectiveData?.hide_branding || false,
    display_name: effectiveData?.display_name || effectiveData?.brand_name || 'SayanBot',
    placeholder: effectiveData?.placeholder || 'Type your message...',
    greeting: effectiveData?.greeting || `Hello! I'm your ${effectiveData?.brand_name || 'SayanBot'} assistant. How can I help?`,
    suggestions: effectiveData?.suggestions || ['What are your services?', 'Contact support'],
    show_callouts: effectiveData?.show_callouts !== undefined ? effectiveData.show_callouts : false,
  });

  // Interactive Live Chat simulation state
  const [chatMessages, setChatMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const data = brandData || {
        ...widgetSettings,
        display_name: brandName,
        brand_name: brandName,
        logo_url: logoUrl,
        primary_color: widgetSettings?.primaryColor || widgetSettings?.primary_color,
      };
      setSettings({
        theme: data?.theme || 'Light',
        primary_color: data?.primary_color || data?.primaryColor || '#7c3aed',
        agent_icon: data?.agent_icon || data?.logo_url || RANDOM_ICONS[0],
        widget_icon: data?.widget_icon || data?.logo_url || RANDOM_ICONS[0],
        widget_icon_type: data?.widget_icon_type || 'Custom Icon',
        position: data?.position || 'Right',
        hide_branding: data?.hide_branding || false,
        display_name: data?.display_name || data?.brand_name || 'SayanBot',
        placeholder: data?.placeholder || 'Type your message...',
        greeting: data?.greeting || `Hello! I'm your ${data?.brand_name || 'SayanBot'} assistant. How can I help?`,
        suggestions: data?.suggestions || ['What are your services?', 'Contact support'],
        show_callouts: data?.show_callouts !== undefined ? data.show_callouts : false,
      });

      setChatMessages([
        { id: 'init', sender: 'agent', text: data?.greeting || `Hello! I'm your assistant. How can I help?` }
      ]);
    }
  }, [isOpen, brandData, widgetSettings, brandName, logoUrl]);

  // Reset chat preview when greeting changes
  useEffect(() => {
    setChatMessages([
      { id: 'init', sender: 'agent', text: settings.greeting || `Hello! I'm your assistant. How can I help?` }
    ]);
  }, [settings.greeting]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSimulating]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleAgentIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => updateSetting('agent_icon', ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleWidgetIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => updateSetting('widget_icon', ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRandomizeAgentIcon = () => {
    const random = RANDOM_ICONS[Math.floor(Math.random() * RANDOM_ICONS.length)];
    updateSetting('agent_icon', random);
  };

  const handleRandomizeWidgetIcon = () => {
    const random = RANDOM_ICONS[Math.floor(Math.random() * RANDOM_ICONS.length)];
    updateSetting('widget_icon', random);
  };

  const handleSendTestMessage = (userText) => {
    const textToSend = (userText || testInput).trim();
    if (!textToSend) return;

    const newMsg = { id: `user-${Date.now()}`, sender: 'user', text: textToSend };
    setChatMessages(prev => [...prev, newMsg]);
    setTestInput('');
    setIsSimulating(true);

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: `Thanks for testing! As ${settings.display_name}, I'm customized to represent your brand accurately with this configured theme.`
        }
      ]);
      setIsSimulating(false);
    }, 600);
  };

  const handleSave = () => {
    const selectedLogo = settings.agent_icon || settings.widget_icon || effectiveData?.logo_url;
    const finalPayload = {
      ...settings,
      primaryColor: settings.primary_color,
      logo_url: selectedLogo,
    };
    if (onSave) {
      onSave(finalPayload);
    }
    if (onSaveWidgetSettings) {
      onSaveWidgetSettings(finalPayload);
    }
    onClose();
  };

  const isLight = settings.theme === 'Light';
  const bgColor = isLight ? '#ffffff' : '#14151f';
  const textColor = isLight ? '#1f2937' : '#f3f4f6';

  const cardStyle = {
    background: isDark ? '#0a0b10' : '#f8fafc',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
  };

  const inputStyle = {
    width: '100%',
    background: isDark ? '#161720' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.6rem 0.9rem',
    color: isDark ? '#fff' : '#0f172a',
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: isDark ? 'rgba(5, 6, 10, 0.85)' : 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1150px',
        maxHeight: '94vh',
        background: isDark ? '#0d0e14' : '#ffffff',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
        borderRadius: '20px',
        boxShadow: isDark
          ? '0 25px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(232, 106, 46, 0.1)'
          : '0 20px 50px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        color: isDark ? '#fff' : '#0f172a',
      }}>

        {/* ── MODAL HEADER ────────────────────────────────────────────── */}
        <div style={{
          padding: '1.25rem 2rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
              Customize Chat Widget
            </h2>
            <p style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b', margin: '0.25rem 0 0' }}>
              Personalize your chat widget's appearance and behavior
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = isDark ? '#fff' : '#0f172a'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : '#64748b'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── MODAL BODY GRID (Left Controls + Right Live Preview) ────── */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 500px',
          overflow: 'hidden',
        }}>

          {/* ── LEFT COLUMN — CONTROLS ────────────────────────────────── */}
          <div style={{
            padding: '1.5rem 2rem',
            overflowY: 'auto',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
            background: isDark ? '#0d0e14' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>

            {/* Sub-tabs: Appearance / Content */}
            <div style={{
              display: 'flex',
              background: isDark ? '#161720' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '4px',
              gap: '4px',
            }}>
              {['Appearance', 'Content'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0',
                    borderRadius: '7px',
                    border: 'none',
                    background: activeTab === tab ? (isDark ? 'rgba(255, 255, 255, 0.12)' : '#ffffff') : 'transparent',
                    color: activeTab === tab ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b'),
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: activeTab === tab && !isDark ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Appearance' ? (
              <>
                {/* 1. Theme Selector Card */}
                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.6rem' }}>
                    Theme <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Light', 'Dark'].map(t => (
                      <button
                        key={t}
                        onClick={() => updateSetting('theme', t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          border: settings.theme === t ? 'none' : (isDark ? 'none' : '1px solid #cbd5e1'),
                          background: settings.theme === t ? '#7c3aed' : (isDark ? '#161720' : '#ffffff'),
                          color: settings.theme === t ? '#fff' : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        title={t + ' Theme'}
                      >
                        {t === 'Light' ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Primary Color Picker (Real-time Click & Drag Position Tracking) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.5rem' }}>
                    Primary Color
                  </label>
                  <CustomColorPicker
                    color={settings.primary_color}
                    onChange={newColor => updateSetting('primary_color', newColor)}
                  />
                </div>

                {/* 3. Agent Icon Upload Card */}
                <div style={cardStyle}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.2rem' }}>
                    Agent Icon <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontWeight: 400 }}>(Select from presets or upload custom image)</span>
                  </label>

                  {/* Local Preset Icons Palette */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.4rem 0 0.6rem', scrollbarWidth: 'thin' }}>
                    {LOCAL_AGENT_ICONS.map((iconUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => updateSetting('agent_icon', iconUrl)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: settings.agent_icon === iconUrl ? '2px solid #7c3aed' : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1'),
                          padding: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          background: isDark ? '#161720' : '#ffffff',
                          boxShadow: settings.agent_icon === iconUrl ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title={`Agent Icon ${idx + 1}`}
                      >
                        <img src={iconUrl} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>

                  <input type="file" ref={agentIconRef} accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/*" onChange={handleAgentIconUpload} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                    <div
                      onClick={() => agentIconRef.current?.click()}
                      style={{
                        flex: 1,
                        background: isDark ? '#161720' : '#ffffff',
                        border: isDark ? '1px dashed rgba(255,255,255,0.15)' : '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.55rem 0.9rem',
                        fontSize: '0.82rem',
                        color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload Custom Image</span>
                    </div>
                    <button
                      onClick={handleRandomizeAgentIcon}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: isDark ? '#161720' : '#ffffff',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                        color: isDark ? '#fff' : '#1e293b',
                        borderRadius: '8px',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Shuffle size={13} />
                      Random
                    </button>
                    {settings.agent_icon && (
                      <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1', flexShrink: 0 }}>
                        <img src={settings.agent_icon} alt="Agent Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Widget Icon Customizer Card */}
                <div style={cardStyle}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.2rem' }}>
                    Widget Icon <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontWeight: 400 }}>(Select from presets or upload custom image)</span>
                  </label>

                  {/* Local Preset Icons Palette */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.4rem 0 0.6rem', scrollbarWidth: 'thin' }}>
                    {LOCAL_AGENT_ICONS.map((iconUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => updateSetting('widget_icon', iconUrl)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: settings.widget_icon === iconUrl ? '2px solid #7c3aed' : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1'),
                          padding: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          background: isDark ? '#161720' : '#ffffff',
                          boxShadow: settings.widget_icon === iconUrl ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title={`Widget Icon ${idx + 1}`}
                      >
                        <img src={iconUrl} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>

                  <input type="file" ref={widgetIconRef} accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/*" onChange={handleWidgetIconUpload} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                    <div
                      onClick={() => widgetIconRef.current?.click()}
                      style={{
                        flex: 1,
                        background: isDark ? '#161720' : '#ffffff',
                        border: isDark ? '1px dashed rgba(255,255,255,0.15)' : '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.55rem 0.9rem',
                        fontSize: '0.82rem',
                        color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload Custom Image</span>
                    </div>
                    <button
                      onClick={handleRandomizeWidgetIcon}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: isDark ? '#161720' : '#ffffff',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                        color: isDark ? '#fff' : '#1e293b',
                        borderRadius: '8px',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Shuffle size={13} />
                      Random
                    </button>
                    {settings.widget_icon && (
                      <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1', flexShrink: 0 }}>
                        <img src={settings.widget_icon} alt="Widget Launcher Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Widget Position Card */}
                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.4rem' }}>
                    Widget Position <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <select
                    value={settings.position}
                    onChange={e => updateSetting('position', e.target.value)}
                    style={{
                      width: '100%',
                      background: isDark ? '#161720' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.55rem 0.9rem',
                      color: isDark ? '#fff' : '#0f172a',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                  </select>
                </div>

                {/* 6. Advanced Settings Accordion */}
                <div style={{ ...cardStyle, padding: '0.85rem 1.25rem' }}>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? 'rgba(255,255,255,0.8)' : '#1e293b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Advanced settings</span>
                    <ChevronDown size={16} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </button>
                  {showAdvanced && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', lineHeight: 1.5 }}>
                      Configure custom CSS triggers, z-index layering, and widget auto-open delays.
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Content Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.4rem' }}>
                    Agent Display Name <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <input
                    type="text"
                    value={settings.display_name}
                    onChange={e => updateSetting('display_name', e.target.value)}
                    placeholder="SayanBot"
                    style={inputStyle}
                  />
                </div>

                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.4rem' }}>
                    Message Placeholder <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <input
                    type="text"
                    value={settings.placeholder}
                    onChange={e => updateSetting('placeholder', e.target.value)}
                    placeholder="Type your message..."
                    style={inputStyle}
                  />
                </div>

                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.5rem' }}>
                    Suggested Messages <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {settings.suggestions.map((chip, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={chip}
                          onChange={e => {
                            const newS = [...settings.suggestions];
                            newS[idx] = e.target.value;
                            updateSetting('suggestions', newS);
                          }}
                          placeholder="Type a suggested prompt..."
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newS = settings.suggestions.filter((_, i) => i !== idx);
                            updateSetting('suggestions', newS);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateSetting('suggestions', [...settings.suggestions, ''])}
                      style={{
                        width: '100%',
                        background: isDark ? '#161720' : '#ffffff',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.6rem 0',
                        color: isDark ? '#fff' : '#1e293b',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '0.2rem',
                      }}
                    >
                      Add Suggestion
                    </button>
                  </div>
                </div>

                <div style={cardStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#1e293b', marginBottom: '0.4rem' }}>
                    Initial Message <Info size={13} color={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'} />
                  </label>
                  <textarea
                    value={settings.greeting}
                    onChange={e => updateSetting('greeting', e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN — DYNAMIC LIVE PREVIEW (Widget | Fullscreen | Floating) ── */}
          <div style={{
            padding: '1.5rem 1.75rem',
            background: isDark ? '#090a0f' : '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            overflowY: 'auto',
          }}>

            {/* Header + Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                Live Preview
              </span>
              <div style={{
                display: 'flex',
                background: isDark ? '#161720' : '#e2e8f0',
                borderRadius: '9999px',
                padding: '3px',
                gap: '3px',
              }}>
                {['Widget', 'Fullscreen', 'Floating'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPreviewMode(m)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: previewMode === m ? '#7c3aed' : 'transparent',
                      color: previewMode === m ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : '#64748b'),
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* ── DYNAMIC PREVIEW VIEW SWITCHER ────────────────────────── */}
            {(() => {
              const renderInteractiveChatBox = (boxMaxWidth = '360px') => (
                <div style={{
                  width: '100%',
                  maxWidth: boxMaxWidth,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: isLight ? '#ffffff' : '#14151f',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255,255,255,0.1)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                }}>
                  {/* Header Bar styled with Primary Color */}
                  <div style={{
                    background: settings.primary_color,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {settings.agent_icon && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1.5px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: 'none'
                        }}>
                          <img src={settings.agent_icon} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                        {settings.display_name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', opacity: 0.9 }}>
                      <Maximize2 size={16} style={{ cursor: 'pointer' }} />
                      <Edit3 size={16} style={{ cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    flex: 1,
                    maxHeight: '320px',
                    overflowY: 'auto',
                    background: isLight ? '#fcfcfd' : '#14151f'
                  }}>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          gap: '0.65rem',
                          alignItems: 'flex-start',
                          justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {msg.sender === 'agent' && settings.agent_icon && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            marginTop: '2px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <img src={settings.agent_icon} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{
                          background: msg.sender === 'user' ? settings.primary_color : `${settings.primary_color}18`,
                          color: msg.sender === 'user' ? '#ffffff' : (isLight ? '#1e293b' : '#f1f5f9'),
                          borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '0.65rem 0.9rem',
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          maxWidth: '82%',
                          wordBreak: 'break-word',
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isSimulating && (
                      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                        <div style={{
                          background: `${settings.primary_color}18`,
                          borderRadius: '12px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.75rem',
                          color: isLight ? '#64748b' : '#94a3b8',
                          fontStyle: 'italic',
                        }}>
                          {settings.display_name} is typing...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />

                    {/* Suggestions */}
                    {settings.suggestions && settings.suggestions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : 'rgba(255,255,255,0.5)' }}>
                          Click a suggestion to test:
                        </span>
                        {settings.suggestions.filter(Boolean).map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSendTestMessage(s)}
                            style={{
                              background: isLight ? '#edf2f7' : '#1e2030',
                              color: isLight ? '#334155' : '#e2e8f0',
                              fontSize: '0.78rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: '14px 14px 4px 14px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input Bar */}
                  <div style={{ padding: '0.85rem 1rem 0.5rem', background: isLight ? '#ffffff' : '#14151f' }}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendTestMessage();
                      }}
                      style={{
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '24px',
                        padding: '0.35rem 0.4rem 0.35rem 0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isLight ? '#ffffff' : '#1e2030',
                      }}
                    >
                      <input
                        type="text"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder={settings.placeholder || 'Type your message...'}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          fontSize: '0.82rem',
                          color: textColor,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: 'none',
                          background: settings.primary_color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <Send size={13} />
                      </button>
                    </form>

                    {/* Footer Branding */}
                    {!settings.hide_branding && (
                      <div style={{
                        padding: '0.5rem 0 0.2rem',
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
                      }}>
                        Powered by <strong style={{ color: '#6366f1' }}>ChatSphare</strong>
                      </div>
                    )}
                  </div>
                </div>
              );

              return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
                  {/* MODE A: WIDGET PREVIEW MODE */}
                  {previewMode === 'Widget' && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: settings.position === 'Left' ? 'flex-start' : 'flex-end',
                      position: 'relative',
                      height: '100%',
                    }}>
                      {renderInteractiveChatBox('360px')}

                      {/* Floating Launcher Icon — Exact Below Bottom Right of Chat Section */}
                      <div style={{
                        marginTop: '0.85rem',
                        display: 'flex',
                        justifyContent: settings.position === 'Left' ? 'flex-start' : 'flex-end',
                        width: '100%',
                        maxWidth: '360px',
                      }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.1)' : '0 6px 20px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                          border: '2px solid #ffffff',
                          overflow: 'hidden',
                        }}>
                          {settings.widget_icon ? (
                            <img src={settings.widget_icon} alt="Launcher" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: settings.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MessageSquare size={24} color="#ffffff" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

              {/* MODE B: FULLSCREEN PREVIEW MODE */}
              {previewMode === 'Fullscreen' && (
                <div style={{
                  flex: 1,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: bgColor,
                  border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  color: textColor,
                }}>
                  {/* Left Sidebar */}
                  <div style={{
                    borderRight: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.85rem 0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {settings.agent_icon && (
                          <img src={settings.agent_icon} alt="Avatar" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {settings.display_name}
                        </span>
                      </div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(128,128,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={11} color="gray" />
                      </div>
                    </div>

                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      background: 'transparent',
                      border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '0.35rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: textColor,
                      cursor: 'pointer',
                    }}>
                      <Plus size={11} /> New Chat
                    </button>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 0.2rem' }}>
                      <span style={{ fontSize: '0.62rem', color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                        Users conversations will appear here
                      </span>
                    </div>
                  </div>

                  {/* Main Fullscreen Body */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', textAlign: 'center', color: textColor, maxWidth: '280px', lineHeight: 1.35 }}>
                      {settings.greeting}
                    </h3>

                    <div style={{
                      width: '100%',
                      maxWidth: '300px',
                      background: isLight ? '#ffffff' : '#1a1b26',
                      border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)' }}>
                        {settings.placeholder}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: settings.primary_color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                        }}>
                          <Send size={11} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', textAlign: 'center', width: '100%' }}>
                      <span style={{ fontSize: '0.66rem', color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.5rem' }}>
                        Suggested prompts
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {settings.suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: isLight ? '#ffffff' : '#1e1f2e',
                              border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
                              color: isLight ? '#4b5563' : '#d1d5db',
                              fontSize: '0.68rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {!settings.hide_branding && (
                      <div style={{ position: 'absolute', bottom: '0.75rem', right: '1rem', fontSize: '0.62rem', color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)' }}>
                        Powered by <strong style={{ color: '#6366f1' }}>ChatSphare</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

                  {/* MODE C: FLOATING PREVIEW MODE */}
                  {previewMode === 'Floating' && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      height: '100%',
                    }}>
                      {renderInteractiveChatBox('360px')}

                      {/* Floating Pill Launcher in Center Position */}
                      <div style={{
                        marginTop: '0.85rem',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                      }}>
                        <div style={{
                          height: '48px',
                          padding: '0 22px',
                          borderRadius: '9999px',
                          background: isLight ? '#ffffff' : 'rgba(18, 19, 25, 0.92)',
                          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.18)',
                          boxShadow: isLight
                            ? '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)'
                            : `0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px ${settings.primary_color}80`,
                          backdropFilter: 'blur(16px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.25s ease',
                        }}>
                          {settings.widget_icon ? (
                            <img
                              src={settings.widget_icon}
                              alt="Avatar"
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: settings.primary_color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}>
                              <MessageSquare size={14} color="#ffffff" />
                            </div>
                          )}
                          <span style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: isLight ? '#1e293b' : '#ffffff',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            Chat with{' '}
                            <strong style={{
                              color: settings.primary_color || '#e86a2e',
                              fontWeight: 700,
                              backgroundColor: `${settings.primary_color || '#e86a2e'}24`,
                              boxShadow: `0 0 12px ${settings.primary_color || '#e86a2e'}40`,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              marginLeft: '4px',
                              display: 'inline-block',
                              letterSpacing: '0.01em',
                            }}>
                              {settings.brand_name || settings.display_name}
                            </strong>
                          </span>
                          <Sparkles size={14} color={settings.primary_color || '#e86a2e'} />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* Widget Branding Add-on Card */}
            <div style={{
              background: isDark ? '#141520' : '#ffffff',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>Widget branding</span>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Add-on</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.hide_branding}
                    onChange={e => updateSetting('hide_branding', e.target.checked)}
                    style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.76rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>Hide "Powered by ChatSphare"</span>
                </div>
              </div>
              <button
                onClick={() => updateSetting('hide_branding', !settings.hide_branding)}
                style={{
                  background: '#7c3aed',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Upgrade
              </button>
            </div>

          </div>

        </div>

        {/* ── ACTION FOOTER BUTTONS ──────────────────────────────────── */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          background: isDark ? '#0d0e14' : '#ffffff',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              color: isDark ? '#ffffff' : '#334155',
              padding: '0.55rem 1.4rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: '#7c3aed',
              border: 'none',
              color: '#ffffff',
              padding: '0.55rem 1.6rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
