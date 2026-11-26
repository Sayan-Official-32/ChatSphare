/**
 * @file ComingSoonPage.jsx
 * @description Polished "Coming Soon" Dashboard View for upcoming ChatSphare workspace modules.
 * 
 * Implements a cohesive, enterprise dark/light mode experience matching the ChatSphare design system:
 * 1. Global left navigation sidebar integration.
 * 2. Feature-specific icons, titles, and capability roadmap previews.
 * 3. Clear primary and secondary back navigation actions.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  LayoutGrid,
  Bot,
  Sparkles,
  Zap,
  Clock,
  BarChart2,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Sun,
  Moon,
  Plus,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';

const FEATURE_CONFIGS = {
  conversations: {
    id: 'conversations',
    tabId: 'conversations',
    badge: 'OMNI-CHANNEL INBOX',
    title: 'Conversations & Live Inbox',
    subtitle: 'Unified real-time visitor chat, human agent takeover, and conversation transcripts.',
    icon: MessageSquare,
    color: '#8b5cf6',
    previewHighlights: [
      { title: 'Live Chat Takeover', desc: 'Seamlessly switch from automated AI responses to live human support in real time.' },
      { title: 'Omni-Channel Sync', desc: 'Aggregate customer messages from Web widgets, WhatsApp, Slack, and Telegram into one stream.' },
      { title: 'Sentiment & Summary', desc: 'Automated conversation summaries and visitor sentiment tracking powered by Mistral AI.' },
    ],
  },
  leads: {
    id: 'leads',
    tabId: 'leads',
    badge: 'LEAD GENERATION',
    title: 'Lead Capture & CRM Sync',
    subtitle: 'Automatic visitor lead qualification, contact data extraction, and CRM webhooks.',
    icon: Users,
    color: '#06b6d4',
    previewHighlights: [
      { title: 'Smart Contact Capture', desc: 'AI agents collect emails, phone numbers, and custom qualification attributes naturally in chat.' },
      { title: 'Instant Webhooks', desc: 'Stream qualified leads directly to HubSpot, Salesforce, Zapier, or your custom API.' },
      { title: 'CSV & Sheet Export', desc: 'One-click exports with customizable date ranges and qualification filters.' },
    ],
  },
  'agent-spaces': {
    id: 'agent-spaces',
    tabId: 'agent-spaces',
    badge: 'AI WORKFORCE',
    title: 'Agent Spaces & Teamwork',
    subtitle: 'Orchestrate multi-agent autonomous teams with specialized roles and shared workspaces.',
    icon: Bot,
    color: '#3b82f6',
    previewHighlights: [
      { title: 'Multi-Agent Collaboration', desc: 'Deploy specialized research, writer, coder, and support agents working together.' },
      { title: 'Role-Based Delegation', desc: 'Hierarchical task delegation with automated supervision and memory sharing.' },
      { title: 'Isolated Environments', desc: 'Dedicated sandbox workspaces with fine-grained access permissions.' },
    ],
  },
  'tools-skills': {
    id: 'tools-skills',
    tabId: 'tools-skills',
    badge: 'EXTENSIONS & PLUGINS',
    title: 'Tools & Agent Skills',
    subtitle: 'Supercharge your agents with custom API integrations, MCP servers, and database tools.',
    icon: Sparkles,
    color: '#ec4899',
    previewHighlights: [
      { title: 'Custom REST Endpoints', desc: 'Attach OpenAPI / Swagger endpoints to enable transactional agent actions.' },
      { title: 'Model Context Protocol (MCP)', desc: 'Connect to standard MCP tool servers for live databases, search, and cloud storage.' },
      { title: 'Execution Sandboxes', desc: 'Secure Python and JavaScript execution environments for data analysis.' },
    ],
  },
  'runs-schedules': {
    id: 'runs-schedules',
    tabId: 'runs-schedules',
    badge: 'AUTOMATION & JOBS',
    title: 'Runs & Scheduled Tasks',
    subtitle: 'Automate recurring knowledge updates, web crawls, and scheduled agent workflows.',
    icon: Clock,
    color: '#f59e0b',
    previewHighlights: [
      { title: 'Cron Schedules', desc: 'Configure daily, weekly, or custom cron triggers for automatic background operations.' },
      { title: 'Live Execution Logs', desc: 'Full audit trails with step-by-step token usage, logs, and execution latency.' },
      { title: 'Failure Retries & Alerts', desc: 'Automated retry policies and instant webhook notifications on workflow errors.' },
    ],
  },
  templates: {
    id: 'templates',
    tabId: 'templates',
    badge: 'PRE-BUILT SOLUTIONS',
    title: 'Brand Agent Templates',
    subtitle: 'Production-ready agent templates curated for E-Commerce, SaaS, Support, and Real Estate.',
    icon: LayoutGrid,
    color: '#10b981',
    previewHighlights: [
      { title: '1-Click Deployment', desc: 'Clone complete workflows with pre-tuned personas, guardrails, and knowledge structure.' },
      { title: 'Industry-Specific Personas', desc: 'Tailored prompt engineering and behavioral policies for over 20 industries.' },
      { title: 'Custom Template Publishing', desc: 'Save and share custom agent recipes across your enterprise teamspaces.' },
    ],
  },
  insights: {
    id: 'insights',
    tabId: 'insights',
    badge: 'WORKSPACE ANALYTICS',
    title: 'Insights & Performance Analytics',
    subtitle: 'Comprehensive usage metrics, resolution rates, CSAT sentiment, and token consumption.',
    icon: BarChart2,
    color: '#6366f1',
    previewHighlights: [
      { title: 'Query & Accuracy Metrics', desc: 'Deep visibility into RAG retrieval accuracy and frequently asked topics.' },
      { title: 'User Satisfaction Scores', desc: 'Aggregated thumbs up/down feedback and conversation resolution rates.' },
      { title: 'Token & Cost Breakdown', desc: 'Cost attribution per brand agent, workspace member, and deployment channel.' },
    ],
  },
  support: {
    id: 'support',
    tabId: 'support',
    badge: 'HELP & ASSISTANCE',
    title: 'Contact Support & Helpdesk',
    subtitle: '24/7 priority developer assistance, live chat support, and community forums.',
    icon: HelpCircle,
    color: '#14b8a6',
    previewHighlights: [
      { title: 'Dedicated Engineer Support', desc: 'Fast resolution SLAs for enterprise deployment, custom integrations, and billing.' },
      { title: 'Live Troubleshooting', desc: 'Real-time debugging sessions with ChatSphare core infrastructure specialists.' },
      { title: 'Community Discord', desc: 'Join over 5,000+ AI agent developers and product builders.' },
    ],
  },
  documentation: {
    id: 'documentation',
    tabId: 'documentation',
    badge: 'DEVELOPER GUIDES',
    title: 'Documentation & API References',
    subtitle: 'Comprehensive guides for widget embedding, REST APIs, webhooks, and backend architecture.',
    icon: BookOpen,
    color: '#64748b',
    previewHighlights: [
      { title: 'Widget Embedding Guides', desc: 'Quick start guides for React, Next.js, HTML, Shopify, WordPress, and Webflow.' },
      { title: 'REST API & SDKs', desc: 'Complete endpoint specifications with Python, TypeScript, and cURL code samples.' },
      { title: 'Architecture Best Practices', desc: 'Guides on vector embedding tuning, chunking strategies, and security policies.' },
    ],
  },
};

export default function ComingSoonPage({ feature: featureProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Unified theme state
  const { theme, isDark, toggleTheme } = useTheme();

  // Resolve feature from prop or URL pathname
  const derivedKey = featureProp || location.pathname.split('/').pop() || 'conversations';
  const config = FEATURE_CONFIGS[derivedKey] || FEATURE_CONFIGS.conversations;
  const FeatureIcon = config.icon || Sparkles;

  const handleSelectTab = (tabId) => {
    if (tabId === 'agents') {
      navigate('/app/agents');
    } else if (tabId === 'knowledge') {
      navigate('/app/knowledge-bases');
    } else if (FEATURE_CONFIGS[tabId]) {
      navigate(`/app/${tabId}`);
    } else if (tabId === 'support') {
      navigate('/app/support');
    } else if (tabId === 'documentation') {
      navigate('/app/docs');
    }
  };

  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      background: isDark ? '#0c0e14' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      transition: 'background 0.3s ease, color 0.3s ease',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
        {/* Top Header Bar */}
        <header style={{
          padding: '1.25rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
          background: isDark ? '#090a0f' : '#ffffff',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => navigate('/app/agents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                color: isDark ? 'rgba(255,255,255,0.8)' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
            <div style={{ height: '16px', width: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1' }} />
            <span style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
              ChatSphare Workspace / {config.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                color: isDark ? '#facc15' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Create New Agent CTA */}
            <button
              onClick={() => navigate('/app/brand-agent/new')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '9px',
                background: '#7c3aed',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              <Plus size={15} />
              <span>New Brand Agent</span>
            </button>
          </div>
        </header>

        {/* Scrollable Center Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Subtle Ambient Radial Glow */}
          <div style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: isDark ? `radial-gradient(circle, ${config.color}22 0%, transparent 70%)` : `radial-gradient(circle, ${config.color}15 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -20%)',
          }} />

          {/* Center Card */}
          <div style={{
            maxWidth: '720px',
            width: '100%',
            background: isDark ? 'rgba(18, 19, 25, 0.85)' : '#ffffff',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0'}`,
            borderRadius: '20px',
            padding: '2.75rem 2.5rem',
            boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.6)' : '0 15px 40px rgba(0,0,0,0.06)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Top Icon with Pulse Ring */}
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: isDark ? 'rgba(124,58,237,0.15)' : '#ede9fe',
              border: `1px solid ${isDark ? 'rgba(124,58,237,0.35)' : '#c4b5fd'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#c4b5fd' : '#7c3aed',
              boxShadow: isDark ? '0 0 25px rgba(124,58,237,0.3)' : 'none',
            }}>
              <FeatureIcon size={32} />
            </div>

            {/* Badge & Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: isDark ? '#a78bfa' : '#7c3aed',
                background: isDark ? 'rgba(124,58,237,0.18)' : '#f3e8ff',
                border: `1px solid ${isDark ? 'rgba(124,58,237,0.35)' : '#ddd6fe'}`,
                padding: '3px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
              }}>
                {config.badge}
              </span>

              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {config.title}
              </h1>

              <p style={{
                fontSize: '0.95rem',
                color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b',
                maxWidth: '540px',
                lineHeight: 1.6,
                margin: 0,
              }}>
                We’re working on something great. This feature is currently in active engineering and will be available in your workspace soon.
              </p>
            </div>

            {/* 3 Upcoming Capability Cards */}
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.85rem',
              marginTop: '0.5rem',
            }}>
              {config.previewHighlights.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '1rem 1.1rem',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={15} color={isDark ? '#a78bfa' : '#7c3aed'} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', lineHeight: 1.45, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', marginTop: '0.75rem' }}>
              <button
                onClick={() => navigate('/app/agents')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.6rem',
                  borderRadius: '10px',
                  background: '#7c3aed',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(124,58,237,0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/app/knowledge-bases')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                  color: isDark ? '#ffffff' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
              >
                <Compass size={16} />
                <span>Explore Knowledge Bases</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}