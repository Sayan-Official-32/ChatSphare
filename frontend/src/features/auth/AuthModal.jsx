/**
 * @file AuthModal.jsx
 * @description Modal Dialog for Firebase & BFF User Sign-In and Registration.
 * 
 * Features:
 * 1. Dual Sign-In / Sign-Up tabbed workflow with password strength gauge.
 * 2. Username or Email account discovery using Supabase database queries.
 * 3. Integrated Google OAuth single sign-on via Firebase.
 * 4. Custom canvas Anti-OCR CAPTCHA verification for registration.
 * 5. Automatic HttpOnly BFF session cookie creation on successful authentication.
 */

import React, { useState, useRef } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getCleanAuthErrorMessage,
} from '@/lib/firebaseClient';
import {
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
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import chatSphareLogo from '@/assets/chatsphare_logo.png';

/**
 * Authentication Modal Dialog component.
 * 
 * @param {Object} props - React props.
 * @param {boolean} props.isOpen - Controls modal visibility state.
 * @param {Function} props.onClose - Modal close handler function.
 * @param {Function} props.onAuthSuccess - Callback function invoked upon successful authentication with user profile object.
 * @returns {JSX.Element|null} Modal overlay JSX element or null if closed.
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

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

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestionNotice, setSuggestionNotice] = useState(null);

  const captchaRef = useRef(null);

  if (!isOpen) return null;

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(signUpPassword);

  /**
   * Handles email or username single-form sign in.
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

      // If input does NOT contain '@', treat as Username and look up on server
      if (!rawInput.includes('@')) {
        const lookup = await lookupEmailByUsername(rawInput);
        if (!lookup || !lookup.found || !lookup.email) {
          setSuggestionNotice(lookup?.message || `No account found for username "${rawInput}".`);
          setLoading(false);
          return;
        }
        targetEmail = lookup.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
      if (userCredential.user) {
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, userCredential.user);
        onAuthSuccess(userCredential.user);
      }
    } catch (err) {
      setError(getCleanAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user registration with username & email uniqueness checks and CAPTCHA validation.
   * 
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanUsername = signUpUsername.trim();

    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const cleanCaptcha = captchaInput.trim().toUpperCase();
    if (!cleanCaptcha) {
      setError('Please enter the CAPTCHA text.');
      return;
    }

    setLoading(true);
    try {
      // Validate Server CAPTCHA token
      const activeCaptchaToken = currentCaptcha || (captchaRef.current && captchaRef.current.token);
      if (activeCaptchaToken && activeCaptchaToken !== 'dev-offline-token') {
        try {
          await verifyServerCaptcha(activeCaptchaToken, cleanCaptcha);
        } catch (captchaErr) {
          setError(captchaErr.message || 'Incorrect or expired CAPTCHA.');
          setLoading(false);
          if (captchaRef.current) captchaRef.current.refresh();
          setCaptchaInput('');
          return;
        }
      }

      // Check Username & Email Availability on Server
      const avail = await checkAccountAvailability({ username: cleanUsername, email: cleanEmail });
      if (!avail.username_available) {
        setError(avail.username_message || `Username "${cleanUsername}" is already taken.`);
        setLoading(false);
        if (captchaRef.current) captchaRef.current.refresh();
        setCaptchaInput('');
        return;
      }
      if (!avail.email_available) {
        setError(avail.email_message || `An account with email "${cleanEmail}" already exists.`);
        setLoading(false);
        if (captchaRef.current) captchaRef.current.refresh();
        setCaptchaInput('');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, signUpPassword);
      const user = userCredential.user;
      if (user) {
        if (cleanUsername) {
          await updateProfile(user, { displayName: cleanUsername });
        }
        const idToken = await user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, { ...user, displayName: cleanUsername });
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(getCleanAuthErrorMessage(err));
      if (captchaRef.current) captchaRef.current.refresh();
      setCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Executes Google OAuth popup login.
   */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const idToken = await result.user.getIdToken();
        localStorage.setItem('chatsphare_token', idToken);
        await createBFFSession(idToken, result.user);
        onAuthSuccess(result.user);
      }
    } catch (err) {
      setError(getCleanAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  /** Switches form from Sign-In to Sign-Up and copies entered email/username */
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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(8, 11, 18, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: 'rgba(18, 22, 34, 0.95)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '24px',
        padding: '2rem 1.75rem',
        width: '100%',
        maxWidth: '430px',
        color: '#fff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        position: 'relative',
        boxSizing: 'border-box',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: 'rgba(255,255,255,0.5)', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src={chatSphareLogo} alt="ChatSphare" style={{ height: '38px', width: 'auto', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
            {isLogin ? 'Sign In to ChatSphare' : 'Create an Account'}
          </h2>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px',
          padding: '3px', marginBottom: '1.1rem',
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1, padding: '0.45rem', borderRadius: '9px', border: 'none',
              background: isLogin ? '#7c3aed' : 'transparent',
              color: isLogin ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1, padding: '0.45rem', borderRadius: '9px', border: 'none',
              background: !isLogin ? '#7c3aed' : 'transparent',
              color: !isLogin ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
            color: '#f87171', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem',
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {suggestionNotice && (
          <div style={{
            background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.35)',
            borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#e9d5ff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', fontWeight: 600 }}>
              <Sparkles size={14} color="#c084fc" />
              <span>{suggestionNotice}</span>
            </div>
            <button
              type="button"
              onClick={switchToSignUp}
              style={{
                background: '#7c3aed', color: '#fff', border: 'none', padding: '0.3rem 0.75rem',
                borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Sign Up Now →
            </button>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', padding: '0.65rem', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer', marginBottom: '1rem',
          }}
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" color="#c084fc" /> : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Sign In / Sign Up Forms */}
        {isLogin ? (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="Username or Email"
                  value={loginInput}
                  onChange={e => { setLoginInput(e.target.value); setError(null); }}
                  style={{
                    width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.2rem', borderRadius: '10px',
                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 2.2rem 0.65rem 2.2rem', borderRadius: '10px',
                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !loginInput.trim() || !loginPassword}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                background: (loginInput.trim() && loginPassword) ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                color: (loginInput.trim() && loginPassword) ? '#fff' : 'rgba(255,255,255,0.3)',
                border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" color="#fff" style={{ margin: '0 auto' }} /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>Email</label>
              <input type="email" required placeholder="yourname@gmail.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '9px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>Username</label>
              <input type="text" required placeholder="john_doe" value={signUpUsername} onChange={e => setSignUpUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '9px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>Password</label>
              <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '9px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }} />
              {signUpPassword && (
                <div style={{ fontSize: '0.7rem', color: passwordStrength.color, marginTop: '2px', fontWeight: 700 }}>
                  Strength: {passwordStrength.label}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>Re-enter Password</label>
              <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '9px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>CAPTCHA</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CaptchaGenerator ref={captchaRef} onCaptchaChange={setCurrentCaptcha} />
                <input type="text" required placeholder="5 chars" maxLength={5} value={captchaInput} onChange={e => setCaptchaInput(e.target.value.toUpperCase().replace(/\s+/g, ''))} style={{ flex: 1, padding: '0.55rem', borderRadius: '9px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.85rem', textAlign: 'center', textTransform: 'uppercase' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', marginTop: '0.3rem', borderRadius: '10px', background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
