/**
 * @file Step2Brand.jsx
 * @description Wizard Step 2: Brand Identity & AI Persona Configuration Component.
 * 
 * Features:
 * 1. Futuristic laser scan AI extraction progress bar.
 * 2. Brand name, logo upload, primary color picker, and brand summary form.
 * 3. AI Persona role selection (balanced, support specialist, sales, technical expert).
 * 4. Real-time live widget simulator preview side-by-side with customize modal trigger.
 */

import React, { useState, useEffect, useRef } from 'react';
import LiveWidgetPreview from '@/components/widget/LiveWidgetPreview';
import CustomizeWidgetModal from '@/components/widget/CustomizeWidgetModal';
import { Upload, Settings2, RefreshCw, Sun, Moon, ChevronDown, Sparkles, Zap, Cpu } from 'lucide-react';
import { generateBrandSummary } from '@/services/api';

/** Pre-configured AI Agent Role Options */
const ROLE_OPTIONS = [
  { value: 'Brand assistant (balanced)', label: 'Brand assistant (balanced)', desc: 'General brand representative—helpful Q&A, accurate and on-voice.' },
  { value: 'Customer Support Specialist', label: 'Customer Support Specialist', desc: 'Handles support tickets, troubleshooting and FAQs.' },
  { value: 'Sales & Lead Generation', label: 'Sales & Lead Generation', desc: 'Qualifies leads, answers pricing questions, books demos.' },
  { value: 'Technical Documentation Expert', label: 'Technical Documentation Expert', desc: 'Answers technical questions using docs and specs.' },
];

/** Helper component for form field labels */
function FieldLabel({ children, required, isLight, style = {} }) {
  return (
    <label style={{
      display: 'block',
      fontSize: '0.82rem',
      fontWeight: 600,
      color: isLight ? '#0f172a' : 'rgba(255,255,255,0.85)',
      marginBottom: '0.45rem',
      ...style,
    }}>
      {children}
      {required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
  );
}

/** Form input style helper function */
const inputStyle = (disabled, isLight) => ({
  width: '100%',
  background: isLight ? '#f8fafc' : '#16171e',
  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.09)',
  borderRadius: '8px',
  padding: '0.6rem 0.9rem',
  color: isLight ? '#0f172a' : '#ffffff',
  fontSize: '0.88rem',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
  cursor: disabled ? 'not-allowed' : 'text',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.2s ease',
});

/**
 * Step 2 Brand Configuration component.
 * 
 * @param {Object} props - React props.
 * @param {Object} props.brandData - Current brand fields state object.
 * @param {boolean} props.isCrawling - Crawling active state flag.
 * @param {string} [props.theme='dark'] - Color theme mode ('light'|'dark').
 * @param {Function} props.onSaveBrand - Save brand callback handler `(formData)`.
 * @param {Function} props.onBack - Backward navigation handler.
 * @returns {JSX.Element} Step 2 UI component element.
 */
export default function Step2Brand({ brandData, isCrawling, theme = 'dark', onSaveBrand, onBack }) {
  const isLight = theme === 'light';
  const logoFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    brand_id:          brandData?.brand_id          || '',
    agent_id:          brandData?.agent_id          || '',
    brand_name:        brandData?.brand_name        || '',
    display_name:      brandData?.display_name      || '',
    primary_color:     brandData?.primary_color     || '#6366f1',
    brand_description: brandData?.brand_description || '',
    role:              brandData?.role               || 'Brand assistant (balanced)',
    theme:             brandData?.theme              || 'Light',
    logo_url:          brandData?.logo_url           || '',
    position:          brandData?.position           || 'Right',
    hide_branding:     brandData?.hide_branding      || false,
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [crawlStatusText, setCrawlStatusText] = useState('Starting crawl...');
  useEffect(() => {
    if (!isCrawling) return;
    const statuses = [
      'Starting crawl...',
      'Scanning website DOM & metadata...',
      'Extracting brand logo & theme colors...',
      'Synthesizing AI persona with Mistral...',
    ];
    let idx = 0;
    setCrawlStatusText(statuses[0]);
    const iv = setInterval(() => {
      idx = (idx + 1) % statuses.length;
      setCrawlStatusText(statuses[idx]);
    }, 1500);
    return () => clearInterval(iv);
  }, [isCrawling]);

  useEffect(() => {
    if (!brandData) return;
    setFormData(prev => ({
      ...prev,
      brand_id:          brandData.brand_id          || prev.brand_id,
      agent_id:          brandData.agent_id          || prev.agent_id,
      brand_name:        brandData.brand_name        || prev.brand_name,
      display_name:      brandData.display_name      || prev.display_name,
      primary_color:     brandData.primary_color     || prev.primary_color,
      brand_description: brandData.brand_description || prev.brand_description,
      role:              brandData.role               || prev.role,
      logo_url:          brandData.logo_url           || prev.logo_url,
    }));
  }, [brandData]);

  /** Form field mutator helper */
  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  /** Synthesizes structured 5-6 sentence Brand Summary via Mistral LLM using active form & brand data */
  const handleGenerateAISummary = async () => {
    if (isGeneratingSummary || isCrawling) return;
    setIsGeneratingSummary(true);
    try {
      const knowledgeTexts = (brandData?.knowledge_items || [])
        .map(k => k.content || k.title || '')
        .filter(Boolean)
        .join('\n');

      const rawText = knowledgeTexts || brandData?.text_content || brandData?.content || '';

      const res = await generateBrandSummary({
        brand_name: formData.brand_name?.trim() || brandData?.brand_name || 'Brand',
        domain: brandData?.url || formData.url || '',
        meta_description: formData.brand_description?.trim() || brandData?.brand_description || '',
        role: formData.role || brandData?.role || '',
        text_content: rawText,
      });

      if (res?.brand_description) {
        setFormData(prev => ({
          ...prev,
          brand_description: res.brand_description,
          role: res.role || prev.role,
          greeting: res.greeting || prev.greeting,
          tone: res.tone || prev.tone,
          system_prompt: res.system_prompt || prev.system_prompt,
        }));
      }
    } catch (err) {
      console.error('Failed to generate brand summary via Mistral LLM:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  /** File upload handler for custom brand logo images */
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setFormData(prev => ({
        ...prev,
        logo_url: url,
        agent_icon: url,
        widget_icon: url,
      }));
    };
    reader.readAsDataURL(file);
  };

  /** Form submit handler */
  const handleSubmit = () => {
    if (isFormValid) onSaveBrand(formData);
  };

  const isFormValid =
    formData.brand_name.trim() !== '' && formData.brand_description.trim() !== '';

  const currentRole = ROLE_OPTIONS.find(r => r.value === formData.role) || ROLE_OPTIONS[0];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={logoFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/*"
        onChange={handleLogoFileChange}
        style={{ display: 'none' }}
      />

      {/* Customize Widget Modal */}
      <CustomizeWidgetModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        brandData={formData}
        onSave={(updatedSettings) => {
          setFormData(prev => ({ ...prev, ...updatedSettings }));
        }}
      />

      {/* OUTER CARD */}
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
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: isLight ? '#ffffff' : '#121319',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px 16px 0 0',
          boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 50px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
        }}>

          {/* Card header */}
          <div style={{
            padding: '1.75rem 2.5rem 1rem',
            flexShrink: 0,
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: isLight ? '#0f172a' : '#ffffff',
              margin: 0,
            }}>
              Your brand at a glance
            </h2>
            <p style={{
              fontSize: '0.86rem',
              color: isLight ? '#64748b' : 'rgba(255,255,255,0.45)',
              marginTop: '0.35rem',
              marginBottom: 0,
              lineHeight: 1.5,
            }}>
              Add how your assistant should sound and look—you can refine everything later.
            </p>

            {/* AI Crawl Status Futuristic Extraction Bar */}
            <div style={{
              overflow: 'hidden',
              maxHeight: isCrawling ? '90px' : '0px',
              opacity: isCrawling ? 1 : 0,
              marginTop: isCrawling ? '1.2rem' : '0px',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{
                width: '100%',
                height: '48px',
                borderRadius: '9999px',
                background: isLight ? '#f8fafc' : 'linear-gradient(90deg, rgba(13, 15, 26, 0.95), rgba(24, 18, 43, 0.95), rgba(13, 15, 26, 0.95))',
                border: isLight ? '1px solid #c084fc' : '1px solid rgba(168, 85, 247, 0.4)',
                boxShadow: isLight ? '0 4px 20px rgba(192, 132, 252, 0.25)' : '0 0 35px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}>
                {/* Horizontal Sweeping Laser Light Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '30%',
                  background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.25), rgba(56, 189, 248, 0.35), transparent)',
                  animation: 'aiLaserScan 2.4s linear infinite',
                  pointerEvents: 'none',
                }} />

                {/* AI Sparkles Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 2 }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(124, 58, 237, 0.8)',
                  }}>
                    <Sparkles size={15} color="#ffffff" style={{ animation: 'spin 4s linear infinite' }} />
                  </div>
                  <span style={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: 'linear-gradient(90deg, #7c3aed, #0284c7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    AI BRAND DNA SCAN
                  </span>
                </div>

                {/* Status Text */}
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  zIndex: 2,
                  fontFamily: 'var(--font-sans)',
                }}>
                  <RefreshCw size={14} className="animate-spin" color="#0284c7" />
                  {crawlStatusText}
                </span>

                <style>{`
                  @keyframes aiLaserScan {
                    0% { left: -30%; }
                    100% { left: 100%; }
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* SCROLLABLE two-column body */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: 0,
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.07)',
          }}>

            {/* LEFT — scrollable form */}
            <div style={{
              padding: '1.75rem 2.5rem 2rem',
              borderRight: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.4rem',
              opacity: isCrawling ? 0.55 : 1,
              pointerEvents: isCrawling ? 'none' : 'auto',
              transition: 'opacity 0.3s ease',
            }}>

              {/* Logo + Brand name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div>
                  <FieldLabel isLight={isLight}>Logo</FieldLabel>
                  <div
                    onClick={() => !isCrawling && logoFileInputRef.current?.click()}
                    style={{
                      width: '100px', height: '100px',
                      background: isLight ? '#f8fafc' : '#16171e',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '0.4rem',
                      cursor: isCrawling ? 'not-allowed' : 'pointer',
                      color: isLight ? '#64748b' : 'rgba(255,255,255,0.45)',
                      overflow: 'hidden', position: 'relative',
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!isCrawling) e.currentTarget.style.borderColor = '#7c3aed'; }}
                    onMouseLeave={e => { if (!isCrawling) e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'; }}
                    title="Click to change logo"
                  >
                    {(() => {
                      const activeLogo = formData.logo_url || formData.agent_icon || formData.widget_icon;
                      return activeLogo ? (
                        <>
                          <img src={activeLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {!isCrawling && (
                            <div
                              style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s ease',
                                color: '#fff', fontSize: '0.68rem', gap: '4px',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                            >
                              <Upload size={14} />
                              <span>Change logo</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span style={{ fontSize: '0.72rem' }}>Upload logo</span>
                        </>
                      );
                    })()}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                    PNG or SVG, square works best.
                  </p>
                </div>

                <div>
                  <FieldLabel required isLight={isLight}>Brand name</FieldLabel>
                  <input
                    type="text"
                    disabled={isCrawling}
                    value={formData.brand_name}
                    onChange={e => handleChange('brand_name', e.target.value)}
                    placeholder="Acme Inc."
                    style={inputStyle(isCrawling, isLight)}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={e => e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.09)'}
                  />
                </div>
              </div>

              {/* Agent display name + Primary color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <FieldLabel isLight={isLight}>Agent display name</FieldLabel>
                  <input
                    type="text"
                    disabled={isCrawling}
                    value={formData.display_name}
                    onChange={e => handleChange('display_name', e.target.value)}
                    placeholder="Acme Assistant"
                    style={inputStyle(isCrawling, isLight)}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={e => e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <div>
                  <FieldLabel isLight={isLight}>Primary color</FieldLabel>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: isLight ? '#f8fafc' : '#16171e',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '8px', padding: '0.5rem 0.9rem',
                    opacity: isCrawling ? 0.6 : 1,
                    pointerEvents: isCrawling ? 'none' : 'auto',
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '5px',
                      background: formData.primary_color,
                      border: '1px solid rgba(0,0,0,0.15)',
                      flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    }}>
                      <input
                        type="color"
                        disabled={isCrawling}
                        value={formData.primary_color}
                        onChange={e => handleChange('primary_color', e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: '200%', height: '200%', top: '-50%', left: '-50%', cursor: 'pointer' }}
                      />
                    </div>
                    <input
                      type="text"
                      disabled={isCrawling}
                      value={formData.primary_color}
                      onChange={e => handleChange('primary_color', e.target.value)}
                      style={{
                        flex: 1, background: 'transparent', border: 'none',
                        color: isLight ? '#0f172a' : 'rgba(255,255,255,0.75)', fontSize: '0.86rem',
                        outline: 'none', fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Brand summary */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <FieldLabel required isLight={isLight} style={{ margin: 0 }}>Brand summary</FieldLabel>
                  <button
                    type="button"
                    disabled={isCrawling || isGeneratingSummary}
                    onClick={handleGenerateAISummary}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'rgba(124, 58, 237, 0.1)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '6px', padding: '0.25rem 0.65rem',
                      color: isLight ? '#6d28d9' : '#a78bfa',
                      fontSize: '0.75rem', fontWeight: 600,
                      cursor: (isCrawling || isGeneratingSummary) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Synthesize an in-depth 5-6 sentence summary using Mistral AI"
                  >
                    <Sparkles size={13} className={isGeneratingSummary ? "animate-spin" : ""} color={isLight ? '#6d28d9' : '#a78bfa'} />
                    <span>{isGeneratingSummary ? 'Synthesizing with Mistral AI...' : 'AI Generate Summary'}</span>
                  </button>
                </div>
                <textarea
                  disabled={isCrawling || isGeneratingSummary}
                  value={formData.brand_description}
                  onChange={e => handleChange('brand_description', e.target.value)}
                  placeholder="A short description of what your brand does and who it serves."
                  rows={4}
                  style={{ ...inputStyle(isCrawling || isGeneratingSummary, isLight), resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.09)'}
                />
              </div>

              {/* Widget theme */}
              <div>
                <FieldLabel isLight={isLight}>Widget theme</FieldLabel>
                <div style={{
                  display: 'inline-flex',
                  background: isLight ? '#f1f5f9' : '#16171e',
                  border: 'none',
                  borderRadius: '8px', padding: '3px', gap: '2px',
                }}>
                  {['Light', 'Dark'].map(t => (
                    <button
                      key={t}
                      type="button"
                      disabled={isCrawling}
                      onClick={() => handleChange('theme', t)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none',
                        background: formData.theme === t ? '#7c3aed' : 'transparent',
                        color: formData.theme === t ? '#fff' : (isLight ? '#475569' : 'rgba(255,255,255,0.45)'),
                        cursor: isCrawling ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title={t + ' Theme'}
                    >
                      {t === 'Light' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent role */}
              <div>
                <FieldLabel isLight={isLight}>Agent role</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <select
                    disabled={isCrawling}
                    value={formData.role}
                    onChange={e => handleChange('role', e.target.value)}
                    style={{ ...inputStyle(isCrawling, isLight), appearance: 'none', paddingRight: '2.5rem', cursor: isCrawling ? 'not-allowed' : 'pointer' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={e => e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.09)'}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value} style={{ background: isLight ? '#ffffff' : '#16171e', color: isLight ? '#0f172a' : '#ffffff' }}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} color={isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <p style={{ fontSize: '0.76rem', color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  {currentRole.desc}<br />
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                    Role-specific guidance is added automatically. You can still edit the full instructions later in the workflow.
                  </span>
                </p>
              </div>

            </div>

            {/* RIGHT — widget preview */}
            <div style={{
              padding: '1.25rem 1.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.85rem',
              background: isLight ? '#f8fafc' : 'transparent',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={isCrawling}
                  onClick={() => setIsCustomizeOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: isLight ? '#ffffff' : 'transparent',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)',
                    color: isLight ? '#0f172a' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem', fontWeight: 600,
                    padding: '0.4rem 0.85rem', borderRadius: '7px',
                    cursor: isCrawling ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                    opacity: isCrawling ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isLight ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isCrawling) { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = isLight ? '#0f172a' : 'rgba(255,255,255,0.7)'; }}
                >
                  <Settings2 size={13} />
                  Customize widget
                </button>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isCrawling ? 0.5 : 1, transition: 'opacity 0.3s ease', overflow: 'hidden' }}>
                <LiveWidgetPreview brandData={formData} />
              </div>
            </div>

          </div>

          {/* FIXED Footer */}
          <div style={{
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: isLight ? '#ffffff' : '#121319',
          }}>
            <span style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)' }}>
              Step 2 of 4
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onBack}
                disabled={isCrawling}
                style={{
                  background: 'transparent',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                  color: isLight ? '#0f172a' : '#fff',
                  padding: '0.55rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem', fontWeight: 600,
                  cursor: isCrawling ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { if (!isCrawling) e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isCrawling}
                style={{
                  background: (isFormValid && !isCrawling) ? '#7c3aed' : (isLight ? '#e2e8f0' : 'rgba(124,58,237,0.3)'),
                  border: 'none',
                  color: (isFormValid && !isCrawling) ? '#fff' : (isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)'),
                  padding: '0.6rem 2.2rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem', fontWeight: 700,
                  cursor: (isFormValid && !isCrawling) ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s ease',
                  boxShadow: (isFormValid && !isCrawling) ? '0 4px 18px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                Continue
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
