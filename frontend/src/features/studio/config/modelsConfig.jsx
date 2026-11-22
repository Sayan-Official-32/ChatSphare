import React from 'react';
import { Bot } from 'lucide-react';

// Available AI Models filtered strictly to providers with active API keys in .env
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast, high-capability multimodal model',
    icon: 'gemini',
    default: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Advanced complex reasoning and analysis',
    icon: 'gemini',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and compact flagship OpenAI model',
    icon: 'openai',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'High-intelligence multimodal flagship model',
    icon: 'openai',
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'Mistral AI',
    description: 'Cost-efficient, low-latency reasoning',
    icon: 'mistral',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'Top-tier flagship reasoning model',
    icon: 'mistral',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'High-efficiency MoE general chat model',
    icon: 'deepseek',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Deep chain-of-thought reasoning model',
    icon: 'deepseek',
  },
];

// Helper to render authentic Brand Vector Logos
export function ModelProviderLogo({ type, size = 28 }) {
  if (type === 'mistral') {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        background: '#ff7000',
        borderRadius: '7px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(255,112,0,0.35)',
      }}>
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M4 4h3.2v3.2H4V4zm6.4 0h3.2v3.2h-3.2V4zm6.4 0H20v3.2h-3.2V4zM4 10.4h3.2v3.2H4v-3.2zm6.4 0h3.2v3.2h-3.2v-3.2zm6.4 0H20v3.2h-3.2v-3.2zM4 16.8h3.2V20H4v-3.2zm12.8 0H20V20h-3.2v-3.2z" />
        </svg>
      </div>
    );
  }

  if (type === 'deepseek') {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M26.5 17.8c-1.3-2.6-3.8-5-7.6-5.9 1.1-1.6 1.3-3.2 1-3.8-.4-.7-1.5-.7-2.6-.2-1.9 1.1-3.5 3.2-4.4 5.2-4 .7-7.2 3.3-8.1 7-1 4.1 1.1 7.6 4.5 8.5 3.9 1.1 8.4-.7 11.2-4.1 2.6-3.1 4.1-5.4 6-6.7z" fill="#2563eb" />
          <circle cx="10.8" cy="18.8" r="1.1" fill="#ffffff" />
          <path d="M22.5 22c2.2 1.1 4.5.9 5.8-.4-1.3-.4-3.1-.2-5.8.4z" fill="#2563eb" />
        </svg>
      </div>
    );
  }

  if (type === 'openai') {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#0f172a',
      }}>
        <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zM20.1706 7.427a4.4755 4.4755 0 0 1 .5346 3.0137l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L9.1568 10.9658V8.6334a.0804.0804 0 0 1 .0332-.0615l4.8974-2.8277a4.4992 4.4992 0 0 1 6.0832 1.6828zM8.8872 13.0847l2.8475-1.6464 2.8474 1.6464v3.2929l-2.8474 1.6464-2.8475-1.6464z" />
        </svg>
      </div>
    );
  }

  if (type === 'gemini') {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
            fill="url(#gemini_sparkle_grad)"
          />
          <defs>
            <radialGradient id="gemini_sparkle_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 12) rotate(45) scale(14.14)">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#818cf8" />
              <stop offset="80%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#fbbf24" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return <Bot size={size * 0.7} />;
}
