/**
 * @file main.jsx
 * @description React Application Entry Point.
 * 
 * Responsibilities:
 * 1. Mounts React root component onto `#root` DOM element.
 * 2. Wraps the app in `React.StrictMode` for development diagnostics.
 * 3. Encloses routes within `BrowserRouter` for SPA URL navigation.
 * 4. Encloses app in global `AuthProvider` context so authentication state
 *    persists seamlessly across page transitions and back-button navigation.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        {/* AuthProvider wraps the entire app so auth state persists
            across route changes — no re-login when navigating backward */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
