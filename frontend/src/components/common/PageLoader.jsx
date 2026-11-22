import React from 'react';

/**
 * Sleek branded loading spinner for route and async boundary transitions.
 */
export default function PageLoader({ text = 'Loading ChatBook...' }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0c',
      color: '#a1a1aa',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: '#7c3aed',
          animation: 'chatbook-spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '13px', letterSpacing: '0.02em' }}>{text}</span>
        <style>{`@keyframes chatbook-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
