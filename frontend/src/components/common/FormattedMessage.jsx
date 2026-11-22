/**
 * @file FormattedMessage.jsx
 * @description Rich Markdown & Formatted Text Renderer component for Chatbook.
 * Parses markdown syntax (**bold**, *italic*, `code`, headers, lists, links) 
 * into styled React DOM elements without displaying raw formatting characters.
 */

import React from 'react';

export default function FormattedMessage({ content = '', style = {}, isDark = true }) {
  if (!content) return null;

  const parseMarkdown = (rawText) => {
    // Helper to format inline markdown tags: **bold**, *italic*, `code`, [link](url)
    const formatInline = (text) => {
      if (typeof text !== 'string') return text;
      const parts = [];
      let lastIdx = 0;

      // Regex matching **bold**, __bold__, `code`, *italic*, _italic_, [text](url)
      const inlineRegex = /(\*\*(.*?)\*\*|__(.*?)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)]+)\))/g;
      let match;

      while ((match = inlineRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          parts.push(text.substring(lastIdx, match.index));
        }

        const [full, , bold1, bold2, code, italic1, italic2, linkText, linkUrl] = match;
        const key = `${match.index}-${full}`;

        if (bold1 || bold2) {
          parts.push(<strong key={key} style={{ fontWeight: 700, color: 'inherit' }}>{bold1 || bold2}</strong>);
        } else if (italic1 || italic2) {
          parts.push(<em key={key} style={{ fontStyle: 'italic', color: 'inherit' }}>{italic1 || italic2}</em>);
        } else if (code) {
          parts.push(
            <code
              key={key}
              style={{
                fontFamily: 'JetBrains Mono, monospace, sans-serif',
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                color: 'inherit',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.85em',
              }}
            >
              {code}
            </code>
          );
        } else if (linkText && linkUrl) {
          parts.push(
            <a
              key={key}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'underline' }}
            >
              {linkText}
            </a>
          );
        }

        lastIdx = inlineRegex.lastIndex;
      }

      if (lastIdx < text.length) {
        parts.push(text.substring(lastIdx));
      }

      return parts.length > 0 ? parts : text;
    };

    const lines = rawText.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null; // 'ul' | 'ol'

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            style={{
              margin: '0.35rem 0',
              paddingLeft: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            {currentList.map((item, idx) => (
              <li key={idx} style={{ lineHeight: 1.45, color: 'inherit' }}>{formatInline(item)}</li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Headers #, ##, ###
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} style={{ fontSize: '1.2em', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'inherit' }}>
            {formatInline(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} style={{ fontSize: '1.1em', fontWeight: 700, margin: '0.4rem 0 0.2rem 0', color: 'inherit' }}>
            {formatInline(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} style={{ fontSize: '1em', fontWeight: 700, margin: '0.35rem 0 0.15rem 0', color: 'inherit' }}>
            {formatInline(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
      }
      // Unordered list item (- or *)
      else if (/^[-*]\s+/.test(trimmed)) {
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        currentList.push(trimmed.replace(/^[-*]\s+/, ''));
      }
      // Ordered list item (1. 2.)
      else if (/^\d+\.\s+/.test(trimmed)) {
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        currentList.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
      // Empty line
      else if (trimmed === '') {
        flushList();
        elements.push(<div key={`br-${index}`} style={{ height: '0.35rem' }} />);
      }
      // Paragraph line
      else {
        flushList();
        elements.push(
          <p key={index} style={{ margin: '0.15rem 0', lineHeight: 1.5, color: 'inherit' }}>
            {formatInline(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div style={{ wordBreak: 'break-word', ...style }}>
      {parseMarkdown(content)}
    </div>
  );
}
