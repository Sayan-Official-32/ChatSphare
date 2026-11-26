/**
 * @file ProfilePage.jsx
 * @description Enterprise User Profile & Account Settings View for ChatSphare (/app/profile).
 * Faithfully reproduces the reference UI (media_1789370497535.png):
 * 1. Page Header ("Profile" / "Manage your personal account and preferences").
 * 2. Card 1: "Account Information"
 *    - Avatar photo preview with display name and "PNG, JPEG, or WebP up to 2 MB." spec.
 *    - "Remove" and "Change photo" buttons with direct file upload and validation.
 *    - Name field with inline user icon and purple "Save" button connected to database.
 *    - Email field with mail icon (read-only, muted style).
 *    - User ID field with user icon, copy-to-clipboard button, and explanatory footnote.
 *    - User Preferences section with "Edit Preferences" button and preferences modal.
 * 3. Card 2: "Teamspace API Keys"
 *    - Key icon, title, description, and "Manage API keys →" button with API keys manager modal.
 * 4. Full dark & light mode integration via useTheme(), synchronized with Left Sidebar.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Copy,
  Check,
  Camera,
  Settings,
  Key,
  ArrowRight,
  Loader2,
  X,
  Trash2,
  Plus,
  Shield,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import {
  fetchUserProfile,
  updateUserProfile,
  removeUserPhoto,
  fetchTeamspaceApiKeys,
  createTeamspaceApiKey,
  revokeTeamspaceApiKey,
} from '@/services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Profile Form States
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Photo Upload States
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Copy Feedback
  const [isCopied, setIsCopied] = useState(false);

  // Modals
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  // Preferences State
  const [prefs, setPrefs] = useState({
    theme: 'system',
    email_notifications: true,
    agent_response_tone: 'Professional',
    default_workspace: 'Personal Space',
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetchUserProfile();
        if (isMounted && res) {
          setProfileData(res);
          setNameInput(res.display_name || user?.displayName || '');
          if (res.preferences) {
            setPrefs(prev => ({ ...prev, ...res.preferences }));
          }
        }
      } catch (err) {
        // Fallback to AuthContext user
        if (isMounted) {
          const fallbackName = user?.displayName || user?.display_name || (user?.email ? user.email.split('@')[0] : 'User');
          setNameInput(fallbackName);
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  // Handle Save Name
  const handleSaveName = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName || cleanName === (profileData?.display_name || user?.displayName)) {
      return;
    }

    setIsSavingName(true);
    try {
      const res = await updateUserProfile({ display_name: cleanName });
      if (res) {
        setProfileData(res);
      }
      // Update global AuthContext user so Left Sidebar updates in real-time
      if (setUser && user) {
        setUser({
          ...user,
          displayName: cleanName,
          display_name: cleanName,
        });
      }
      setNameSavedSuccess(true);
      setTimeout(() => setNameSavedSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to update name.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Change Photo (File upload <= 2MB)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size exceeds 2 MB. Please select a smaller PNG, JPEG, or WebP file.');
      return;
    }

    // Validate mime type
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(file.type)) {
      alert('Unsupported format. Please upload a PNG, JPEG, or WebP image.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const res = await updateUserProfile({ photo_url: base64Data });
        if (res) {
          setProfileData(res);
        }
        // Update global AuthContext so sidebar immediately reflects the new picture
        if (setUser && user) {
          setUser({
            ...user,
            photoURL: base64Data,
            photo_url: base64Data,
          });
        }
      } catch (err) {
        alert(err.message || 'Failed to update avatar photo.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo
  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setIsUploadingPhoto(true);
    try {
      const res = await removeUserPhoto();
      if (res) {
        setProfileData(res);
      }
      // Clear global AuthContext photo
      if (setUser && user) {
        setUser({
          ...user,
          photoURL: null,
          photo_url: null,
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Copy User ID
  const handleCopyUserId = () => {
    const uid = profileData?.id || user?.uid || user?.id || '';
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Save Preferences
  const handleSavePreferences = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const res = await updateUserProfile({ preferences: prefs });
      if (res) {
        setProfileData(res);
      }
      setIsPrefsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save preferences.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Open API Keys modal & load keys
  const handleOpenApiKeysModal = async () => {
    setIsApiKeysModalOpen(true);
    setLoadingApiKeys(true);
    try {
      const data = await fetchTeamspaceApiKeys();
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setApiKeys([]);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  // Handle Create API Key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const created = await createTeamspaceApiKey(newKeyName.trim());
      setJustCreatedKey(created);
      setNewKeyName('');
      setApiKeys(prev => [created, ...prev]);
    } catch (err) {
      alert(err.message || 'Failed to create API key.');
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Handle Revoke API Key
  const handleRevokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will lose access.')) return;
    try {
      await revokeTeamspaceApiKey(keyId);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (err) {
      alert(err.message || 'Failed to revoke API key.');
    }
  };

  // Resolved dynamic values
  const displayName = profileData?.display_name || user?.displayName || user?.display_name || 'Coding Ai';
  const email = profileData?.email || user?.email || 'aicoder001@gmail.com';
  const userId = profileData?.id || user?.uid || user?.id || '54189468-1071-704d-cde4-35b891801ec7';
  const photoUrl = profileData?.photo_url || user?.photoURL || user?.photo_url || null;

  // Design Tokens
  const pageBg = isDark ? '#08090e' : '#f8fafc';
  const cardBg = isDark ? '#11121a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const innerCardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.65)' : '#64748b';
  const textMuted = isDark ? 'rgba(255,255,255,0.42)' : '#94a3b8';
  const inputBg = isDark ? '#161722' : '#f8fafc';
  const inputBorder = isDark ? 'rgba(255,255,255,0.11)' : '#e2e8f0';
  const inputDisabledBg = isDark ? '#14141d' : '#f8fafc';
  const purplePrimary = '#8b5cf6';
  const purpleHover = '#7c3aed';

  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      backgroundColor: pageBg,
      color: textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2.5rem 3rem',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* ── Page Header matching reference ── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: textPrimary,
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.02em',
          }}>
            Profile
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: textSecondary,
            margin: 0,
            fontWeight: 400,
          }}>
            Manage your personal account and preferences
          </p>
        </div>

        {/* ── CARD 1: Account Information matching reference ── */}
        <div style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '1.85rem',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.03)',
          marginBottom: '1.75rem',
        }}>

          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <User size={19} color={textPrimary} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: textPrimary }}>
              Account Information
            </h2>
          </div>

          {/* User Photo & Action Row Box matching reference */}
          <div style={{
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            backgroundColor: innerCardBg,
            padding: '1.1rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.6rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {/* Left: Avatar + Names */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Circular Avatar */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
                border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.35rem',
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {isUploadingPhoto && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Loader2 size={20} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: textPrimary }}>
                  {displayName}
                </h3>
                <p style={{ fontSize: '0.78rem', color: textMuted, margin: 0 }}>
                  PNG, JPEG, or WebP up to 2 MB.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : '#64748b'}
                >
                  Remove
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/jpg"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '9px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  color: textPrimary,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'}
              >
                <Camera size={15} />
                <span>Change photo</span>
              </button>
            </div>
          </div>

          {/* Form Fields Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>

            {/* Field: Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: textPrimary,
                marginBottom: '0.45rem',
              }}>
                Name
              </label>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <User
                    size={16}
                    color={textMuted}
                    style={{ position: 'absolute', left: '0.9rem', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Your Full Name"
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: inputBg,
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '8px',
                      padding: '0 0.85rem 0 2.5rem',
                      fontSize: '0.88rem',
                      color: textPrimary,
                      outline: 'none',
                      fontWeight: 500,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = purplePrimary}
                    onBlur={e => e.currentTarget.style.borderColor = inputBorder}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSavingName || !nameInput.trim()}
                  style={{
                    padding: '0 1.35rem',
                    height: '42px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: nameSavedSuccess ? '#10b981' : purplePrimary,
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: isSavingName ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!nameSavedSuccess) e.currentTarget.style.backgroundColor = purpleHover;
                  }}
                  onMouseLeave={e => {
                    if (!nameSavedSuccess) e.currentTarget.style.backgroundColor = purplePrimary;
                  }}
                >
                  {isSavingName ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : nameSavedSuccess ? (
                    <>
                      <Check size={16} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </div>

            {/* Field: Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: textPrimary,
                marginBottom: '0.45rem',
              }}>
                Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={16}
                  color={textMuted}
                  style={{ position: 'absolute', left: '0.9rem', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  readOnly
                  value={email}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: inputDisabledBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '8px',
                    padding: '0 0.85rem 0 2.5rem',
                    fontSize: '0.88rem',
                    color: textPrimary,
                    outline: 'none',
                    fontWeight: 500,
                    boxSizing: 'border-box',
                    cursor: 'default',
                  }}
                />
              </div>
            </div>

            {/* Field: User ID */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: textPrimary,
                marginBottom: '0.45rem',
              }}>
                User ID
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User
                  size={16}
                  color={textMuted}
                  style={{ position: 'absolute', left: '0.9rem', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  readOnly
                  value={userId}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: inputDisabledBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '8px',
                    padding: '0 2.8rem 0 2.5rem',
                    fontSize: '0.88rem',
                    color: textPrimary,
                    outline: 'none',
                    fontWeight: 500,
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    cursor: 'default',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  title="Copy User ID"
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    background: 'transparent',
                    border: 'none',
                    color: isCopied ? '#10b981' : textMuted,
                    cursor: 'pointer',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {isCopied ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>
              <p style={{ fontSize: '0.76rem', color: textMuted, margin: '0.4rem 0 0 0' }}>
                Your unique user identifier. This is used for some of the integrations.
              </p>
            </div>

            {/* Field: User Preferences */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: textPrimary,
                marginBottom: '0.45rem',
              }}>
                User Preferences
              </label>
              <button
                type="button"
                onClick={() => setIsPrefsModalOpen(true)}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: innerCardBg,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: textPrimary,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
                  e.currentTarget.style.borderColor = purplePrimary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = innerCardBg;
                  e.currentTarget.style.borderColor = inputBorder;
                }}
              >
                <Settings size={16} color={purplePrimary} />
                <span>Edit Preferences</span>
              </button>
              <p style={{ fontSize: '0.76rem', color: textMuted, margin: '0.4rem 0 0 0' }}>
                You can edit your preferences here, to help us improve your experience.
              </p>
            </div>

          </div>
        </div>

        {/* ── CARD 2: Teamspace API Keys matching reference ── */}
        <div style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '1.85rem',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Key size={19} color={textPrimary} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: textPrimary }}>
              Teamspace API Keys
            </h2>
          </div>

          <p style={{ fontSize: '0.84rem', color: textSecondary, margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
            Create scoped runtime keys for agents and admin keys for project management from your active teamspace.
          </p>

          <button
            type="button"
            onClick={handleOpenApiKeysModal}
            style={{
              width: '100%',
              height: '42px',
              backgroundColor: innerCardBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: textPrimary,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
              e.currentTarget.style.borderColor = purplePrimary;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = innerCardBg;
              e.currentTarget.style.borderColor = inputBorder;
            }}
          >
            <span>Manage API keys</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>

      {/* ── MODAL: User Preferences ── */}
      {isPrefsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setIsPrefsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Settings size={20} color={purplePrimary} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: textPrimary }}>
                User Preferences
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: textSecondary, margin: '0 0 1.5rem 0' }}>
              Customize your personal interface, notifications, and workflow defaults.
            </p>

            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Theme Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: textPrimary, marginBottom: '0.4rem' }}>
                  Interface Theme
                </label>
                <select
                  value={prefs.theme || 'system'}
                  onChange={e => {
                    const newTheme = e.target.value;
                    setPrefs(prev => ({ ...prev, theme: newTheme }));
                    if (newTheme === 'dark' || newTheme === 'light') {
                      if ((newTheme === 'dark') !== isDark) {
                        toggleTheme();
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: inputBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '8px',
                    padding: '0 0.75rem',
                    fontSize: '0.84rem',
                    color: textPrimary,
                    outline: 'none',
                  }}
                >
                  <option value="system">System Default</option>
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </div>

              {/* Agent Tone Default */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: textPrimary, marginBottom: '0.4rem' }}>
                  Default Agent Response Tone
                </label>
                <select
                  value={prefs.agent_response_tone || 'Professional'}
                  onChange={e => setPrefs(prev => ({ ...prev, agent_response_tone: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: inputBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '8px',
                    padding: '0 0.75rem',
                    fontSize: '0.84rem',
                    color: textPrimary,
                    outline: 'none',
                  }}
                >
                  <option value="Professional">Professional & Courteous</option>
                  <option value="Friendly">Friendly & Enthusiastic</option>
                  <option value="Concise">Concise & Direct</option>
                  <option value="Technical">Technical & Formal</option>
                </select>
              </div>

              {/* Email Notifications Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                backgroundColor: innerCardBg,
              }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: textPrimary }}>Email Notifications</div>
                  <div style={{ fontSize: '0.74rem', color: textMuted }}>Receive agent activity digests and alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.email_notifications)}
                  onChange={e => setPrefs(prev => ({ ...prev, email_notifications: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: purplePrimary, cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPrefsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: 'transparent',
                    color: textSecondary,
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrefs}
                  style={{
                    flex: 1.4,
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: purplePrimary,
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: isSavingPrefs ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {isSavingPrefs ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Teamspace API Keys ── */}
      {isApiKeysModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <button
              type="button"
              onClick={() => {
                setIsApiKeysModalOpen(false);
                setJustCreatedKey(null);
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Key size={20} color={purplePrimary} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: textPrimary }}>
                Teamspace API Keys
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: textSecondary, margin: '0 0 1.5rem 0' }}>
              Manage runtime API keys for embedding brand agents or integrating with your applications.
            </p>

            {/* Created Key Banner (Shown Once) */}
            {justCreatedKey && (
              <div style={{
                backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
                border: '1px solid #10b981',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.4rem' }}>
                  <Check size={16} />
                  <span>API Key Created Successfully</span>
                </div>
                <p style={{ fontSize: '0.76rem', color: isDark ? 'rgba(255,255,255,0.75)' : '#334155', margin: '0 0 0.6rem 0' }}>
                  Please copy this key now. For your security, you will not be able to see this secret again.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: isDark ? '#0b0c11' : '#ffffff',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  padding: '0.4rem 0.65rem',
                }}>
                  <code style={{ flex: 1, fontSize: '0.8rem', color: purplePrimary, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {justCreatedKey.secret_key}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(justCreatedKey.secret_key);
                      setKeyCopied(true);
                      setTimeout(() => setKeyCopied(false), 2000);
                    }}
                    style={{
                      background: purplePrimary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {keyCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{keyCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Create New Key Form */}
            <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key label, e.g. 'Production Agent'"
                style={{
                  flex: 1,
                  height: '38px',
                  backgroundColor: inputBg,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: '8px',
                  padding: '0 0.75rem',
                  fontSize: '0.84rem',
                  color: textPrimary,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isCreatingKey || !newKeyName.trim()}
                style={{
                  padding: '0 1rem',
                  height: '38px',
                  backgroundColor: purplePrimary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isCreatingKey ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {isCreatingKey ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
                <span>Create Key</span>
              </button>
            </form>

            {/* Existing Keys List */}
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary, marginBottom: '0.65rem' }}>
              Active Keys ({apiKeys.length})
            </div>

            {loadingApiKeys ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: textMuted }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem auto' }} />
                <span>Loading keys…</span>
              </div>
            ) : apiKeys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: textMuted, fontSize: '0.82rem' }}>
                No API keys created yet. Create one above to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {apiKeys.map(k => (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: innerCardBg,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: textPrimary }}>
                        {k.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: textMuted, fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        {k.key_hash || k.key_prefix}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.id)}
                      title="Revoke key"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: textMuted,
                        cursor: 'pointer',
                        padding: '0.35rem',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = textMuted}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
