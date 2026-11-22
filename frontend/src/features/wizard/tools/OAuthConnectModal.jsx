/**
 * @file OAuthConnectModal.jsx
 * @description Google Workspace OAuth 2.0 authorization and configuration modal
 * for Google Calendar, Google Sheets, and Google Drive.
 * Ultra-comfortable, user-friendly, and modern.
 */

import React, { useState } from 'react';
import { X, Lock, Unlock, Check, Calendar, Table, FolderSync, ExternalLink, ShieldCheck, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { connectOAuthTool, disconnectOAuthTool, executeToolAction } from '@/services/api';

export default function OAuthConnectModal({ agentId, tool, theme, onClose, onSave }) {
  const isConnected = tool.auth_status === 'connected' || tool.enabled;
  const [accountEmail, setAccountEmail] = useState(tool.configuration?.oauth_account || 'alex.founder@gmail.com');
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Tool specific configurations
  const [calendarName, setCalendarName] = useState(tool.configuration?.calendar_name || 'Primary Work Calendar');
  const [duration, setDuration] = useState(tool.configuration?.duration_minutes || 30);
  const [enableMeet, setEnableMeet] = useState(tool.configuration?.enable_google_meet !== false);

  const [spreadsheetName, setSpreadsheetName] = useState(tool.configuration?.spreadsheet_name || 'Chatbook Leads & Inquiries');
  const [sheetName, setSheetName] = useState(tool.configuration?.sheet_name || 'Sheet1');
  const [autoAppend, setAutoAppend] = useState(tool.configuration?.auto_append_leads !== false);

  const [folderName, setFolderName] = useState(tool.configuration?.folder_name || 'Company Knowledge Base');

  const isDark = theme === 'dark';

  const getToolDetails = () => {
    if (tool.id === 'google_calendar') {
      return {
        title: 'Google Calendar',
        serviceLabel: 'Google Calendar Scheduling',
        icon: Calendar,
        iconBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
        iconColor: '#1d4ed8',
        description: 'Allow your AI agent to check available time slots and book meeting appointments with Google Meet links.',
      };
    }
    if (tool.id === 'google_sheets') {
      return {
        title: 'Google Sheets',
        serviceLabel: 'Google Sheets Data Sync',
        icon: Table,
        iconBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
        iconColor: '#047857',
        description: 'Automatically append incoming visitor leads, booking details, and customer questions into your Google Sheets in real-time.',
      };
    }
    return {
      title: 'Google Drive',
      serviceLabel: 'Google Drive Knowledge Sync',
      icon: FolderSync,
      iconBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
      iconColor: '#b45309',
      description: 'Connect Google Drive to index documents, company guides, and PDFs directly into the agent’s vector knowledge base.',
    };
  };

  const details = getToolDetails();
  const IconComp = details.icon;

  const handleConnect = async () => {
    setIsConnecting(true);
    const configPayload = {
      calendar_name: calendarName,
      duration_minutes: duration,
      enable_google_meet: enableMeet,
      spreadsheet_name: spreadsheetName,
      sheet_name: sheetName,
      auto_append_leads: autoAppend,
      folder_name: folderName,
    };

    try {
      const res = await connectOAuthTool(
        agentId,
        tool.id,
        { account_email: accountEmail, provider: 'google' },
        configPayload
      );
      onSave(tool.id, res.configuration, true);
      setIsConnecting(false);
    } catch (err) {
      console.error('OAuth connection error:', err);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectOAuthTool(agentId, tool.id);
      onSave(tool.id, tool.configuration, false);
      onClose();
    } catch (err) {
      console.error('OAuth disconnect error:', err);
    }
  };

  const handleRunTestAction = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let actionName = 'create_event';
      let payload = {};
      if (tool.id === 'google_calendar') {
        actionName = 'create_event';
        payload = { title: 'Product Consultation Call', duration, date: '2026-08-25', time: '15:00' };
      } else if (tool.id === 'google_sheets') {
        actionName = 'append_row';
        payload = { spreadsheet_id: 'default', sheet_name: sheetName, name: 'Alex Johnson', email: accountEmail };
      } else {
        actionName = 'sync_drive';
        payload = { folder_name: folderName, file_count: 3 };
      }

      const res = await executeToolAction(agentId, tool.id, actionName, payload);
      setTestResult(res.result);
    } catch (err) {
      setTestResult({ message: `Action failed: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.25rem',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        background: isDark ? '#13141c' : '#ffffff',
        color: isDark ? '#ffffff' : '#0f172a',
        borderRadius: '18px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
        boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.6)' : '0 20px 45px -10px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: details.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconComp size={24} color={details.iconColor} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                {details.serviceLabel}
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                Google Workspace OAuth 2.0 Integration
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(255,255,255,0.7)' : '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          {/* Service Description Banner */}
          <div style={{
            padding: '0.9rem 1.1rem',
            borderRadius: '12px',
            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: isDark ? 'rgba(255,255,255,0.7)' : '#4b5563',
          }}>
            {details.description}
          </div>

          {/* Connection / Authorization Status Box */}
          <div style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '14px',
            border: `1px solid ${isConnected ? (isDark ? 'rgba(34, 197, 94, 0.4)' : '#a7f3d0') : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')}`,
            background: isConnected
              ? (isDark ? 'rgba(34, 197, 94, 0.06)' : '#f0fdf4')
              : (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isConnected
                  ? (isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7')
                  : (isDark ? 'rgba(156, 163, 175, 0.15)' : '#f3f4f6'),
                color: isConnected ? '#16a34a' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isConnected ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isConnected ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#f9fafb' : '#111827') }}>
                  {isConnected ? 'Google Account Connected' : 'Google Authorization Required'}
                </div>
                <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280', marginTop: '1px' }}>
                  {isConnected ? accountEmail : 'Sign in to unlock live automated actions'}
                </div>
              </div>
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                style={{
                  background: '#ffffff',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  flexShrink: 0,
                }}
              >
                <Lock size={13} color="#6366f1" />
                <span>{isConnecting ? 'Connecting...' : 'Authorize'}</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Configuration Settings for Google Calendar */}
          {tool.id === 'google_calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Target Calendar Name
                </label>
                <input
                  type="text"
                  value={calendarName}
                  onChange={e => setCalendarName(e.target.value)}
                  placeholder="Primary Work Calendar"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Default Duration
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '9px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? '#171822' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value={15}>15 Minutes (Quick Sync)</option>
                    <option value={30}>30 Minutes (Standard)</option>
                    <option value={45}>45 Minutes (Consultation)</option>
                    <option value={60}>60 Minutes (Deep Dive)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '1.3rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableMeet}
                      onChange={e => setEnableMeet(e.target.checked)}
                      style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                    />
                    <span>Attach Google Meet link</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Settings for Google Sheets */}
          {tool.id === 'google_sheets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Spreadsheet Title
                </label>
                <input
                  type="text"
                  value={spreadsheetName}
                  onChange={e => setSpreadsheetName(e.target.value)}
                  placeholder="Chatbook Leads & Inquiries"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Worksheet Tab Name
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={e => setSheetName(e.target.value)}
                    placeholder="Sheet1"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '9px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '1.3rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoAppend}
                      onChange={e => setAutoAppend(e.target.checked)}
                      style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                    />
                    <span>Auto-append new leads</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Settings for Google Drive */}
          {tool.id === 'google_drive' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Target Google Drive Folder
              </label>
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="Company Knowledge Base"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '9px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Test Live Action Trigger */}
          {isConnected && (
            <div style={{
              padding: '1.1rem',
              borderRadius: '12px',
              background: isDark ? 'rgba(99,102,241,0.06)' : '#f8faff',
              border: '1px solid rgba(99,102,241,0.22)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1' }}>
                  <Zap size={15} /> Test Live Action Trigger
                </span>
                <button
                  onClick={handleRunTestAction}
                  disabled={isTesting}
                  style={{
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                  }}
                >
                  {isTesting ? 'Executing...' : 'Run Test'}
                </button>
              </div>

              {testResult && (
                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isDark ? '#0b0c12' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  color: '#16a34a',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>✓ {testResult.message}</div>
                  {testResult.google_meet_link && (
                    <div style={{ color: '#0284c7' }}>Meet Link: {testResult.google_meet_link}</div>
                  )}
                  {testResult.appended_row && (
                    <div style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>
                      Row: {testResult.appended_row.join(' • ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '9px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`,
              background: 'transparent',
              color: isDark ? '#ffffff' : '#374151',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          {!isConnected ? (
            <button
              disabled
              style={{
                padding: '0.6rem 1.35rem',
                borderRadius: '9px',
                border: 'none',
                background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Lock size={14} />
              <span>Coming Soon (In Development)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleConnect();
                onClose();
              }}
              style={{
                padding: '0.6rem 1.35rem',
                borderRadius: '9px',
                border: 'none',
                background: '#16a34a',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}
            >
              <Check size={16} />
              <span>Save Configuration</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
