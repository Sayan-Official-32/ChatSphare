/**
 * @file Step1Start.jsx
 * @description Wizard Step 1: Mode Selection (Auto-Crawl URL vs Manual Setup).
 * 
 * Features:
 * 1. Dual mode card selectors ('Use my website' vs 'I'll set it up myself').
 * 2. Instant client-side URL validation & scheme normalizer.
 * 3. Triggers automated web scraper pipeline on continue.
 */

import React, { useState, useEffect } from 'react';
import { Globe, Pencil, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Step 1 Mode Selection component.
 * 
 * @param {Object} props - React props.
 * @param {string} props.initialUrl - Pre-filled target website URL.
 * @param {Object} props.crawlerData - Previously extracted crawler data object.
 * @param {boolean} props.isCrawling - Crawl loading state flag.
 * @param {string} [props.theme='dark'] - Color theme mode ('light'|'dark').
 * @param {Function} props.onRunCrawl - Callback to launch web scraper `(url, skipToStep2)`.
 * @param {Function} props.onUrlChanged - Callback fired when URL input changes.
 * @param {Function} props.onProceedNext - Forward navigation handler.
 * @param {Function} props.onSelectManual - Manual setup selection handler.
 * @returns {JSX.Element} Step 1 UI element.
 */
export default function Step1Start({
  initialUrl,
  crawlerData,
  isCrawling,
  crawlError,
  theme = 'dark',
  onRunCrawl,
  onUrlChanged,
  onProceedNext,
  onSelectManual,
}) {
  const isLight = theme === 'light';
  // 'website' | 'manual' | null
  const [selected, setSelected] = useState(null);
  const [urlInput, setUrlInput] = useState(initialUrl || '');
  const [urlError, setUrlError] = useState('');
  const [lastCrawledUrl, setLastCrawledUrl] = useState(initialUrl || '');

  useEffect(() => {
    if (initialUrl) {
      setSelected('website');
      setUrlInput(initialUrl);
      setLastCrawledUrl(initialUrl);
    }
  }, [initialUrl]);

  /**
   * Validates target URL structure and host domain syntax.
   * 
   * @param {string} value - Raw URL input.
   * @returns {{ isValid: boolean, normalised: string }} Validation result object.
   */
  const validateUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return { isValid: true, normalised: '' };

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(withProtocol);
      const host = parsed.hostname.replace(/^www\./i, '');
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(host)) {
        return { isValid: false, normalised: withProtocol };
      }
      return { isValid: true, normalised: withProtocol };
    } catch {
      return { isValid: false, normalised: withProtocol };
    }
  };

  const [isStep1Loading, setIsStep1Loading] = useState(false);

  /**
   * Validates input and triggers crawl or navigation.
   */
  const handleContinue = () => {
    if (selected === 'manual') {
      onSelectManual();
      return;
    }

    if (selected === 'website') {
      const trimmed = urlInput.trim();

      const urlUnchanged = trimmed === lastCrawledUrl;
      if (crawlerData && urlUnchanged && !crawlError) {
        onProceedNext();
        return;
      }

      if (!trimmed) {
        setUrlError('Please enter your website URL to continue.');
        return;
      }

      const { isValid, normalised } = validateUrl(trimmed);
      if (!isValid) {
        setUrlError('Please enter a valid website URL (e.g. https://www.example.com).');
        return;
      }

      setUrlError('');
      setLastCrawledUrl(normalised);

      onRunCrawl(normalised, true);
      return;
    }
  };

  const isUrlValid = selected === 'website' ? validateUrl(urlInput).isValid : true;
  const canContinue = selected !== null && !isCrawling && !isStep1Loading && isUrlValid;
  const activeError = urlError || crawlError;

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      padding: '0 1.5rem 3rem',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
    }}>
      {/* Main Card Container */}
      <div style={{
        background: isLight ? '#ffffff' : '#121319',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2.5rem 2.5rem 1.75rem',
        boxShadow: isLight ? '0 10px 30px rgba(0, 0, 0, 0.04)' : '0 20px 50px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease',
      }}>
        {/* Section Heading */}
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: isLight ? '#0f172a' : '#ffffff',
          marginBottom: '0.4rem',
        }}>
          How would you like to begin?
        </h2>
        <p style={{
          fontSize: '0.86rem',
          color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.45)',
          marginBottom: '2rem',
          lineHeight: 1.5,
        }}>
          We can pull your logo, colors, and text from your website—or you can enter everything yourself. No wrong choice.
        </p>

        {/* Option Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}>
          {/* Card 1 — Use my website */}
          <div
            onClick={() => { setSelected('website'); setUrlError(''); }}
            style={{
              textAlign: 'left',
              padding: '1.5rem',
              borderRadius: '14px',
              border: selected === 'website'
                ? '1.5px solid #7c3aed'
                : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
              background: selected === 'website'
                ? (isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.06)')
                : (isLight ? '#f8fafc' : '#181920'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selected === 'website'
                ? '0 0 20px rgba(124, 58, 237, 0.15)'
                : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: selected === 'website'
                  ? 'rgba(124, 58, 237, 0.2)'
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Globe
                  size={18}
                  color={selected === 'website' ? '#7c3aed' : (isLight ? '#64748b' : 'rgba(255,255,255,0.45)')}
                />
              </div>
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: isLight ? '#0f172a' : '#ffffff',
              }}>
                Use my website
              </span>
            </div>
            <p style={{
              fontSize: '0.84rem',
              color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.4)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              We'll read your site once to suggest brand details and pages for your knowledge base.
            </p>
          </div>

          {/* Card 2 — I'll set it up myself */}
          <div
            onClick={() => { setSelected('manual'); setUrlError(''); }}
            style={{
              textAlign: 'left',
              padding: '1.5rem',
              borderRadius: '14px',
              border: selected === 'manual'
                ? '1.5px solid #7c3aed'
                : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
              background: selected === 'manual'
                ? (isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.06)')
                : (isLight ? '#f8fafc' : '#181920'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selected === 'manual'
                ? '0 0 20px rgba(124, 58, 237, 0.15)'
                : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: selected === 'manual'
                  ? 'rgba(124, 58, 237, 0.2)'
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Pencil
                  size={17}
                  color={selected === 'manual' ? '#7c3aed' : (isLight ? '#64748b' : 'rgba(255,255,255,0.45)')}
                />
              </div>
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: isLight ? '#0f172a' : '#ffffff',
              }}>
                I'll set it up myself
              </span>
            </div>
            <p style={{
              fontSize: '0.84rem',
              color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.4)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              Skip the automatic scan—you'll fill in brand and content in the next steps.
            </p>
          </div>
        </div>

        {/* Website Address Section */}
        {selected === 'website' && (
          <div style={{ marginTop: '1.75rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: isLight ? '#0f172a' : '#ffffff',
              marginBottom: '0.6rem',
            }}>
              Website address
            </label>

            {/* Input box */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: isLight ? '#ffffff' : '#16171e',
                border: `1px solid ${activeError ? 'rgba(248,113,113,0.7)' : '#7c3aed'}`,
                borderRadius: activeError ? '14px 14px 0 0' : '9999px',
                padding: '0.4rem 1.5rem',
                boxShadow: activeError ? '0 0 20px rgba(248,113,113,0.25)' : '0 0 18px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s ease',
              }}>
                <input
                  type="text"
                  autoFocus
                  value={urlInput}
                  onChange={e => {
                    const val = e.target.value;
                    setUrlInput(val);
                    if (val.trim() !== lastCrawledUrl) {
                      onUrlChanged?.();
                    }
                    if (urlError) setUrlError('');
                  }}
                  onBlur={() => {
                    if (urlInput.trim()) {
                      const { isValid } = validateUrl(urlInput);
                      if (!isValid) setUrlError('Please enter a valid website URL (e.g. https://www.example.com)');
                    }
                  }}
                  placeholder="https://www.example.com"
                  onKeyDown={e => e.key === 'Enter' && handleContinue()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '0.95rem',
                    padding: '0.55rem 0',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                {crawlerData && !isCrawling && !activeError && (
                  <CheckCircle2 size={18} color="#10b981" />
                )}
              </div>

              {/* Interactive Validation / Crawl Error Alert */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: activeError ? '80px' : '0',
                  opacity: activeError ? 1 : 0,
                  transition: 'max-height 0.25s ease, opacity 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(248,113,113,0.09)',
                    border: '1px solid rgba(248,113,113,0.4)',
                    borderTop: 'none',
                    borderRadius: '0 0 14px 14px',
                    padding: '0.6rem 1.25rem',
                  }}
                >
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#f87171', fontSize: '0.84rem', fontWeight: 500, lineHeight: 1.4 }}>
                    {activeError}
                  </span>
                </div>
              </div>
            </div>

            {/* Helper Text */}
            <p style={{
              fontSize: '0.78rem',
              color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem',
              marginBottom: 0,
            }}>
              Paste your homepage link—we'll verify and normalize it for you.
            </p>
          </div>
        )}

        {/* Card Footer */}
        <div style={{
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          marginTop: '2.5rem',
          paddingTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.35)' }}>
            Step 1 of 4
          </span>

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            style={{
              background: canContinue
                ? '#7c3aed'
                : (isLight ? '#e2e8f0' : 'rgba(124, 58, 237, 0.3)'),
              color: canContinue ? '#ffffff' : (isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.35)'),
              border: 'none',
              borderRadius: '9999px',
              padding: '0.65rem 2.5rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: canContinue ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: canContinue ? '0 4px 20px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            {isCrawling || isStep1Loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Starting crawl…
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
