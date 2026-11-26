/**
 * @file AuthContext.jsx
 * @description Global React Context Provider for Managing User Authentication State.
 *
 * Authentication State Strategy:
 * 1. `onAuthStateChanged` Firebase listener for real-time Firebase Auth session state.
 * 2. `fetchAuthMe()` API call for resolving HttpOnly `bff_session` cookie on hard reloads.
 * 3. `syncUserToSupabase` helper for maintaining user profile records in Supabase.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebaseClient';
import { fetchAuthMe, createBFFSession } from '@/services/api';

/**
 * Authentication Context definition.
 */
const AuthContext = createContext({
  user: null,          // Resolved user profile object (null when unauthenticated)
  loading: true,       // True during initial session hydration check
  setUser: () => {},   // Mutator function to push updated user state
});

/**
 * Custom React Hook for consuming the global authentication context.
 * 
 * @returns {{ user: Object|null, loading: boolean, setUser: Function }} Auth state context object.
 */
export const useAuth = () => useContext(AuthContext);

/**
 * Global AuthProvider Component.
 * Wraps the React application and persists user state across all routes.
 * 
 * @param {Object} props - React component props.
 * @param {React.ReactNode} props.children - Child components wrapped by provider.
 * @returns {JSX.Element} React Context Provider element.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    /* ── Step 1: Try BFF cookie first (works on hard reload) ── */
    fetchAuthMe()
      .then((res) => {
        if (isMounted && res?.authenticated && res?.user) {
          // Normalise BFF shape to match Firebase user fields downstream
          setUser({
            uid:         res.user.uid,
            email:       res.user.email,
            displayName: res.user.displayName || res.user.display_name,
            photoURL:    res.user.photoURL    || res.user.photo_url,
            ...res.user,
          });
        }
      })
      .catch(() => {
        // No BFF session — that is fine, Firebase listener below handles it
      })
      .finally(() => {
        // Mark loading done after first check so routes don't flash a login screen
        if (isMounted) setLoading(false);
      });

    /* ── Step 2: Firebase listener — fires whenever auth state changes ── */
    let unsubFirebase = () => {};
    if (auth) {
      try {
        unsubFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!isMounted) return;

          if (firebaseUser) {
            // User is signed in via Firebase — persist to BFF cookie & server sync
            try {
              const idToken = await firebaseUser.getIdToken();
              localStorage.setItem('chatsphare_token', idToken);
              localStorage.removeItem('chatsphare_token');
              await createBFFSession(idToken, firebaseUser);
            } catch {
              /* ignore — BFF may be temporarily unreachable */
            }

            setUser({
              uid:         firebaseUser.uid,
              email:       firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              photoURL:    firebaseUser.photoURL,
            });
          } else {
            // Firebase says no user — clear context (logout)
            localStorage.removeItem('chatsphare_token');
            setUser(null);
          }

          setLoading(false);
        });
      } catch (err) {
        console.warn('[AuthContext] Auth listener note:', err);
      }
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (typeof unsubFirebase === 'function') {
        unsubFirebase();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
