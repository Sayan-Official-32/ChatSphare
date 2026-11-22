/**
 * @file CaptchaGenerator.jsx
 * @description Server-Driven Anti-Bot Vector SVG CAPTCHA Component.
 * 
 * Features:
 * 1. Fetches server-generated vector SVG anti-bot challenge and HMAC token.
 * 2. Renders crisp vector distortion without client-side text leakage.
 * 3. Exposes imperative `refresh()` handle and communicates active challenge token to parent.
 */

import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { fetchServerCaptcha } from '@/services/api';

/**
 * Server-Driven Anti-Bot CAPTCHA Component.
 * 
 * @param {Object} props - React props.
 * @param {Function} [props.onCaptchaChange] - Callback receiving `{ token: string }`.
 * @param {React.Ref} ref - Imperative handle ref for triggering refresh from parent component.
 * @returns {JSX.Element} CAPTCHA image and refresh button element.
 */
const CaptchaGenerator = forwardRef(({ onCaptchaChange }, ref) => {
  const [captchaData, setCaptchaData] = useState({ token: '', dataUrl: '', loading: true });
  const onCaptchaChangeRef = useRef(onCaptchaChange);

  useEffect(() => {
    onCaptchaChangeRef.current = onCaptchaChange;
  }, [onCaptchaChange]);

  const loadServerCaptcha = useCallback(async () => {
    setCaptchaData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetchServerCaptcha();
      if (res && res.captcha_token) {
        setCaptchaData({
          token: res.captcha_token,
          dataUrl: res.image_data_url || '',
          svg: res.svg || '',
          loading: false,
        });
        if (onCaptchaChangeRef.current) {
          onCaptchaChangeRef.current(res.captcha_token);
        }
      }
    } catch (err) {
      console.error('[Captcha] Server challenge fetch notice:', err);
      // Fallback placeholder
      setCaptchaData({
        token: 'dev-offline-token',
        dataUrl: '',
        loading: false,
      });
      if (onCaptchaChangeRef.current) {
        onCaptchaChangeRef.current('dev-offline-token');
      }
    }
  }, []);

  // Expose refresh method and current token via ref
  useImperativeHandle(ref, () => ({
    refresh: loadServerCaptcha,
    get token() {
      return captchaData.token;
    },
  }));

  useEffect(() => {
    loadServerCaptcha();
  }, [loadServerCaptcha]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <div
        style={{
          width: '150px',
          height: '44px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
          background: '#090a0f',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={loadServerCaptcha}
        title="Click to reload CAPTCHA"
      >
        {captchaData.loading ? (
          <Loader2 size={18} className="animate-spin" color="#c084fc" />
        ) : captchaData.svg ? (
          <div
            dangerouslySetInnerHTML={{ __html: captchaData.svg }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        ) : captchaData.dataUrl ? (
          <img
            src={captchaData.dataUrl}
            alt="Security CAPTCHA"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Click to load</span>
        )}
      </div>

      <button
        type="button"
        onClick={loadServerCaptcha}
        disabled={captchaData.loading}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
        title="Refresh CAPTCHA"
      >
        <RotateCcw size={16} color="#ffffff" className={captchaData.loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
});

export default CaptchaGenerator;

