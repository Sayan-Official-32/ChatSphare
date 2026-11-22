/**
 * @file WizardHeader.jsx
 * @description 5-Step Brand Agent Creation Wizard Header Stepper Component.
 * 
 * Features:
 * 1. Step progress indicator bar (Steps 1 through 5).
 * 2. Light / Dark theme toggle button.
 * 3. Step sub-labels ('Start', 'Brand', 'Knowledge', 'Connect', 'Publish').
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Sparkles, Check } from 'lucide-react';

/** Step definition configuration array */
const STEPS = [
  { id: 1, label: 'Start',     sub: 'URL or manual' },
  { id: 2, label: 'Brand',     sub: 'Your identity' },
  { id: 3, label: 'Knowledge', sub: 'What it knows' },
  { id: 4, label: 'Connect',   sub: 'Apps (optional)' },
  { id: 5, label: 'Publish',   sub: 'Test & deploy' },
];

/**
 * Wizard Header stepper component.
 * 
 * @param {Object} props - React props.
 * @param {number} props.currentStep - Currently active step ID (1-5).
 * @param {string} [props.theme='dark'] - Active color theme ('light'|'dark').
 * @param {Function} props.onToggleTheme - Theme toggle handler function.
 * @returns {JSX.Element} Stepper header JSX element.
 */
export default function WizardHeader({ currentStep, theme = 'dark', onToggleTheme }) {
  const navigate = useNavigate();
  const isLight = theme === 'light';

  return (
    <div style={{
      maxWidth: '1080px',
      width: '100%',
      margin: '0 auto',
      padding: '1.5rem 1.5rem 1rem',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
    }}>
      {/* Top Header Row — Title + Subtitle on Left, Light/Dark Mode Toggle on Right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Create a brand agent
            </h1>
            <div style={{
              background: isLight ? 'rgba(124, 58, 237, 0.1)' : 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(6, 182, 212, 0.2))',
              border: isLight ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <Sparkles size={13} color={isLight ? '#7c3aed' : '#c084fc'} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isLight ? '#7c3aed' : '#c084fc', letterSpacing: '0.04em' }}>
                AI POWERED
              </span>
            </div>
          </div>
          <p style={{
            fontSize: '0.86rem',
            color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.45)',
            margin: '0.3rem 0 0 0',
            lineHeight: 1.4,
          }}>
            Configure your brand agent identity, knowledge, and chat widget
          </p>
        </div>

        {/* Theme Toggle Button (Top Right) */}
        <button
          onClick={onToggleTheme}
          style={{
            background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.85)',
            cursor: 'pointer',
            padding: '0.55rem 0.85rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {isLight ? (
            <Moon size={16} color="#475569" />
          ) : (
            <Sun size={16} color="#f59e0b" />
          )}
        </button>
      </div>

      {/* Step Indicator Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.85rem 1.25rem',
        background: isLight ? '#ffffff' : 'rgba(18, 19, 25, 0.85)',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 10px 30px rgba(0, 0, 0, 0.3)',
        boxSizing: 'border-box',
      }}>
        {STEPS.map((step, idx) => {
          const isActive   = currentStep === step.id;
          const isComplete = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                opacity: isActive ? 1 : isComplete ? 0.85 : 0.45,
                transition: 'opacity 0.25s ease',
              }}>
                {/* Circle number badge */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                    : isComplete
                    ? (isLight ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.25)')
                    : (isLight ? '#f1f5f9' : '#161720'),
                  border: isActive
                    ? 'none'
                    : isComplete
                    ? '1px solid #7c3aed'
                    : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: isComplete ? '#7c3aed' : (isActive ? '#ffffff' : (isLight ? '#64748b' : '#ffffff')),
                  flexShrink: 0,
                  boxShadow: isActive
                    ? '0 0 16px rgba(124, 58, 237, 0.5)'
                    : 'none',
                }}>
                  {isComplete ? <Check size={14} strokeWidth={3} color="#7c3aed" /> : step.id}
                </div>

                {/* Step text labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#475569' : 'rgba(255, 255, 255, 0.8)'),
                    lineHeight: 1.25,
                  }}>
                    {step.label}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    color: isActive ? '#7c3aed' : isComplete ? (isLight ? '#64748b' : 'rgba(255, 255, 255, 0.5)') : (isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.35)'),
                  }}>
                    {step.sub}
                  </div>
                </div>
              </div>

              {/* Connecting Bar */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  borderRadius: '1px',
                  background: isComplete
                    ? 'linear-gradient(90deg, #7c3aed, rgba(124, 58, 237, 0.3))'
                    : isActive
                    ? 'linear-gradient(90deg, rgba(124, 58, 237, 0.4), rgba(203, 213, 225, 0.2))'
                    : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'),
                  margin: '0 0.85rem',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
