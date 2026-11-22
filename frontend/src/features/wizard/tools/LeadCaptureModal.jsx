/**
 * @file LeadCaptureModal.jsx
 * @description Modal for configuring the Built-in Lead Capture form and viewing captured visitor leads.
 * Ultra-comfortable, user-friendly, and modern.
 */

import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Check, User, Mail, Phone, Building, MessageSquare, ShieldCheck, Eye, Sparkles, SlidersHorizontal, Users } from 'lucide-react';
import { fetchCapturedLeads, configureTool } from '@/services/api';

export default function LeadCaptureModal({ agentId, tool, theme, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'preview' | 'leads'
  const [fields, setFields] = useState(() => {
    return tool.configuration?.fields || {
      name: { label: 'Full Name', enabled: true, required: true },
      email: { label: 'Email Address', enabled: true, required: true },
      phone: { label: 'Phone Number', enabled: true, required: false },
      company: { label: 'Company / Organization', enabled: false, required: false },
      message: { label: 'Message / Note', enabled: true, required: false },
    };
  });
  const [title, setTitle] = useState(tool.configuration?.title || 'Contact Information');
  const [subtitle, setSubtitle] = useState(tool.configuration?.subtitle || 'Please leave your details so our team can get in touch with you.');
  const [trigger, setTrigger] = useState(tool.configuration?.trigger || 'on_intent');
  const [leads, setLeads] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetchCapturedLeads(agentId);
        setLeads(res.leads || []);
      } catch {
        /* ignore */
      }
    }
    loadLeads();
  }, [agentId]);

  const handleToggleField = (key) => {
    setFields(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedConfig = {
      ...tool.configuration,
      title,
      subtitle,
      trigger,
      fields,
    };
    try {
      await configureTool(agentId, 'lead_capture', updatedConfig, true);
      onSave('lead_capture', updatedConfig, true);
      onClose();
    } catch (err) {
      console.error('Failed to save lead capture config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = theme === 'dark';

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
        maxWidth: '640px',
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
        {/* Modal Header */}
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
              background: isDark ? 'rgba(168, 85, 247, 0.15)' : '#ede9fe',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ClipboardList size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                Lead Capture Form
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                Collect visitor contact details inside the chat widget
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
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
          padding: '0 1.5rem',
          background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
          gap: '0.5rem',
        }}>
          {[
            { id: 'fields', label: 'Form Fields & Trigger', icon: SlidersHorizontal },
            { id: 'preview', label: 'Widget Preview', icon: Eye },
            { id: 'leads', label: `Captured Leads (${leads.length})`, icon: Users },
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                  padding: '0.8rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? 'rgba(255,255,255,0.55)' : '#6b7280'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s',
                }}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'fields' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Form Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contact Information"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Subtitle / Prompt Message
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="Please leave your details so our team can get in touch with you."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Form Fields To Collect
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(fields).map(([k, f]) => (
                    <div
                      key={k}
                      onClick={() => handleToggleField(k)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '10px',
                        border: `1px solid ${f.enabled ? (isDark ? 'rgba(168, 85, 247, 0.4)' : '#ddd6fe') : (isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')}`,
                        background: f.enabled ? (isDark ? 'rgba(168, 85, 247, 0.08)' : '#f5f3ff') : (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'),
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        {k === 'name' && <User size={16} color="#8b5cf6" />}
                        {k === 'email' && <Mail size={16} color="#8b5cf6" />}
                        {k === 'phone' && <Phone size={16} color="#8b5cf6" />}
                        {k === 'company' && <Building size={16} color="#8b5cf6" />}
                        {k === 'message' && <MessageSquare size={16} color="#8b5cf6" />}
                        <span>{f.label}</span>
                        {f.required && (
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            Required
                          </span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: '#7c3aed', width: '16px', height: '16px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Trigger Condition
                </label>
                <select
                  value={trigger}
                  onChange={e => setTrigger(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                    background: isDark ? '#171822' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="on_intent">Trigger automatically when visitor asks for pricing, quotes, or demo</option>
                  <option value="on_start">Show immediately when chat widget opens</option>
                  <option value="manual">Only show when AI agent explicitly asks for contact info</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div style={{
              background: isDark ? '#0b0c12' : '#f1f5f9',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '380px',
              margin: '0 auto',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
                {title}
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                {subtitle}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(fields).filter(([_, f]) => f.enabled).map(([k, f]) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.25rem' }}>
                      {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      disabled
                      placeholder={`Enter your ${f.label.toLowerCase()}...`}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: '8px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                        color: isDark ? '#fff' : '#000',
                      }}
                    />
                  </div>
                ))}
                <button
                  disabled
                  style={{
                    marginTop: '0.5rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'default',
                  }}
                >
                  Submit Details
                </button>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: '0.88rem' }}>
                  No visitor leads captured yet. Leads submitted through the widget will appear here in real-time.
                </div>
              ) : (
                leads.map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{lead.name}</span>
                      <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af' }}>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 500 }}>
                      {lead.email} {lead.phone && `• ${lead.phone}`}
                    </div>
                    {lead.company && <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Company: {lead.company}</div>}
                    {lead.message && (
                      <div style={{ fontSize: '0.78rem', fontStyle: 'italic', marginTop: '0.25rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>
                        "{lead.message}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '0.6rem 1.35rem',
              borderRadius: '9px',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Check size={16} />
            <span>{isSaving ? 'Saving...' : 'Save & Enable Form'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
