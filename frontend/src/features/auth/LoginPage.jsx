/**
 * @file LoginPage.jsx
 * @description Authentication & User Registration Page Component.
 * 
 * Features:
 * 1. Dual Sign-In / Sign-Up tab switching modes.
 * 2. Multi-identifier Sign-In (accepts either Username or Email address).
 * 3. Automatic browser session recognition via Node.js BFF HttpOnly cookie checks (`/api/auth/me`).
 * 4. Password strength meter and real-time validation checks.
 * 5. Integrated canvas CAPTCHA generator verification for sign-up security.
 * 6. One-click Google OAuth authentication flow.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  getCleanAuthErrorMessage,
} from '@/lib/firebaseClient';
import {
  fetchAuthMe,
  createBFFSession,
  lookupEmailByUsername,
  checkAccountAvailability,
  verifyServerCaptcha,
} from '@/services/api';
import { updateProfile } from 'firebase/auth';
import CaptchaGenerator from '@/components/common/CaptchaGenerator';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import chatSphareLogo from '@/assets/chatsphare_logo.png';

/**
 * Authentication Page Component.
 * 
 * @returns {JSX.Element} Login & registration page JSX element.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSignUpInitial = location.pathname === '/signup';
  const [isLogin, setIsLogin] = useState(!isSignUpInitial);

  // Sign-In States
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign-Up States
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptcha, setCurrentCaptcha] = useState('');

  // Common UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestionNotice, setSuggestionNotice] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const captchaRef = useRef(null);
  const [autoSessionInfo, setAutoSessionInfo] = useState(null);

  // Auto-redirect if authenticated via Node.js BFF HttpOnly cookie session
  useEffect(() => {
    let isMounted = true;

    // Check Node.js BFF session endpoint (/api/auth/me)
    fetchAuthMe()
      .then((res) => {
        if (isMounted && res.authenticated && res.user) {
          setAutoSessionInfo({
            isSameBrowserSaved: true,
            email: res.user.email,
            name: res.user.displayName || res.user.email?.split('@')[0],
          });
          setTimeout(() => {
            if (isMounted) navigate('/app/brand-agent/new');
          }, 300);
        }
      })
      .catch(() => {
        /* Not logged in via BFF cookie yet */
      });

    // Listen to Firebase auth state fallback
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && isMounted) {
        try {
          const idToken = await user.getIdToken();
          await createBFFSession(idToken, user);
        } catch (e) {
          /* ignore */
        }
        setAutoSessionInfo({
          isSameBrowserSaved: true,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
        });
        setTimeout(() => {
          if (isMounted) navigate('/app/brand-agent/new');
        }, 300);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  /**
   * Calculates password complexity score and color styling.
   * 
   * @param {string} pass - Candidate password string.
   * @returns {{ score: number, label: string, color: string }} Strength assessment.
   */
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#cbd5e1' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: '#f87171' };
    if (score <= 4) return { score: 66, label: 'Medium', color: '#fbbf24' };
    return { score: 100, label: 'Strong', color: '#34d399' };
  };

  const passwordStrength = calculatePasswordStrength(signUpPassword);

  /**
   * Submits sign-in credentials (resolving username to email if necessary).
   * 
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    const rawInput = loginInput.trim();
    if (!rawInput || !loginPassword) return;

    setLoading(true);
    setError(null);
    setSuggestionNotice(null);

    try {
      let targetEmail = rawInput.toLowerCase();

      // If input does NOT contain '@', treat as Username and look up securely via server API
      if (!rawInput.includes('@')) {
        const lookup = await lookupEmailByUsername(rawInput);
        if (!lookup || !lookup.found || !lookup.email) {
          setSuggestionNotice(lookup?.message || `No account found with username "${rawInput}".`);
          setLoading(false);
          return;
        }
        targetEmail = lookup.email;
      }

      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
      if (userCredential.user) {
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, userCredential.user);
        navigate('/app/brand-agent/new');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setSuggestionNotice('No account found with this email. Would you like to Sign Up first?');
      }
      setError(getCleanAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits registration form after checking username/email uniqueness and CAPTCHA validation.
   * 
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanUsername = signUpUsername.trim();

    // 1. Validate Password Match
    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your passwords.');
      return;
    }

    // 2. Validate Password Length
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 3. Validate Server-Side CAPTCHA
    const cleanCaptcha = captchaInput.trim().toUpperCase();
    if (!cleanCaptcha) {
      setError('Please enter the CAPTCHA characters.');
      return;
    }

    setLoading(true);

    try {
      // Cryptographically verify server CAPTCHA token
      const activeCaptchaToken = currentCaptcha || (captchaRef.current && captchaRef.current.token);
      if (activeCaptchaToken && activeCaptchaToken !== 'dev-offline-token') {
        try {
          await verifyServerCaptcha(activeCaptchaToken, cleanCaptcha);
        } catch (captchaErr) {
          setError(captchaErr.message || 'Incorrect or expired CAPTCHA. Please try again.');
          setLoading(false);
          if (captchaRef.current) captchaRef.current.refresh();
          setCaptchaInput('');
          return;
        }
      }

      // 4 & 5. Check Username and Email Uniqueness via Server API
      const avail = await checkAccountAvailability({ username: cleanUsername, email: cleanEmail });
      if (!avail.username_available) {
        setError(avail.username_message || `Username "${cleanUsername}" is already taken. Please choose another username.`);
        setLoading(false);
        if (captchaRef.current) captchaRef.current.refresh();
        setCaptchaInput('');
        return;
      }
      if (!avail.email_available) {
        setError(avail.email_message || `An account with email "${cleanEmail}" already exists. Please Sign In.`);
        setLoading(false);
        if (captchaRef.current) captchaRef.current.refresh();
        setCaptchaInput('');
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, signUpPassword);
      const user = userCredential.user;

      if (user) {
        if (cleanUsername) {
          await updateProfile(user, { displayName: cleanUsername });
        }
        const idToken = await user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, { ...user, displayName: cleanUsername });

        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          navigate('/app/brand-agent/new');
        }, 800);
      }
    } catch (err) {
      setError(getCleanAuthErrorMessage(err));
      if (captchaRef.current) captchaRef.current.refresh();
      setCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  /** Initiates Google OAuth popup sign-in */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const idToken = await result.user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, result.user);
        navigate('/app/brand-agent/new');
      }
    } catch (err) {
      setError(getCleanAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  /** Switches view to Sign-Up tab pre-filling typed username or email */
  const switchToSignUp = () => {
    setIsLogin(false);
    setError(null);
    setSuggestionNotice(null);
    if (loginInput.includes('@')) {
      setSignUpEmail(loginInput);
    } else {
      setSignUpUsername(loginInput);
    }
  };

  return (
    <div className="landing-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
    }}>
      {/* Ambient Glow Background Effect */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)',
        pointerEvents: 'none',
        filter: 'blur(70px)',
      }} />

      {/* Main Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(18, 22, 34, 0.85)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 58, 237, 0.15)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
      }}>
        
        {autoSessionInfo && (
          <div style={{
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#e2e8f0',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              ✓ Recognized Saved Browser Session
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
              Welcome back, {autoSessionInfo.name || 'User'}!
            </div>
            {autoSessionInfo.email && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {autoSessionInfo.email}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Auto-logging in without password...
            </div>
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src={chatSphareLogo}
            alt="ChatSphare Logo"
            onClick={() => navigate('/')}
            style={{
              height: '46px',
              width: 'auto',
              cursor: 'pointer',
              filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.5))',
              marginBottom: '0.85rem',
            }}
          />
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {isLogin ? 'Welcome back to ChatSphare' : 'Create your ChatSphare Account'}
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.55)',
            margin: '0.35rem 0 0 0',
          }}>
            {isLogin
              ? 'Sign in with your Username or Email address'
              : 'Deploy your AI Brand Agent in under 2 minutes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '3px',
          marginBottom: '1.4rem',
          gap: '2px',
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setSuggestionNotice(null); }}
            style={{
              flex: 1, padding: '0.55rem', borderRadius: '9px', border: 'none',
              background: isLogin ? '#7c3aed' : 'transparent',
              color: isLogin ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setSuggestionNotice(null); }}
            style={{
              flex: 1, padding: '0.55rem', borderRadius: '9px', border: 'none',
              background: !isLogin ? '#7c3aed' : 'transparent',
              color: !isLogin ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
            background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.35)',
            color: '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.2rem',
            fontSize: '0.83rem', lineHeight: 1.45,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestion Notice */}
        {suggestionNotice && (
          <div style={{
            background: 'rgba(192, 132, 252, 0.1)',
            border: '1px solid rgba(192, 132, 252, 0.35)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.2rem',
            fontSize: '0.83rem',
            color: '#e9d5ff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600 }}>
              <Sparkles size={15} color="#c084fc" />
              <span>{suggestionNotice}</span>
            </div>
            <button
              type="button"
              onClick={switchToSignUp}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: '#7c3aed', color: '#fff', border: 'none',
                padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', marginTop: '0.2rem',
              }}
            >
              Sign Up Now <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
            background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.35)',
            color: '#34d399', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.2rem',
            fontSize: '0.83rem', lineHeight: 1.45,
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
            background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff', padding: '0.7rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)', marginBottom: '1.25rem',
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" color="#c084fc" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', margin: '1.2rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* 1. SIGN IN FORM */}
        {isLogin ? (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Username or Email Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.45rem' }}>
                Username or Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. john_doe or john@example.com"
                  value={loginInput}
                  onChange={e => { setLoginInput(e.target.value); setError(null); setSuggestionNotice(null); }}
                  style={{
                    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.4rem', borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.45rem' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 2.4rem 0.75rem 2.4rem', borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', background: 'transparent',
                    border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In Submit Button */}
            <button
              type="submit"
              disabled={loading || !loginInput.trim() || !loginPassword}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                background: (loginInput.trim() && loginPassword) ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' : 'rgba(255,255,255,0.08)',
                color: (loginInput.trim() && loginPassword) ? '#ffffff' : 'rgba(255,255,255,0.3)',
                padding: '0.8rem', borderRadius: '12px', border: 'none', fontSize: '0.92rem', fontWeight: 700,
                cursor: (loading || !loginInput.trim() || !loginPassword) ? 'not-allowed' : 'pointer',
                boxShadow: (loginInput.trim() && loginPassword) ? '0 4px 20px rgba(124, 58, 237, 0.4)' : 'none',
                transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)', marginTop: '0.3rem',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" color="#ffffff" /> : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. SIGN UP FORM */
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.3rem', borderRadius: '11px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.35rem' }}>
                Username
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. john_doe"
                  value={signUpUsername}
                  onChange={e => setSignUpUsername(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.3rem', borderRadius: '11px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={e => setSignUpPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 2.3rem 0.7rem 2.3rem', borderRadius: '11px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', background: 'transparent',
                    border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {signUpPassword && (
                <div style={{ marginTop: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Strength:</span>
                    <span style={{ fontWeight: 700, color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                  <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${passwordStrength.score}%`, background: passwordStrength.color, transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Re-enter Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.35rem' }}>
                Re-enter Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 2.3rem 0.7rem 2.3rem', borderRadius: '11px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: confirmPassword
                      ? (confirmPassword === signUpPassword ? '1px solid #34d399' : '1px solid #f87171')
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {/* Match status */}
              {confirmPassword && (
                <div style={{ fontSize: '0.72rem', marginTop: '3px', fontWeight: 600, color: confirmPassword === signUpPassword ? '#34d399' : '#f87171' }}>
                  {confirmPassword === signUpPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </div>
              )}
            </div>

            {/* CAPTCHA Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.45rem' }}>
                Verification CAPTCHA
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CaptchaGenerator ref={captchaRef} onCaptchaChange={setCurrentCaptcha} />
                <input
                  type="text"
                  required
                  placeholder="Enter 5 characters"
                  maxLength={5}
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  style={{
                    flex: 1, padding: '0.65rem 0.75rem', borderRadius: '11px',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 700,
                    textTransform: 'uppercase', outline: 'none', boxSizing: 'border-box', textAlign: 'center',
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', color: '#ffffff',
                padding: '0.8rem', borderRadius: '12px', border: 'none', fontSize: '0.92rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)', marginTop: '0.4rem',
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" color="#ffffff" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div style={{
          marginTop: '1.5rem', paddingTop: '1.1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
            {isLogin ? "Don't have an account yet?" : "Already registered with ChatSphare?"}{' '}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuggestionNotice(null);
              }}
              style={{ color: '#c084fc', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isLogin ? 'Sign up free' : 'Sign in'}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}
