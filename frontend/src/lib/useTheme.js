import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'chatsphare_theme';

/**
 * Enterprise Theme management hook with cross-tab and cross-component broadcast synchronization.
 */
export function useTheme(defaultTheme = 'dark') {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const isDark = theme === 'dark';

  const setTheme = useCallback((nextTheme) => {
    const resolved = typeof nextTheme === 'function' ? nextTheme(theme) : nextTheme;
    setThemeState(resolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
      window.dispatchEvent(new Event('chatsphare-theme-change'));
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && stored !== theme) {
        setThemeState(stored);
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('chatsphare-theme-change', handleSync);
    const interval = setInterval(handleSync, 100);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('chatsphare-theme-change', handleSync);
      clearInterval(interval);
    };
  }, [theme]);

  // Design system theme tokens
  const tokens = {
    bg: isDark ? '#090a0f' : '#f8fafc',
    bgSurface: isDark ? '#12131a' : '#ffffff',
    bgCard: isDark ? '#181924' : '#f1f5f9',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
    textMuted: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
    primary: '#7c3aed',
  };

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    tokens,
  };
}

export default useTheme;
