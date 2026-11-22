import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Lock,
  Database,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  Copy,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Wand2,
  HelpCircle,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  Globe,
  Calendar,
  Video,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Cpu,
} from 'lucide-react';
import CustomizeWidgetModal from '@/components/widget/CustomizeWidgetModal';
import { saveAgentBrandConfig, generateAgentInstructions, fetchKnowledgeBases, fetchAiInstructionsQuota, fetchAvailableModels } from '@/services/api';

import { AVAILABLE_MODELS, ModelProviderLogo } from '../config/modelsConfig';

/* Crisp Vector Logos for Tools & Deploy Channels */
function SlackIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <path d="M26.7 78.4a13.3 13.3 0 1 1-13.3-13.3h13.3v13.3z" fill="#E01E5A" />
      <path d="M33.4 78.4a13.3 13.3 0 0 1 26.6 0v33.2a13.3 13.3 0 1 1-26.6 0V78.4z" fill="#E01E5A" />
      <path d="M46.7 26.7a13.3 13.3 0 1 1 13.3-13.3v13.3H46.7z" fill="#36C5F0" />
      <path d="M46.7 33.4a13.3 13.3 0 0 1 0 26.6H13.5a13.3 13.3 0 1 1 0-26.6h33.2z" fill="#36C5F0" />
      <path d="M98.3 46.7a13.3 13.3 0 1 1 13.3 13.3H98.3V46.7z" fill="#2EB67D" />
      <path d="M91.6 46.7a13.3 13.3 0 0 1-26.6 0V13.5a13.3 13.3 0 1 1 26.6 0v33.2z" fill="#2EB67D" />
      <path d="M78.4 98.3a13.3 13.3 0 1 1-13.3 13.3V98.3h13.3z" fill="#ECB22E" />
      <path d="M78.4 91.6a13.3 13.3 0 0 1 0-26.6h33.2a13.3 13.3 0 1 1 0 26.6H78.4z" fill="#ECB22E" />
    </svg>
  );
}

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#25D366" />
      <path
        d="M34.2 29.8c-.5-.3-2.9-1.4-3.4-1.6-.4-.2-.8-.3-1.1.3-.3.6-1.3 1.6-1.6 1.9-.3.3-.6.4-1.1.1-.5-.3-2.2-.8-4.2-2.6-1.6-1.4-2.6-3.1-2.9-3.6-.3-.5 0-.8.2-1 .2-.2.5-.6.8-.9.2-.3.3-.5.5-.8.2-.3.1-.6 0-.9-.1-.2-1.1-2.7-1.5-3.7-.4-1-.8-.8-1.1-.8h-1c-.3 0-.9.1-1.4.6-.5.5-1.9 1.9-1.9 4.6s2 5.3 2.2 5.7c.3.4 3.8 5.8 9.3 8.2 1.3.6 2.3.9 3.1 1.2 1.3.4 2.5.3 3.5.2 1.1-.2 3.4-1.4 3.9-2.7.5-1.3.5-2.5.3-2.7-.2-.2-.6-.4-1.1-.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function TelegramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#2AABEE" />
      <path
        d="M10 23.5l23.5-9.6c1.1-.4 2.1.3 1.7 1.9l-4 18.9c-.3 1.3-1.1 1.6-2.2 1l-6.1-4.5-2.9 2.8c-.3.3-.6.6-1.2.6l.4-6.2 11.3-10.2c.5-.4-.1-.7-.7-.3L15.9 27.5l-6-1.9c-1.3-.4-1.3-1.3.1-1.8v-.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function InstagramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <radialGradient id="ig-edit-g" cx="19%" cy="100%" r="130%">
        <stop offset="0%" stopColor="#ffd521" />
        <stop offset="35%" stopColor="#f50000" />
        <stop offset="70%" stopColor="#c5007c" />
        <stop offset="100%" stopColor="#4a00e0" />
      </radialGradient>
      <rect width="48" height="48" rx="12" fill="url(#ig-edit-g)" />
      <path
        d="M34 14H14a6 6 0 0 0-6 6v14a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6V20a6 6 0 0 0-6-6zm-10 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm10-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="26" r="5" stroke="#fff" strokeWidth="3.2" fill="none" />
    </svg>
  );
}

function ZapierIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="10" fill="#FF4F00" />
      <path d="M24 10v28M10 24h28M14 14l20 20M34 14L14 34" stroke="#FFF" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function FramerIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#0055FF" />
      <path d="M4 3h16v6h-8l8 6h-8v6l-8-9h8V3z" fill="#FFF" />
    </svg>
  );
}

// Tool Icon Dispatcher
function ConnectorToolIcon({ type, size = 22, isDark = true }) {
  if (type === 'lead_capture') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FileText size={18} color="#a855f7" />
      </div>
    );
  }
  if (type === 'web_search') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Globe size={18} color="#a855f7" />
      </div>
    );
  }
  if (type === 'site_nav') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </div>
    );
  }
  if (type === 'slack') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <SlackIcon size={22} />
      </div>
    );
  }
  if (type === 'whatsapp') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isDark ? 'rgba(37,211,102,0.12)' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <WhatsAppIcon size={22} />
      </div>
    );
  }
  if (type === 'telegram') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isDark ? 'rgba(42,171,238,0.12)' : '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <TelegramIcon size={22} />
      </div>
    );
  }
  if (type === 'instagram') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <InstagramIcon size={26} />
      </div>
    );
  }
  if (type === 'zapier') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ZapierIcon size={26} />
      </div>
    );
  }
  if (type === 'framer') {
    return (
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FramerIcon size={24} />
      </div>
    );
  }
  if (type === 'google_calendar') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: '13px',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
      }}>
        31
      </div>
    );
  }
  if (type === 'outlook') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: '#0078d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 900,
        fontSize: '14px',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,120,212,0.3)',
      }}>
        O
      </div>
    );
  }
  if (type === 'zoom') {
    return (
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: '#2d8cff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(45,140,255,0.3)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="13" height="12" rx="3" fill="#ffffff" />
          <polygon points="16,10 21,7 21,17 16,14" fill="#ffffff" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isDark ? 'rgba(124,58,237,0.15)' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <LinkIcon size={18} color="#7c3aed" />
    </div>
  );
}

// Helper to parse inline markdown **bold**
function renderInlineMarkdown(text, isDark) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong
          key={index}
          style={{
            fontWeight: 700,
            color: isDark ? '#ffffff' : '#0f172a',
          }}
        >
          {boldText}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// Helper to render rich formatted prompt preview
function renderFormattedPrompt(markdownText, isDark) {
  if (!markdownText) return null;
  const lines = markdownText.split('\n');

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      const headerText = trimmed.replace(/^###\s+/, '');
      return (
        <div
          key={idx}
          style={{
            fontWeight: 800,
            fontSize: '0.92rem',
            letterSpacing: '-0.2px',
            color: isDark ? '#ffffff' : '#0f172a',
            marginTop: idx === 0 ? '0' : '0.85rem',
            marginBottom: '0.35rem',
          }}
        >
          {headerText}
        </div>
      );
    }

    if (trimmed.startsWith('#### ')) {
      const subheaderText = trimmed.replace(/^####\s+/, '');
      return (
        <div
          key={idx}
          style={{
            fontWeight: 700,
            fontSize: '0.84rem',
            color: isDark ? '#e2e8f0' : '#1e293b',
            marginTop: '0.65rem',
            marginBottom: '0.25rem',
          }}
        >
          {subheaderText}
        </div>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const isIndented = line.startsWith('  ') || line.startsWith('\t');
      const bulletContent = trimmed.replace(/^[-•*]\s+/, '');
      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem',
            fontSize: '0.79rem',
            lineHeight: 1.5,
            color: isDark ? 'rgba(255,255,255,0.85)' : '#334155',
            margin: isIndented ? '0.15rem 0 0.15rem 1.6rem' : '0.2rem 0 0.2rem 0.65rem',
          }}
        >
          <span style={{ color: isDark ? (isIndented ? '#818cf8' : '#a78bfa') : (isIndented ? '#6366f1' : '#7c3aed'), fontWeight: 800, fontSize: isIndented ? '0.75rem' : '0.85rem', lineHeight: 1.3 }}>
            {isIndented ? '–' : '•'}
          </span>
          <span>{renderInlineMarkdown(bulletContent, isDark)}</span>
        </div>
      );
    }

    if (!trimmed) {
      return <div key={idx} style={{ height: '0.4rem' }} />;
    }

    return (
      <div
        key={idx}
        style={{
          fontSize: '0.79rem',
          lineHeight: 1.55,
          color: isDark ? 'rgba(255,255,255,0.82)' : '#334155',
          margin: '0.25rem 0',
        }}
      >
        {renderInlineMarkdown(line, isDark)}
      </div>
    );
  });
}

export default function EditSpace({ agentState, isDark = true, onUpdateAgentState, agentId }) {
  // Modal state for Customize Widget
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Canvas zoom viewport state
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(1.3, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.7, Math.round((prev - 0.1) * 10) / 10));
  const handleZoomReset = () => setZoomLevel(1.0);

  // Active settings tab: 'config' | 'knowledge' | 'tools' (One section per view)
  const [openSection, setOpenSection] = useState('config');
  const drawerScrollRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleToggleSection = (sectionId) => {
    setOpenSection(sectionId);
    if (modelDropdownOpen) setModelDropdownOpen(false);
    drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form baseline initializers with defensive string/array fallbacks
  const projectName = (typeof agentState?.brand_name === 'string' && agentState.brand_name)
    || (typeof agentState?.display_name === 'string' && agentState.display_name)
    || 'My Brand';
  const shortKbName = `${(projectName.split(' ')[0] || 'My')} KB`;
  const brandDesc = (typeof agentState?.brand_description === 'string' && agentState.brand_description)
    || (typeof agentState?.description === 'string' && agentState.description)
    || '';

  const defaultPromptTemplate = `### Role

You are the official **${projectName} AI Specialist** — Customer Support Specialist representing ${projectName}.
Role-specific rules below override general guidance when they conflict.

#### Mission

Deliver accurate, helpful, and brand-aligned assistance for ${projectName}, guiding users to quick solutions.

#### Do

* Provide direct, useful answers first.
* Keep responses concise and relevant to your role as Customer Support Specialist.
* Ask one focused clarifying question when the user's intent is ambiguous.
* Acknowledge limitations transparently when information is unavailable.
* Maintain a warm, concise, and confident tone at all times.

#### When unsure or out of scope

* Clearly and politely state that the request falls outside current capabilities or knowledge.
* If a factual answer is not verified in knowledge data, clearly state: "I don't have verified information regarding that."
* Offer the closest helpful alternative or suggest contacting human support.
* Never fabricate facts, policies, links, or internal details.

#### Escalate or stop

* Direct the user to human support or official contact channels immediately when:
  - The issue involves account security, billing disputes, or legal concerns.
  - The user explicitly asks to speak with a human.
  - The query cannot be resolved after two attempts.

### Brand snapshot (ground truth for tone and facts)

${brandDesc || `${projectName} delivers dependable solutions and customer-centric service. We are committed to transparency, excellence, and proactive support across all customer engagements.`}

### Voice & delivery

* Maintain an authentic, empathetic, and solution-oriented tone.
* Use clear, plain language — avoid unnecessary jargon.
* Format responses with short paragraphs and bullet points for readability.
* Never use filler phrases like "As an AI..." or "I'm just a computer program."`;

  const initialAgentName = agentState?.display_name || agentState?.brand_name || `${projectName} Assistant`;
  const initialModel = agentState?.model || 'Gemini 2.5 Flash';
  const initialTemperature = agentState?.temperature !== undefined && agentState?.temperature !== null ? Number(agentState.temperature) : 0.3;
  const initialMaxTokens = agentState?.max_tokens || agentState?.maxTokens || 512;
  const initialTopP = agentState?.top_p !== undefined && agentState?.top_p !== null ? Number(agentState.top_p) : 0.9;
  const initialPrompt = (typeof agentState?.system_prompt === 'string' && agentState.system_prompt.includes('### Role'))
    ? agentState.system_prompt
    : (agentState?.system_prompt || defaultPromptTemplate);
  const initialKbs = [
    { id: `kb-${agentState?.brand_id || agentState?.agent_id || 'main'}`, name: shortKbName, docCount: Array.isArray(agentState?.knowledge_items) ? agentState.knowledge_items.length : 1, attached: true },
  ];

  const defaultAllTools = [
    // 1. BUILT-IN
    {
      id: 'lead_capture',
      name: 'Lead Capture',
      categoryGroup: 'BUILT-IN',
      categoryLabel: 'Built-in',
      desc: 'Collect visitor details with a customizable form shown in chat.',
      badge: 'Built-in',
      connected: true,
      status: 'Active',
      iconType: 'lead_capture',
      actionType: 'configure',
    },
    {
      id: 'web_search',
      name: 'Web Search',
      categoryGroup: 'BUILT-IN',
      categoryLabel: 'Built-in',
      desc: 'Let your agent look up current information on the web.',
      badge: 'Built-in',
      connected: false,
      status: 'Not connected',
      iconType: 'web_search',
      actionType: 'connect',
      locked: true,
    },
    {
      id: 'site_nav',
      name: 'Site Navigation',
      categoryGroup: 'BUILT-IN',
      categoryLabel: 'Built-in',
      desc: 'Let your agent navigate visitors to any page on your website.',
      badge: 'Built-in',
      connected: false,
      status: 'Not connected',
      iconType: 'site_nav',
      actionType: 'connect',
    },

    // 2. DEPLOY CHANNELS & INTEGRATIONS (from Deploy page)
    {
      id: 'slack',
      name: 'Slack',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Deploy Channel',
      desc: 'Connect your agent workflow to a bot that responds when mentioned.',
      badge: 'Channel',
      connected: false,
      status: 'Not connected',
      iconType: 'slack',
      actionType: 'connect',
      locked: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Deploy Channel',
      desc: 'Messages to your WhatsApp business number will be handled by your Agent.',
      badge: 'Channel',
      connected: false,
      status: 'Not connected',
      iconType: 'whatsapp',
      actionType: 'connect',
      locked: true,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Deploy Channel',
      desc: 'Create and connect a Telegram bot that you or anyone can chat with.',
      badge: 'Channel',
      connected: false,
      status: 'Not connected',
      iconType: 'telegram',
      actionType: 'connect',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Deploy Channel',
      desc: 'Connect Instagram DM automation to qualify incoming direct messages.',
      badge: 'Channel',
      connected: false,
      status: 'Not connected',
      iconType: 'instagram',
      actionType: 'connect',
    },
    {
      id: 'zapier',
      name: 'Zapier',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Integration',
      desc: 'Trigger 5,000+ app automations from chat events and lead captures.',
      badge: 'Integration',
      connected: false,
      status: 'Not connected',
      iconType: 'zapier',
      actionType: 'connect',
    },
    {
      id: 'framer',
      name: 'Framer',
      categoryGroup: 'DEPLOY CHANNELS & INTEGRATIONS',
      categoryLabel: 'Component',
      desc: 'Embed the chat assistant directly into any Framer website component.',
      badge: 'Component',
      connected: false,
      status: 'Not connected',
      iconType: 'framer',
      actionType: 'connect',
    },

    // 3. SCHEDULING & MEETINGS
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      categoryGroup: 'SCHEDULING & MEETINGS',
      categoryLabel: 'Productivity',
      desc: 'With Google Calendar, you can quickly schedule meetings from chat.',
      badge: 'Productivity',
      connected: false,
      status: 'Not connected',
      iconType: 'google_calendar',
      actionType: 'connect',
    },
    {
      id: 'outlook_calendar',
      name: 'Microsoft Outlook Calendar',
      categoryGroup: 'SCHEDULING & MEETINGS',
      categoryLabel: 'Productivity',
      desc: 'The calendar and scheduling component of Microsoft 365.',
      badge: 'Productivity',
      connected: false,
      status: 'Not connected',
      iconType: 'outlook',
      actionType: 'connect',
    },
    {
      id: 'zoom',
      name: 'Zoom',
      categoryGroup: 'SCHEDULING & MEETINGS',
      categoryLabel: 'Communication',
      desc: 'Zoom is the leader in modern enterprise video communications.',
      badge: 'Communication',
      connected: false,
      status: 'Not connected',
      iconType: 'zoom',
      actionType: 'connect',
    },
  ];

  const incomingTools = Array.isArray(agentState?.tools) ? agentState.tools : [];
  const initialTools = defaultAllTools.map(def => {
    const existing = incomingTools.find(pt => pt.id === def.id || pt.name === def.name);
    if (existing) {
      return {
        ...def,
        connected: existing.connected !== undefined ? existing.connected : def.connected,
        status: existing.status || (existing.connected ? 'Active' : 'Not connected'),
      };
    }
    return def;
  });

  // Active form edit states
  const [agentName, setAgentName] = useState(initialAgentName);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens);
  const [topP, setTopP] = useState(initialTopP);
  const [hyperparametersOpen, setHyperparametersOpen] = useState(false);
  const [availableModelsList, setAvailableModelsList] = useState(AVAILABLE_MODELS);
  const [systemPrompt, setSystemPrompt] = useState(initialPrompt);
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState(initialKbs);
  const [connectorTools, setConnectorTools] = useState(initialTools);
  const [showLeadCaptureModal, setShowLeadCaptureModal] = useState(false);
  const [leadCaptureConfig, setLeadCaptureConfig] = useState({
    title: "Let's connect",
    subtitle: 'Please leave your details and our team will get back to you shortly.',
    fields: {
      name: true,
      email: true,
      phone: true,
      note: true,
    },
  });

  const [currentWidgetSettings, setCurrentWidgetSettings] = useState(() => ({
    theme: agentState?.theme || 'Light',
    position: agentState?.position || 'Right',
    primary_color: agentState?.primary_color || '#7c3aed',
    primaryColor: agentState?.primary_color || '#7c3aed',
    greeting: agentState?.greeting || `Hello! I'm your ${agentState?.brand_name || 'SayanBot'} assistant. How can I help?`,
    display_name: agentState?.display_name || agentState?.brand_name || initialAgentName,
    placeholder: agentState?.placeholder || 'Type your message...',
    suggestions: agentState?.suggestions || ['What are your services?', 'Contact support'],
    agent_icon: agentState?.logo_url || agentState?.agent_icon || '/assets/agent-icons/agent-icon-1.jpg',
    widget_icon: agentState?.logo_url || agentState?.widget_icon || '/assets/agent-icons/agent-icon-1.jpg',
    hide_branding: agentState?.hide_branding || false,
    show_callouts: agentState?.show_callouts || false,
    ...agentState?.widget_settings,
  }));

  // Track saved baseline state to accurately determine when changes are made
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    name: initialAgentName,
    model: initialModel,
    prompt: initialPrompt,
    temperature: initialTemperature,
    maxTokens: initialMaxTokens,
    topP: initialTopP,
    kbsJson: JSON.stringify(initialKbs),
    toolsJson: JSON.stringify(initialTools),
    widgetSettingsJson: JSON.stringify(currentWidgetSettings),
  }));

  // Fetch available models from backend dynamically
  useEffect(() => {
    let mounted = true;
    fetchAvailableModels()
      .then((res) => {
        if (mounted && res?.models && Array.isArray(res.models) && res.models.length > 0) {
          setAvailableModelsList(res.models);
        }
      })
      .catch((err) => {
        console.debug('Fetch available models note:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync state when agentState prop is populated or updated asynchronously
  useEffect(() => {
    if (agentState && typeof agentState === 'object') {
      const pName = (typeof agentState.brand_name === 'string' && agentState.brand_name)
        || (typeof agentState.display_name === 'string' && agentState.display_name)
        || 'My Brand';
      const name = agentState.display_name || agentState.brand_name || `${pName} Assistant`;
      const model = agentState.model || 'Gemini 2.5 Flash';
      const temp = agentState.temperature !== undefined && agentState.temperature !== null ? Number(agentState.temperature) : 0.3;
      const mTokens = agentState.max_tokens || agentState.maxTokens || 512;
      const tP = agentState.top_p !== undefined && agentState.top_p !== null ? Number(agentState.top_p) : 0.9;
      const prompt = (typeof agentState.system_prompt === 'string' && agentState.system_prompt.includes('### Role'))
        ? agentState.system_prompt
        : (agentState.system_prompt || defaultPromptTemplate);
      const defaultKbs = [
        { id: `kb-${agentState.brand_id || agentState.agent_id || 'main'}`, name: `${pName.split(' ')[0] || 'My'} KB`, docCount: Array.isArray(agentState.knowledge_items) ? agentState.knowledge_items.length : 1, attached: true },
      ];

      setAgentName(name);
      setSelectedModel(model);
      setTemperature(temp);
      setMaxTokens(mTokens);
      setTopP(tP);
      setSystemPrompt(prompt);

      let syncedTools = defaultAllTools;
      const inTools = Array.isArray(agentState.tools) ? agentState.tools : [];
      if (inTools.length > 0) {
        syncedTools = defaultAllTools.map(def => {
          const existing = inTools.find(pt => pt.id === def.id || pt.name === def.name);
          if (existing) {
            return {
              ...def,
              connected: existing.connected !== undefined ? existing.connected : (existing.enabled !== undefined ? existing.enabled : def.connected),
              status: existing.status || (existing.connected || existing.enabled ? 'Active' : 'Not connected'),
            };
          }
          return def;
        });
      }
      setConnectorTools(syncedTools);

      const syncedWidget = {
        theme: agentState.theme || 'Light',
        position: agentState.position || 'Right',
        primary_color: agentState.primary_color || '#7c3aed',
        primaryColor: agentState.primary_color || '#7c3aed',
        greeting: agentState.greeting || `Hello! I'm your ${pName} assistant. How can I help?`,
        display_name: name,
        placeholder: agentState.placeholder || 'Type your message...',
        suggestions: Array.isArray(agentState.suggestions) ? agentState.suggestions : ['What are your services?', 'Contact support'],
        agent_icon: agentState.logo_url || agentState.agent_icon || '/assets/agent-icons/agent-icon-1.jpg',
        widget_icon: agentState.logo_url || agentState.widget_icon || '/assets/agent-icons/agent-icon-1.jpg',
        hide_branding: agentState.hide_branding || false,
        show_callouts: agentState.show_callouts || false,
        ...agentState.widget_settings,
      };
      setCurrentWidgetSettings(syncedWidget);

      // Store clean initial baseline with synced tools, hyperparameters, and widget settings
      setSavedBaseline({
        name,
        model,
        prompt,
        temperature: temp,
        maxTokens: mTokens,
        topP: tP,
        kbsJson: JSON.stringify(defaultKbs),
        toolsJson: JSON.stringify(syncedTools),
        widgetSettingsJson: JSON.stringify(syncedWidget),
      });

      // Fetch actual user knowledge bases from backend
      fetchKnowledgeBases().then(res => {
        const realKbs = res?.knowledge_bases || [];
        let finalKbs = defaultKbs;
        if (realKbs.length > 0) {
          finalKbs = realKbs.map(kb => {
            const ags = kb.agents_using || [];
            const curAgId = String(agentState.agent_id || agentState.id || "").replace("spbrand_", "");
            const curBrandId = String(agentState.brand_id || agentState.project_id || "");

            let isAttached = true;
            if (ags.length > 0) {
              isAttached = ags.some(a => {
                const cleanAId = String(a.id || a.agent_id || "").replace("spbrand_", "");
                return cleanAId === curAgId || a.brand_id === curBrandId;
              });
            } else if (kb.project_id || kb.brand_id) {
              isAttached = (kb.project_id === curBrandId || kb.brand_id === curBrandId);
            }

            return {
              id: kb.id || kb.kb_id,
              name: kb.name,
              docCount: kb.doc_count || (Array.isArray(kb.documents) ? kb.documents.length : 0),
              attached: isAttached,
              description: kb.description,
              project_name: kb.project_name,
            };
          });
        }
        setAvailableKnowledgeBases(finalKbs);
        setSavedBaseline(prev => prev ? { ...prev, kbsJson: JSON.stringify(finalKbs) } : prev);
      }).catch(err => {
        console.warn('Fetch real KBs notice:', err);
        setAvailableKnowledgeBases(defaultKbs);
        setSavedBaseline(prev => prev ? { ...prev, kbsJson: JSON.stringify(defaultKbs) } : prev);
      });
    }
  }, [agentState]);

  // Dynamic isDirty calculation: true ONLY when current state strictly differs from saved baseline
  const isDirty = useMemo(() => {
    if (!savedBaseline) return false;
    if (agentName.trim() !== savedBaseline.name.trim()) return true;
    if (selectedModel !== savedBaseline.model) return true;
    if (systemPrompt.trim() !== savedBaseline.prompt.trim()) return true;
    if (temperature !== savedBaseline.temperature) return true;
    if (maxTokens !== savedBaseline.maxTokens) return true;
    if (topP !== savedBaseline.topP) return true;
    if (JSON.stringify(availableKnowledgeBases) !== savedBaseline.kbsJson) return true;
    if (JSON.stringify(connectorTools) !== savedBaseline.toolsJson) return true;
    if (JSON.stringify(currentWidgetSettings) !== savedBaseline.widgetSettingsJson) return true;
    return false;
  }, [agentName, selectedModel, systemPrompt, temperature, maxTokens, topP, availableKnowledgeBases, connectorTools, currentWidgetSettings, savedBaseline]);

  // Raw vs formatted view mode for Instructions
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);

  // Custom Model Dropdown state
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const modelDropdownRef = useRef(null);

  // Close model dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save feedback state
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [promptNotice, setPromptNotice] = useState('');

  // Quota state for AI instruction generations (max 5 for normal/free users)
  const [aiQuota, setAiQuota] = useState(() => {
    try {
      const cached = localStorage.getItem('chatbook_ai_gen_quota');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { is_normal_user: true, used: 0, remaining: 5, max_allowed: 5, can_generate: true };
  });

  useEffect(() => {
    let mounted = true;
    fetchAiInstructionsQuota()
      .then((res) => {
        if (mounted && res?.quota) {
          setAiQuota(res.quota);
          try {
            localStorage.setItem('chatbook_ai_gen_quota', JSON.stringify(res.quota));
          } catch {}
        }
      })
      .catch((err) => {
        console.debug('Quota fetch note:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Widget settings
  const widgetSettings = agentState?.widget_settings || {
    theme: agentState?.theme || 'Light',
    position: agentState?.position || 'Right',
    primaryColor: agentState?.primary_color || '#6366f1',
    greeting: agentState?.greeting || 'Hello! How can I help you today?',
  };

  const handleToggleKb = (kbId) => {
    setAvailableKnowledgeBases(prev => prev.map(kb =>
      kb.id === kbId ? { ...kb, attached: !kb.attached } : kb
    ));
  };

  const handleToggleTool = (toolId) => {
    setConnectorTools(prev => prev.map(t =>
      t.id === toolId ? { ...t, connected: !t.connected, status: !t.connected ? 'Active' : 'Not connected' } : t
    ));
  };

  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    if (!systemPrompt) return;
    navigator.clipboard.writeText(systemPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleGeneratePromptWithAi = async () => {
    if (aiQuota?.is_normal_user && aiQuota?.remaining === 0) {
      const resetInfo = aiQuota?.reset_formatted ? ` (resets in ${aiQuota.reset_formatted})` : ' (resets in 24 hours)';
      setPromptNotice(`Limit reached: Free accounts are allowed 5 AI generations per 24 hours${resetInfo}. Please upgrade to Pro for unlimited access.`);
      setTimeout(() => setPromptNotice(''), 6000);
      return;
    }

    setGeneratingAi(true);
    setPromptNotice('');
    try {
      const docsSummary = (availableKnowledgeBases || [])
        .filter(kb => kb.attached !== false)
        .map(kb => `${kb.name}${kb.description ? `: ${kb.description}` : ''} (${kb.docCount || 0} documents)`)
        .join('\n');

      const res = await generateAgentInstructions({
        agent_name: agentName,
        agent_role: agentState?.role || 'Customer Support Specialist',
        brand_name: projectName || agentName,
        display_name: agentName,
        role: agentState?.role || 'Customer Support Specialist',
        tone: agentState?.tone || 'warm, concise, and confident',
        brand_description: agentState?.brand_description || agentState?.description || '',
        website_url: agentState?.url || agentState?.website_url || '',
        project_id: agentState?.project_id || agentState?.brand_id || '',
        agent_id: agentState?.agent_id || agentState?.id || agentId || '',
        knowledge_items: agentState?.knowledge_items || [],
        company_documents: docsSummary,
        documents_summary: docsSummary,
      });

      if (res?.quota) {
        setAiQuota(res.quota);
        try {
          localStorage.setItem('chatbook_ai_gen_quota', JSON.stringify(res.quota));
        } catch {}
      }

      if (res && (res.system_prompt || res.instructions)) {
        setSystemPrompt(res.system_prompt || res.instructions);
        const remMsg = res.quota?.is_normal_user && res.quota?.remaining !== null && res.quota?.remaining !== undefined
          ? ` (${res.quota.remaining}/5 left)`
          : '';
        setPromptNotice(`Instructions generated successfully${remMsg}`);
        setTimeout(() => setPromptNotice(''), 4000);
      }
    } catch (err) {
      console.warn('AI Prompt generation notice:', err);
      const errMsg = err?.message || err?.detail || 'Failed to generate instructions.';
      setPromptNotice(errMsg.includes('limit') ? errMsg : 'Failed to generate instructions. Please check network/API key.');
      setTimeout(() => setPromptNotice(''), 5000);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveAll = () => {
    setSaving(true);
    const resolvedAgentId = agentState?.agent_id || agentState?.id || agentId || 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362';
    const cleanAgentUuid = String(resolvedAgentId).replace('spbrand_', '').replace('skbrand_', '').replace('draft-', '');

    const updatedWidget = {
      ...currentWidgetSettings,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      model: selectedModel,
    };

    const updatedPayload = {
      ...agentState,
      agent_id: resolvedAgentId,
      id: cleanAgentUuid,
      display_name: agentName,
      brand_name: agentName,
      model: selectedModel,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      system_prompt: systemPrompt,
      knowledge_bases: availableKnowledgeBases,
      tools: connectorTools,
      widget_settings: updatedWidget,
      primary_color: currentWidgetSettings.primary_color,
      theme: currentWidgetSettings.theme,
      position: currentWidgetSettings.position,
      greeting: currentWidgetSettings.greeting,
      logo_url: currentWidgetSettings.agent_icon || currentWidgetSettings.logo_url || agentState?.logo_url,
    };

    // Instant UI update (0ms response time)
    if (onUpdateAgentState) onUpdateAgentState(updatedPayload);
    setSavedBaseline({
      name: agentName,
      model: selectedModel,
      prompt: systemPrompt,
      temperature: temperature,
      maxTokens: maxTokens,
      topP: topP,
      kbsJson: JSON.stringify(availableKnowledgeBases),
      toolsJson: JSON.stringify(connectorTools),
      widgetSettingsJson: JSON.stringify(updatedWidget),
    });
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    // Asynchronous background persistence to database
    saveAgentBrandConfig(updatedPayload, resolvedAgentId).catch(err => {
      console.warn('Save brand config notice:', err);
    });
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to trigger save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty && !saving) {
          handleSaveAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, saving, agentName, selectedModel, systemPrompt, temperature, maxTokens, topP, availableKnowledgeBases, connectorTools, widgetSettings]);

  // Find currently selected model object
  const currentModelObj = availableModelsList.find(m => m.name === selectedModel || m.id === selectedModel) || availableModelsList[0] || AVAILABLE_MODELS[0];

  // Filtered models for dropdown
  const filteredModels = availableModelsList.filter(m => {
    const q = modelSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.provider && m.provider.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const panelBg = isDark ? '#0e0e14' : '#ffffff';

  const hasActiveKb = availableKnowledgeBases.some(k => k.attached);
  const hasActiveTools = connectorTools.some(t => t.connected);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      color: isDark ? '#ffffff' : '#0f172a',
    }}>
      {/* 1. Left / Center Canvas Area */}
      <div style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        backgroundColor: isDark ? '#0a0a10' : '#f8fafc',
        backgroundImage: isDark
          ? 'radial-gradient(circle, rgba(255, 255, 255, 0.32) 1.05px, transparent 1.05px)'
          : 'radial-gradient(circle, rgba(15, 23, 42, 0.22) 1.05px, transparent 1.05px)',
        backgroundSize: '24px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Scoped Canvas & Workflow Animations */}
        <style>{`
          @keyframes agentBreathingGlow {
            0%, 100% {
              box-shadow: 0 8px 30px rgba(124, 58, 237, 0.22);
              border-color: ${openSection === 'config' ? '#a855f7' : (isDark ? 'rgba(124, 58, 237, 0.45)' : '#a5b4fc')};
            }
            50% {
              box-shadow: 0 8px 38px rgba(124, 58, 237, 0.38);
              border-color: ${openSection === 'config' ? '#c084fc' : (isDark ? 'rgba(168, 85, 247, 0.7)' : '#818cf8')};
            }
          }
          @keyframes statusDotPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.75; }
          }
          @media (prefers-reduced-motion: reduce) {
            .workflow-animated-agent,
            .workflow-status-dot,
            .workflow-flow-dot {
              animation: none !important;
              transition: none !important;
            }
          }
          .studio-drawer-scroll {
            scrollbar-width: thin;
            scrollbar-color: ${isDark ? 'rgba(124, 58, 237, 0.3) transparent' : 'rgba(124, 58, 237, 0.2) transparent'};
          }
          .studio-drawer-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .studio-drawer-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .studio-drawer-scroll::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.22)'};
            border-radius: 999px;
            transition: background 0.2s ease;
          }
          .studio-drawer-scroll::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(124, 58, 237, 0.6)' : 'rgba(124, 58, 237, 0.5)'};
          }
        `}</style>

        {/* Top-Left: Customize Widget Button */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '1.5rem', zIndex: 10 }}>
          <button
            onClick={() => setShowCustomizeModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: isDark ? 'rgba(22,22,34,0.9)' : '#ffffff',
              border: `1px solid ${borderColor}`,
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '0.55rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: isDark ? '#ffffff' : '#0f172a',
              cursor: 'pointer',
              boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = borderColor;
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Sparkles size={15} color="#8b5cf6" />
            <span>Customize Widget</span>
          </button>
        </div>

        {/* Top-Right: Canvas Status & Zoom Viewport Controls */}
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: isDark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            backdropFilter: 'blur(8px)',
            borderRadius: '9px',
            padding: '0.45rem 0.8rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: isDark ? 'rgba(255,255,255,0.75)' : '#475569',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <span
              className="workflow-status-dot"
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16,185,129,0.8)',
                display: 'inline-block',
                animation: 'statusDotPulse 2.4s ease-in-out infinite',
              }}
            />
            <span>Workflow Active</span>
          </div>

          {/* Zoom Controller */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: isDark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            backdropFilter: 'blur(8px)',
            borderRadius: '9px',
            padding: '2px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#fff' : '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : '#64748b'; }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isDark ? 'rgba(255,255,255,0.8)' : '#334155',
              padding: '0 0.4rem',
              minWidth: '38px',
              textAlign: 'center',
            }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#fff' : '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : '#64748b'; }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleZoomReset}
              title="Reset View"
              style={{
                background: 'none',
                borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                padding: '0.35rem 0.5rem',
                borderRadius: '0 6px 6px 0',
                color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#fff' : '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : '#64748b'; }}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Scalable Viewport with Interactive Visual Node Diagram */}
        <div style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          userSelect: 'none',
          zIndex: 2,
        }}>
          {/* Shared SVG Marker Definitions */}
          <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow-down-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
              </marker>
              <marker id="arrow-right-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-right-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
              </marker>
              <marker id="arrow-right-muted" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={isDark ? 'rgba(255,255,255,0.25)' : '#94a3b8'} />
              </marker>
            </defs>
          </svg>

          {/* 1. TOP: Trigger Node */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              onClick={() => handleToggleSection('config')}
              title="Click to manage Trigger & Inbound Channels"
              style={{
                background: isDark ? '#151522' : '#ffffff',
                border: openSection === 'config'
                  ? '1.5px solid #8b5cf6'
                  : `1.5px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#c7d2fe'}`,
                borderRadius: '14px',
                padding: '0.7rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                boxShadow: openSection === 'config'
                  ? '0 0 0 3px rgba(139,92,246,0.2), 0 8px 24px rgba(0,0,0,0.3)'
                  : (isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 16px rgba(99,102,241,0.08)'),
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = openSection === 'config' ? '#8b5cf6' : (isDark ? 'rgba(139,92,246,0.3)' : '#c7d2fe');
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: isDark ? 'rgba(139,92,246,0.16)' : '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
                flexShrink: 0,
              }}>
                <MessageSquare size={17} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#a78bfa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                }}>
                  TRIGGER
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.25 }}>
                  Chat & API
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
                border: `1px solid ${isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0'}`,
                padding: '2px 8px',
                borderRadius: '6px',
                color: '#10b981',
                marginLeft: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <span
                  className="workflow-status-dot"
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'statusDotPulse 2.4s ease-in-out infinite',
                  }}
                />
                Active
              </span>
            </div>

            {/* Bottom Output Port on Trigger */}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#8b5cf6',
              border: `2px solid ${isDark ? '#151522' : '#ffffff'}`,
              boxShadow: '0 0 8px rgba(139,92,246,0.7)',
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 4,
            }} />
          </div>

          {/* Vertical Connector Pipe with SVG Arrow from Trigger to Agent */}
          <div style={{ width: '2px', height: '48px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <svg width="24" height="48" style={{ overflow: 'visible' }}>
              <line
                x1="12"
                y1="0"
                x2="12"
                y2="42"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                markerEnd="url(#arrow-down-purple)"
                style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease, opacity 0.35s ease' }}
              />
              {/* Animated Flow Dot: Trigger -> Agent */}
              <circle cx="12" cy="20" r="2.5" fill="#c4b5fd" className="workflow-flow-dot">
                <animate attributeName="cy" values="4;38;4" dur="2.4s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* 2. MIDDLE ROW: Knowledge Node + Center Agent Node + Lead Capture / Tools Node */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>

            {/* Left: Knowledge Base Card Node */}
            <div
              onClick={() => handleToggleSection('knowledge')}
              title="Click to configure Knowledge Bases"
              style={{
                background: isDark ? '#12161a' : '#ffffff',
                border: openSection === 'knowledge'
                  ? '1.5px solid #10b981'
                  : `1.5px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}`,
                borderRadius: '14px',
                padding: '0.8rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: openSection === 'knowledge'
                  ? '0 0 0 3px rgba(16,185,129,0.2), 0 8px 24px rgba(0,0,0,0.3)'
                  : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(16,185,129,0.08)'),
                cursor: 'pointer',
                position: 'relative',
                minWidth: '200px',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = openSection === 'knowledge' ? '#10b981' : (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0');
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Database size={17} color="#10b981" />
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                }}>
                  KNOWLEDGE
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
                  Knowledge Base
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: hasActiveKb ? '#10b981' : (isDark ? 'rgba(255,255,255,0.45)' : '#64748b'),
                  fontWeight: 600,
                  marginTop: '2px',
                  transition: 'color 0.25s ease',
                }}>
                  {availableKnowledgeBases.filter(k => k.attached).length} KB connected
                </div>
              </div>

              {/* Right Output Port Handle on Knowledge Card */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: hasActiveKb ? '#10b981' : (isDark ? '#272738' : '#cbd5e1'),
                border: `2px solid ${isDark ? '#12161a' : '#ffffff'}`,
                boxShadow: hasActiveKb ? '0 0 8px rgba(16,185,129,0.7)' : 'none',
                position: 'absolute',
                right: '-5px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 4,
                transition: 'background 0.35s ease, box-shadow 0.35s ease',
              }} />
            </div>

            {/* Horizontal Connector Bridge (Left -> Center) */}
            <div style={{ width: '46px', height: '2px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="46" height="16" style={{ overflow: 'visible' }}>
                <line
                  x1="0"
                  y1="8"
                  x2="42"
                  y2="8"
                  stroke={hasActiveKb ? '#10b981' : (isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1')}
                  strokeWidth={hasActiveKb ? '2.5' : '1.5'}
                  strokeDasharray={hasActiveKb ? 'none' : '4 4'}
                  opacity={hasActiveKb ? 1 : 0.6}
                  markerEnd={hasActiveKb ? 'url(#arrow-right-green)' : 'url(#arrow-right-muted)'}
                  style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease, opacity 0.35s ease' }}
                />
                {/* Animated pulse dot: Knowledge -> Agent (Active when KB connected) */}
                {hasActiveKb && (
                  <circle cx="20" cy="8" r="2.5" fill="#a7f3d0" className="workflow-flow-dot">
                    <animate attributeName="cx" values="4;38;4" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>

            {/* Center AI Agent Node (Primary Focal Point) */}
            <div
              onClick={() => handleToggleSection('config')}
              title="Click to configure Agent"
              className="workflow-animated-agent"
              style={{
                background: isDark ? '#161624' : '#ffffff',
                border: openSection === 'config'
                  ? '2px solid #a855f7'
                  : `2px solid ${isDark ? '#7c3aed' : '#818cf8'}`,
                borderRadius: '16px',
                padding: '1rem 1.25rem 0.75rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.7rem',
                boxShadow: openSection === 'config'
                  ? '0 0 0 4px rgba(168,85,247,0.22), 0 12px 32px rgba(124,58,237,0.35)'
                  : (isDark ? '0 8px 30px rgba(124,58,237,0.25)' : '0 8px 24px rgba(99,102,241,0.12)'),
                minWidth: '260px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
                animation: 'agentBreathingGlow 4.5s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Top Input Port Handle (receiving Trigger) */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#8b5cf6',
                border: `2px solid ${isDark ? '#161624' : '#ffffff'}`,
                boxShadow: '0 0 8px rgba(139,92,246,0.7)',
                position: 'absolute',
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 4,
              }} />

              {/* Top Area: Avatar + Name + Subtitle + Live Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {agentState?.logo_url ? (
                  <img
                    src={agentState.logo_url}
                    alt=""
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                  }}>
                    <Bot size={22} />
                  </div>
                )}
                <div style={{ overflow: 'hidden', textAlign: 'left', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <div style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: isDark ? '#ffffff' : '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {agentName}
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#10b981',
                      background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
                      padding: '1px 6px',
                      borderRadius: '5px',
                    }}>
                      <span
                        className="workflow-status-dot"
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: '#10b981',
                          animation: 'statusDotPulse 2.4s ease-in-out infinite',
                        }}
                      />
                      Ready
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '1px' }}>
                    AI Agent Engine
                  </div>
                </div>
              </div>

              {/* Model Pill Badge with Provider Info */}
              <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.7rem',
                  color: isDark ? '#c4b5fd' : '#4f46e5',
                  background: isDark ? 'rgba(124,58,237,0.14)' : '#ede9fe',
                  border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : '#ddd6fe'}`,
                  padding: '2px 9px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <Cpu size={11} color="#8b5cf6" />
                  {selectedModel}
                </span>
                <span style={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                  {currentModelObj?.provider || 'Reasoning'}
                </span>
              </div>

              {/* Bottom Row Divider & Slotted Footer */}
              <div style={{
                display: 'flex',
                width: '100%',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
                paddingTop: '0.55rem',
                marginTop: '0.15rem',
                gap: '0.5rem',
                position: 'relative',
              }}>
                {/* Left Port Handle on Agent Card (receiving Knowledge) */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: hasActiveKb ? '#10b981' : (isDark ? '#272738' : '#cbd5e1'),
                  border: `2px solid ${isDark ? '#161624' : '#ffffff'}`,
                  boxShadow: hasActiveKb ? '0 0 8px rgba(16,185,129,0.7)' : 'none',
                  position: 'absolute',
                  left: '-17px',
                  bottom: '12px',
                  zIndex: 4,
                  transition: 'background 0.35s ease, box-shadow 0.35s ease',
                }} />

                {/* Right Port Handle on Agent Card (output to Connectors) */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: hasActiveTools ? '#a855f7' : (isDark ? '#272738' : '#cbd5e1'),
                  border: `2px solid ${isDark ? '#161624' : '#ffffff'}`,
                  boxShadow: hasActiveTools ? '0 0 8px rgba(168,85,247,0.7)' : 'none',
                  position: 'absolute',
                  right: '-17px',
                  bottom: '12px',
                  zIndex: 4,
                  transition: 'background 0.35s ease, box-shadow 0.35s ease',
                }} />

                {/* Left Slot: Knowledge */}
                <div
                  onClick={(e) => { e.stopPropagation(); setOpenSection('knowledge'); scrollToSection('knowledge'); }}
                  style={{
                    flex: 1,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: `1px solid ${openSection === 'knowledge' ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0')}`,
                    borderRadius: '8px',
                    padding: '0.4rem 0.55rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = openSection === 'knowledge' ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'); }}
                >
                  <Database size={13} color="#10b981" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Knowledge</div>
                    <div style={{ fontSize: '0.64rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
                      {availableKnowledgeBases.filter(k => k.attached).length} KB
                    </div>
                  </div>
                </div>

                {/* Right Slot: Connectors */}
                <div
                  onClick={(e) => { e.stopPropagation(); setOpenSection('tools'); scrollToSection('tools'); }}
                  style={{
                    flex: 1,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: `1px solid ${openSection === 'tools' ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0')}`,
                    borderRadius: '8px',
                    padding: '0.4rem 0.55rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = openSection === 'tools' ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'); }}
                >
                  <LinkIcon size={13} color="#a855f7" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>Connectors</div>
                    <div style={{ fontSize: '0.64rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
                      {connectorTools.filter(t => t.connected).length} Tools
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Connector Bridge (Center -> Right) */}
            <div style={{ width: '46px', height: '2px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="46" height="16" style={{ overflow: 'visible' }}>
                <line
                  x1="0"
                  y1="8"
                  x2="42"
                  y2="8"
                  stroke={hasActiveTools ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1')}
                  strokeWidth={hasActiveTools ? '2.5' : '1.5'}
                  strokeDasharray={hasActiveTools ? 'none' : '4 4'}
                  opacity={hasActiveTools ? 1 : 0.6}
                  markerEnd={hasActiveTools ? 'url(#arrow-right-purple)' : 'url(#arrow-right-muted)'}
                  style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease, opacity 0.35s ease' }}
                />
                {/* Animated pulse dot: Agent -> Tools (Active when tools connected) */}
                {hasActiveTools && (
                  <circle cx="20" cy="8" r="2.5" fill="#d8b4fe" className="workflow-flow-dot">
                    <animate attributeName="cx" values="4;38;4" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>

            {/* Right: Lead Capture / Connector Card Node */}
            <div
              onClick={() => handleToggleSection('tools')}
              title="Click to configure Connectors & Tools"
              style={{
                background: isDark ? '#161220' : '#ffffff',
                border: openSection === 'tools'
                  ? '1.5px solid #a855f7'
                  : `1.5px solid ${isDark ? 'rgba(168,85,247,0.3)' : '#ddd6fe'}`,
                borderRadius: '14px',
                padding: '0.8rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: openSection === 'tools'
                  ? '0 0 0 3px rgba(168,85,247,0.2), 0 8px 24px rgba(0,0,0,0.3)'
                  : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(168,85,247,0.08)'),
                cursor: 'pointer',
                position: 'relative',
                minWidth: '200px',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = openSection === 'tools' ? '#a855f7' : (isDark ? 'rgba(168,85,247,0.3)' : '#ddd6fe');
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Left Input Port Handle on Lead Capture Card */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: hasActiveTools ? '#a855f7' : (isDark ? '#272738' : '#cbd5e1'),
                border: `2px solid ${isDark ? '#161220' : '#ffffff'}`,
                boxShadow: hasActiveTools ? '0 0 8px rgba(168,85,247,0.7)' : 'none',
                position: 'absolute',
                left: '-5px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 4,
                transition: 'background 0.35s ease, box-shadow 0.35s ease',
              }} />

              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sliders size={17} color="#a855f7" />
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#c084fc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                }}>
                  CONNECTORS
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
                  Tools & Actions
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: hasActiveTools ? '#10b981' : (isDark ? 'rgba(255,255,255,0.45)' : '#64748b'),
                  fontWeight: 600,
                  marginTop: '2px',
                  transition: 'color 0.25s ease',
                }}>
                  {connectorTools.filter(t => t.connected).length} active
                </div>
              </div>

              {/* Disconnect X Button if Lead Capture enabled */}
              {connectorTools.some(t => t.id === 'lead_capture' && t.connected) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTool('lead_capture');
                  }}
                  title="Disconnect Lead Capture"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                    marginLeft: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'; }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 2. Right Settings Drawer Panel */}
      <div style={{
        width: '480px',
        flexShrink: 0,
        borderLeft: `1px solid ${borderColor}`,
        background: panelBg,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Header Bar — Sticky so Save is always accessible */}
        <div style={{
          padding: '1rem 1.4rem',
          borderBottom: `1px solid ${hasScrolled ? (isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)') : borderColor}`,
          boxShadow: hasScrolled ? (isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.06)') : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: panelBg,
          backdropFilter: 'blur(12px)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            {/* Agent Avatar */}
            {agentState?.logo_url ? (
              <img
                src={agentState.logo_url}
                alt=""
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                }}
              />
            ) : (
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: isDark ? 'rgba(124,58,237,0.15)' : '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={18} color="#7c3aed" />
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {agentName || 'Agent Settings'}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.72rem',
                color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',
              }}>
                Edit agent configuration
              </p>
            </div>
          </div>

          <button
            onClick={isDirty && !saving ? handleSaveAll : undefined}
            disabled={!isDirty || saving}
            title={isDirty ? 'Save changes (Ctrl+S)' : 'No unsaved changes'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: savedSuccess
                ? '#10b981'
                : isDirty
                  ? '#7c3aed'
                  : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
              color: savedSuccess || isDirty
                ? '#ffffff'
                : (isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'),
              border: savedSuccess || isDirty
                ? 'none'
                : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '0.5rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
              boxShadow: isDirty && !saving ? '0 2px 10px rgba(124,58,237,0.35)' : 'none',
              opacity: isDirty || savedSuccess ? 1 : 0.65,
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {saving ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : savedSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? 'Saving…' : savedSuccess ? 'Saved!' : 'Save'}</span>
          </button>
        </div>

        {/* Sticky Section Tab Switcher — One Section One View */}
        <div style={{
          padding: '0.5rem 1.25rem',
          borderBottom: `1px solid ${borderColor}`,
          background: isDark ? 'rgba(18, 18, 26, 0.95)' : '#f8fafc',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          zIndex: 15,
          flexShrink: 0,
        }}>
          {[
            { id: 'config', label: 'Agent Config', icon: Sliders, color: '#3b82f6' },
            { id: 'knowledge', label: 'Knowledge', icon: Database, color: '#10b981', badge: availableKnowledgeBases.filter(k => k.attached).length },
            { id: 'tools', label: 'Tools', icon: LinkIcon, color: '#a855f7', badge: connectorTools.filter(t => t.connected).length },
          ].map((tab) => {
            const isActive = openSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleToggleSection(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.42rem 0.65rem',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? (isDark ? 'rgba(124,58,237,0.5)' : '#c4b5fd') : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0')}`,
                  background: isActive
                    ? (isDark ? 'rgba(124,58,237,0.22)' : '#ede9fe')
                    : (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'),
                  color: isActive ? (isDark ? '#ffffff' : '#6d28d9') : (isDark ? 'rgba(255,255,255,0.6)' : '#64748b'),
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flex: 1,
                  justifyContent: 'center',
                  boxShadow: isActive ? (isDark ? '0 2px 10px rgba(124,58,237,0.25)' : '0 2px 8px rgba(124,58,237,0.12)') : 'none',
                }}
              >
                <Icon size={13} color={isActive ? (isDark ? '#c084fc' : '#7c3aed') : tab.color} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span style={{
                    fontSize: '0.64rem',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: isActive ? (isDark ? 'rgba(124,58,237,0.45)' : '#ddd6fe') : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                    color: isActive ? (isDark ? '#f3e8ff' : '#5b21b6') : 'inherit',
                    fontWeight: 700,
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active View Container — One Section One View */}
        <div
          ref={drawerScrollRef}
          className="studio-drawer-scroll"
          onScroll={(e) => {
            const top = e.currentTarget.scrollTop;
            setHasScrolled(top > 12);
            setShowScrollTop(top > 200);
          }}
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
            padding: '1.25rem 1.4rem 5rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative',
          }}
        >
          {/* View 1: Agent Configuration */}
          {openSection === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Agent Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b', marginBottom: '0.35rem' }}>
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAgentName(val);
                      setCurrentWidgetSettings(prev => ({ ...prev, display_name: val }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '7px',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#14141d' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Custom Model Selector (Matching Design Reference) */}
                <div style={{ position: 'relative', zIndex: modelDropdownOpen ? 60 : 1 }} ref={modelDropdownRef}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b', marginBottom: '0.35rem' }}>
                    Model
                  </label>

                  {/* Trigger Button */}
                  <div
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: `1px solid ${modelDropdownOpen ? '#7c3aed' : borderColor}`,
                      background: isDark ? '#14141d' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                      <ModelProviderLogo type={currentModelObj.icon} size={22} />
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.2 }}>{currentModelObj.name}</span>
                        <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>{currentModelObj.description}</span>
                      </div>
                    </div>
                    <ChevronDown size={16} style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', transform: modelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
                  </div>

                  {/* Floating Custom Dropdown Menu */}
                  {modelDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: isDark ? '#161622' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                      borderRadius: '12px',
                      boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.65)' : '0 12px 30px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      {/* Search Bar at Top */}
                      <div style={{
                        padding: '0.65rem 0.75rem',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: isDark ? '#12121a' : '#f8fafc',
                      }}>
                        <Search size={15} color={isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8'} />
                        <input
                          type="text"
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="Search model..."
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.84rem',
                          }}
                        />
                      </div>

                      {/* Scrollable Model List */}
                      <div style={{
                        maxHeight: '260px',
                        overflowY: 'auto',
                        padding: '0.4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}>
                        {filteredModels.map((m) => {
                          const isSelected = selectedModel === m.name;
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                if (!m.locked) {
                                  setSelectedModel(m.name);
                                  setModelDropdownOpen(false);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.65rem',
                                borderRadius: '8px',
                                background: isSelected
                                  ? (isDark ? 'rgba(124,58,237,0.15)' : '#f3e8ff')
                                  : 'transparent',
                                cursor: m.locked ? 'not-allowed' : 'pointer',
                                opacity: m.locked ? 0.7 : 1,
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                                <ModelProviderLogo type={m.icon} size={26} />
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {m.locked && <Lock size={13} color={isDark ? '#94a3b8' : '#64748b'} />}
                                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                                      {m.name}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.description}
                                  </span>
                                </div>
                              </div>

                              {/* Selected Checkmark or Requires Scale Badge */}
                              <div style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                                {isSelected ? (
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    background: '#7c3aed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    boxShadow: '0 2px 6px rgba(124,58,237,0.4)',
                                  }}>
                                    <Check size={13} strokeWidth={3} />
                                  </div>
                                ) : m.locked ? (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#f59e0b',
                                    background: 'rgba(245,158,11,0.12)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    padding: '2px 7px',
                                    borderRadius: '999px',
                                  }}>
                                    {m.badge}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}

                        {filteredModels.length === 0 && (
                          <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8' }}>
                            No matching models found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hyperparameters Controls: Collapsible Card with Live Badge */}
                <div style={{
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}>
                  {/* Header / Toggle Row */}
                  <div
                    onClick={() => setHyperparametersOpen(!hyperparametersOpen)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: hyperparametersOpen
                        ? (isDark ? 'rgba(255,255,255,0.035)' : '#f1f5f9')
                        : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                      <Sliders size={13} color="#8b5cf6" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                        Hyperparameters
                      </span>
                      {/* Live summary badge */}
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isDark ? 'rgba(139,92,246,0.15)' : '#ede9fe',
                        color: isDark ? '#c4b5fd' : '#7c3aed',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                      }}>
                        T: {Number(temperature).toFixed(2)} • {maxTokens} tok • P: {Number(topP).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {hyperparametersOpen && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemperature(0.3);
                            setMaxTokens(512);
                            setTopP(0.9);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: isDark ? '#a78bfa' : '#7c3aed',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Reset to default values (Temperature: 0.3, Max Tokens: 512, Top P: 0.9)"
                        >
                          Reset
                        </button>
                      )}
                      <ChevronDown
                        size={15}
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',
                          transform: hyperparametersOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </div>

                  {/* Collapsible Sliders */}
                  {hyperparametersOpen && (
                    <div style={{
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                    }}>
                      {/* Temperature */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.75)' : '#475569' }}>
                            Temperature
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDark ? 'rgba(139,92,246,0.18)' : '#ede9fe',
                            color: isDark ? '#c4b5fd' : '#6d28d9',
                            fontFamily: 'monospace',
                          }}>
                            {Number(temperature).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          style={{
                            width: '100%',
                            accentColor: '#8b5cf6',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', marginTop: '2px' }}>
                          Controls randomness & creativity (0.0 = deterministic, 1.0 = creative)
                        </div>
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.75)' : '#475569' }}>
                            Max Tokens
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDark ? 'rgba(59,130,246,0.18)' : '#e0f2fe',
                            color: isDark ? '#93c5fd' : '#0369a1',
                            fontFamily: 'monospace',
                          }}>
                            {maxTokens}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="128"
                          max="4096"
                          step="64"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                          style={{
                            width: '100%',
                            accentColor: '#3b82f6',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', marginTop: '2px' }}>
                          Maximum response length (1 token ≈ 4 characters)
                        </div>
                      </div>

                      {/* Top P */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.75)' : '#475569' }}>
                            Top P
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDark ? 'rgba(16,185,129,0.18)' : '#d1fae5',
                            color: isDark ? '#6ee7b7' : '#047857',
                            fontFamily: 'monospace',
                          }}>
                            {Number(topP).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={topP}
                          onChange={(e) => setTopP(parseFloat(e.target.value))}
                          style={{
                            width: '100%',
                            accentColor: '#10b981',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', marginTop: '2px' }}>
                          Nucleus sampling: cumulative probability threshold
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions / Prompt Editor */}
                <div>
                  {/* Row 1: Label + char count on left, Edit/Preview + Copy on right */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.45rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.75)' : '#475569' }}>
                        Instructions
                      </label>
                      <span style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                        • {systemPrompt.length.toLocaleString()} chars
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Edit / Preview tab pills */}
                      <div style={{
                        display: 'flex',
                        background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        borderRadius: '6px',
                        padding: '2px',
                      }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrompt(false)}
                          style={{
                            background: !isEditingPrompt ? (isDark ? 'rgba(124,58,237,0.25)' : '#ede9fe') : 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '3px 9px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: !isEditingPrompt ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.5)' : '#64748b'),
                            cursor: 'pointer',
                          }}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrompt(true)}
                          style={{
                            background: isEditingPrompt ? (isDark ? 'rgba(124,58,237,0.25)' : '#ede9fe') : 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '3px 9px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isEditingPrompt ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.5)' : '#64748b'),
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {/* Copy Prompt button */}
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        title="Copy instructions to clipboard"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: copiedPrompt ? '#10b981' : (isDark ? 'rgba(255,255,255,0.7)' : '#64748b'),
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {copiedPrompt ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Full-width Generate with AI Action Bar */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleGeneratePromptWithAi}
                      disabled={generatingAi || (aiQuota?.is_normal_user && aiQuota?.remaining === 0)}
                      title={
                        aiQuota?.is_normal_user && aiQuota?.remaining === 0
                          ? `Limit reached: 5 of 5 generations used in this 24-hour cycle. Resets in ${aiQuota?.reset_formatted || '24 hours'}.`
                          : (aiQuota?.is_normal_user ? `Free tier: ${aiQuota.remaining}/5 generations remaining (refreshes every 24 hours)` : undefined)
                      }
                      style={{
                        width: '100%',
                        background: (aiQuota?.is_normal_user && aiQuota?.remaining === 0)
                          ? (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9')
                          : (isDark ? 'rgba(124,58,237,0.14)' : '#ede9fe'),
                        border: `1px solid ${
                          (aiQuota?.is_normal_user && aiQuota?.remaining === 0)
                            ? (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')
                            : (isDark ? 'rgba(124,58,237,0.35)' : '#c4b5fd')
                        }`,
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: (aiQuota?.is_normal_user && aiQuota?.remaining === 0)
                          ? (isDark ? '#94a3b8' : '#64748b')
                          : '#a855f7',
                        cursor: (generatingAi || (aiQuota?.is_normal_user && aiQuota?.remaining === 0)) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease',
                        opacity: (aiQuota?.is_normal_user && aiQuota?.remaining === 0) ? 0.75 : 1,
                        boxSizing: 'border-box',
                      }}
                    >
                      {generatingAi ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Generating instructions with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>
                            {aiQuota?.is_normal_user
                              ? (aiQuota?.remaining === 0
                                  ? `Limit reached (0/5 • resets in ${aiQuota?.reset_formatted || '24h'})`
                                  : `Generate with AI (${aiQuota.remaining}/5 daily left)`)
                              : 'Generate with AI'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {promptNotice && !generatingAi && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: promptNotice.toLowerCase().includes('failed') || promptNotice.toLowerCase().includes('limit') ? '#ef4444' : '#10b981',
                      background: promptNotice.toLowerCase().includes('failed') || promptNotice.toLowerCase().includes('limit') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${promptNotice.toLowerCase().includes('failed') || promptNotice.toLowerCase().includes('limit') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                      borderRadius: '6px',
                      padding: '4px 9px',
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}>
                      {promptNotice.toLowerCase().includes('failed') || promptNotice.toLowerCase().includes('limit') ? <HelpCircle size={12} /> : <Check size={12} />}
                      <span>{promptNotice}</span>
                    </div>
                  )}

                  {isEditingPrompt ? (
                    <textarea
                      rows={8}
                      autoFocus
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Enter system instructions..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        borderRadius: '8px',
                        border: `1.5px solid #7c3aed`,
                        background: isDark ? '#14141d' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: '0.8rem',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        lineHeight: 1.45,
                        boxSizing: 'border-box',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => setIsEditingPrompt(true)}
                        title="Click to edit instructions"
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '8px',
                          border: `1px solid ${borderColor}`,
                          background: isDark ? '#14141d' : '#ffffff',
                          maxHeight: promptExpanded ? '480px' : '170px',
                          overflowY: 'auto',
                          boxSizing: 'border-box',
                          cursor: 'text',
                          transition: 'max-height 0.3s ease, border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = isDark ? 'rgba(124,58,237,0.5)' : '#a78bfa'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = borderColor}
                      >
                        {renderFormattedPrompt(systemPrompt, isDark)}
                      </div>

                      {/* Pencil edit overlay hint */}
                      <div
                        onClick={() => setIsEditingPrompt(true)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: isDark ? 'rgba(124,58,237,0.2)' : '#ede9fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                        title="Edit instructions"
                      >
                        <Wand2 size={13} color="#a855f7" />
                      </div>
                    </div>
                  )}

                  {/* Footer: char count + Show more/less */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                      {systemPrompt.length.toLocaleString()} characters
                    </span>
                    {!isEditingPrompt && systemPrompt.length > 400 && (
                      <button
                        onClick={() => setPromptExpanded(!promptExpanded)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#a855f7',
                          cursor: 'pointer',
                        }}
                      >
                        {promptExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* View 2: Knowledge Bases (One Section One View) */}
          {openSection === 'knowledge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
                border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#bbf7d0'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Database size={16} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Knowledge Bases
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                      Select knowledge bases attached to this agent
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: isDark ? 'rgba(16,185,129,0.18)' : '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}>
                  {availableKnowledgeBases.filter(k => k.attached).length} attached
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {availableKnowledgeBases.map(kb => (
                  <div
                    key={kb.id}
                    onClick={() => handleToggleKb(kb.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      background: isDark ? '#14141d' : '#ffffff',
                      border: `1px solid ${kb.attached ? (isDark ? 'rgba(16,185,129,0.45)' : '#86efac') : borderColor}`,
                      boxShadow: kb.attached ? (isDark ? '0 2px 10px rgba(16,185,129,0.1)' : '0 2px 8px rgba(16,185,129,0.06)') : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {kb.attached ? <CheckSquare size={17} color="#10b981" /> : <Square size={17} color={isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8'} />}
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>{kb.name}</div>
                        <div style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
                          {kb.docCount} documents indexed
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View 3: Tools & Connectors (One Section One View) */}
          {openSection === 'tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: isDark ? 'rgba(168,85,247,0.08)' : '#faf5ff',
                border: `1px solid ${isDark ? 'rgba(168,85,247,0.2)' : '#e9d5ff'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <LinkIcon size={16} color="#a855f7" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Tools & Connectors
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                      Configure actions, form capture, and third-party integrations
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#a855f7',
                  background: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}>
                  {connectorTools.filter(t => t.connected).length} active
                </span>
              </div>

              {/* Compact subtext */}
              <div style={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', lineHeight: 1.4 }}>
                Click <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Connect</strong> to add connectors to your agent.
              </div>

              {/* Grouped Category Sections — Clean Dedicated View */}
              {['BUILT-IN', 'DEPLOY CHANNELS & INTEGRATIONS', 'SCHEDULING & MEETINGS'].map((catGroup, catIdx) => {
                const groupTools = connectorTools.filter(t => (t.categoryGroup || 'BUILT-IN') === catGroup);
                if (groupTools.length === 0) return null;

                return (
                  <div key={catGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* Section Title */}
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                      textTransform: 'uppercase',
                      marginTop: catIdx > 0 ? '0.35rem' : '0',
                      marginBottom: '0.15rem',
                    }}>
                      {catGroup}
                    </div>

                    {/* List rows */}
                    {groupTools.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '9px',
                          background: isDark ? '#14141d' : '#ffffff',
                          border: `1px solid ${t.connected ? (isDark ? 'rgba(168,85,247,0.35)' : '#c4b5fd') : borderColor}`,
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {/* Left: Icon + Name + Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden', flex: 1 }}>
                          <ConnectorToolIcon type={t.iconType} size={18} isDark={isDark} />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: isDark ? '#ffffff' : '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {t.name}
                              </span>
                              {t.badge && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: isDark ? 'rgba(168,85,247,0.2)' : '#ede9fe',
                                  color: '#a855f7',
                                  fontWeight: 600,
                                }}>
                                  {t.badge}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.68rem',
                              color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {t.description}
                            </span>
                          </div>
                        </div>

                        {/* Right: Action button */}
                        {t.id === 'lead_capture' ? (
                          <button
                            type="button"
                            onClick={() => setShowLeadCaptureModal(true)}
                            style={{
                              background: isDark ? 'rgba(168,85,247,0.12)' : '#f3e8ff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#a855f7',
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Configure
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleTool(t.id)}
                            style={{
                              background: t.connected
                                ? (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2')
                                : (isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc'),
                              border: `1px solid ${t.connected ? (isDark ? 'rgba(239,68,68,0.25)' : '#fca5a5') : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: t.connected ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.75)' : '#475569'),
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {t.locked && !t.connected && <Lock size={11} />}
                            {t.connected ? 'Disconnect' : 'Connect'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Scroll to Top shortcut */}
        {showScrollTop && (
          <button
            type="button"
            onClick={() => drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Scroll back to top"
            style={{
              position: 'absolute',
              bottom: '1.2rem',
              right: '1.4rem',
              zIndex: 35,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.42rem 0.8rem',
              borderRadius: '999px',
              border: `1px solid ${isDark ? 'rgba(124,58,237,0.45)' : '#c4b5fd'}`,
              background: isDark ? 'rgba(26, 26, 40, 0.94)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              color: isDark ? '#d8b4fe' : '#7c3aed',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.6)' : '0 4px 16px rgba(124,58,237,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
            <span>Top</span>
          </button>
        )}
      </div>

      {/* 3. Customize Widget Modal */}
      <CustomizeWidgetModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        isDark={isDark}
        brandData={{
          ...agentState,
          ...currentWidgetSettings,
          display_name: currentWidgetSettings.display_name || agentName,
          brand_name: projectName,
          logo_url: currentWidgetSettings.agent_icon || agentState?.logo_url,
        }}
        onSave={async (updatedSettings) => {
          setCurrentWidgetSettings(updatedSettings);
          const newDisplayName = updatedSettings.display_name || agentName;
          if (updatedSettings.display_name && updatedSettings.display_name !== agentName) {
            setAgentName(updatedSettings.display_name);
          }

          const resolvedAgentId = agentState?.agent_id || agentState?.id || agentId || 'spbrand_6a9150e5-92ed-42dc-baed-810d0e9a4362';
          const cleanAgentUuid = String(resolvedAgentId).replace('spbrand_', '').replace('skbrand_', '').replace('draft-', '');

          const updatedPayload = {
            ...agentState,
            agent_id: resolvedAgentId,
            id: cleanAgentUuid,
            display_name: newDisplayName,
            brand_name: newDisplayName,
            model: selectedModel,
            temperature: temperature,
            max_tokens: maxTokens,
            top_p: topP,
            system_prompt: systemPrompt,
            knowledge_bases: availableKnowledgeBases,
            tools: connectorTools,
            widget_settings: updatedSettings,
            primary_color: updatedSettings.primary_color || updatedSettings.primaryColor,
            theme: updatedSettings.theme,
            position: updatedSettings.position,
            greeting: updatedSettings.greeting,
            logo_url: updatedSettings.agent_icon || updatedSettings.logo_url || agentState?.logo_url,
          };

          if (onUpdateAgentState) {
            onUpdateAgentState(updatedPayload);
          }

          // Persist directly to backend database so page refresh keeps customized widget settings
          try {
            await saveAgentBrandConfig(updatedPayload, resolvedAgentId);
          } catch (err) {
            console.warn('[EditSpace] Failed to save widget settings to backend:', err);
          }

          setSavedBaseline({
            name: newDisplayName,
            model: selectedModel,
            prompt: systemPrompt,
            temperature: temperature,
            maxTokens: maxTokens,
            topP: topP,
            kbsJson: JSON.stringify(availableKnowledgeBases),
            toolsJson: JSON.stringify(connectorTools),
            widgetSettingsJson: JSON.stringify(updatedSettings),
          });
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />

      {/* 4. Configure Lead Capture Form Modal */}
      {showLeadCaptureModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: isDark ? '#161622' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
            borderRadius: '16px',
            width: '460px',
            maxWidth: '100%',
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.7)' : '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: isDark ? '#ffffff' : '#0f172a',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.4rem',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(168,85,247,0.2)' : '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={17} color="#a855f7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700 }}>Configure Lead Capture</h3>
                  <span style={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                    Customize fields displayed in the contact form
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowLeadCaptureModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem' }}>
                  Form Title
                </label>
                <input
                  type="text"
                  value={leadCaptureConfig.title}
                  onChange={(e) => setLeadCaptureConfig(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#12121a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.35rem' }}>
                  Form Subtitle
                </label>
                <input
                  type="text"
                  value={leadCaptureConfig.subtitle}
                  onChange={(e) => setLeadCaptureConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#12121a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: '0.5rem' }}>
                  Active Form Fields
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { key: 'name', label: 'Full Name', required: true },
                    { key: 'email', label: 'Email Address', required: true },
                    { key: 'phone', label: 'Phone Number', required: false },
                    { key: 'note', label: 'Inquiry / Project Message', required: false },
                  ].map((field) => (
                    <div
                      key={field.key}
                      onClick={() => {
                        if (!field.required) {
                          setLeadCaptureConfig(prev => ({
                            ...prev,
                            fields: { ...prev.fields, [field.key]: !prev.fields[field.key] }
                          }));
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: isDark ? '#12121a' : '#f8fafc',
                        border: `1px solid ${borderColor}`,
                        cursor: field.required ? 'default' : 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{field.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {field.required ? (
                          <span style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8' }}>Required</span>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: leadCaptureConfig.fields[field.key] ? '#10b981' : (isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'),
                          }}>
                            {leadCaptureConfig.fields[field.key] ? 'Enabled' : 'Disabled'}
                          </span>
                        )}
                        {leadCaptureConfig.fields[field.key] ? (
                          <CheckSquare size={16} color="#a855f7" />
                        ) : (
                          <Square size={16} color={isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8'} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.4rem',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem',
            }}>
              <button
                onClick={() => setShowLeadCaptureModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border: 'none',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tiny Success Toast Popup Notification */}
      {savedSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: isDark ? '#161622' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.4)' : '#10b981'}`,
          borderRadius: '12px',
          padding: '0.75rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          boxShadow: isDark ? '0 10px 35px rgba(0,0,0,0.65)' : '0 10px 30px rgba(16, 185, 129, 0.18)',
          color: isDark ? '#ffffff' : '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 's4-pop-in 0.25s ease-out',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0,
          }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
              Changes Saved
            </div>
            <div style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.65)' : '#64748b', marginTop: '2px' }}>
              Agent configuration updated successfully!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

