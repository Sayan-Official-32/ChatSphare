import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Universal accessible modal shell.
 * Standardizes backdrop blur, centering, Esc-key closing, and light/dark theme styling.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = '540px',
  isDark = true,
  closeOnClickOutside = true,
  showCloseButton = true,
  footer,
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <div
      onClick={(e) => {
        if (closeOnClickOutside && contentRef.current && !contentRef.current.contains(e.target)) {
          onClose?.();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
    >
      <div
        ref={contentRef}
        style={{
          background: isDark ? '#12131a' : '#ffffff',
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth,
          padding: '1.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          color: isDark ? '#ffffff' : '#0f172a',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${borderColor}`,
              paddingBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {Icon && <Icon size={18} color="#7c3aed" />}
              {title && <span style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</span>}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div>{children}</div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginTop: '0.5rem',
              borderTop: `1px solid ${borderColor}`,
              paddingTop: '0.75rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
