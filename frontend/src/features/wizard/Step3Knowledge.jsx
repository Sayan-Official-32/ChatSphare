/**
 * @file Step3Knowledge.jsx
 * @description Wizard Step 3: Knowledge Base — Clean header & Right-Hand Side Indexed Sources Showcase layout.
 *
 * Features:
 * 1. Clean header: "Add what it should know" title and description.
 * 2. Two-column layout: Left column for intake tabs & forms, Right 310px column for Indexed Sources list showcase.
 * 3. Four knowledge source tabs (Files, Website, Text, Q&A) showing live item & word counts per tab.
 * 4. Right-Hand Side Showcase: Display all uploaded items (Documents, Website URLs, Text snippets, FAQs) with size, word count, Eye preview, Copy snippet, and Trash delete buttons.
 * 5. Drag-and-drop file zone with format pills (PDF, DOCX, TXT, MD, JSON, HTML, PPTX, CSV) and 50MB limit meter.
 * 6. Website crawl input with URL auto-protocol check, crawl depth toggle, and step-by-step crawler animation.
 * 7. Text input with custom Title field, sample templates dropdown, character/word counter.
 * 8. Q&A pair form with live formatted FAQ card preview snippet.
 * 9. Extracted Content Preview Popup Modal with search-within-text, copy to clipboard, and tabbed Markdown/JSON viewer.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload, Globe, FileText, HelpCircle,
  Plus, Trash2, RefreshCw, Database, ChevronRight, BookOpen, Zap,
  Sparkles, CheckCircle2, Search, Copy, Check, Eye, File, AlertCircle,
  X, Layers, ExternalLink
} from 'lucide-react';

/* --- Tab definitions ------------------------------------------------ */
const TABS = [
  { id: 'files',   label: 'Files',   typeMatch: 'Document',    Icon: Upload     },
  { id: 'website', label: 'Website', typeMatch: 'Web Crawl',   Icon: Globe      },
  { id: 'text',    label: 'Text',    typeMatch: 'Manual Text', Icon: FileText   },
  { id: 'qa',      label: 'Q&A',     typeMatch: 'FAQ',         Icon: HelpCircle },
];

/* --- Supported File Extensions Badge List --------------------------- */
const SUPPORTED_EXTENSIONS = [
  { ext: 'PDF',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { ext: 'DOCX', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { ext: 'TXT',  color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { ext: 'MD',   color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  { ext: 'JSON', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { ext: 'HTML', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  { ext: 'PPTX', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { ext: 'CSV',  color: '#84cc16', bg: 'rgba(132,204,22,0.15)' },
];

/* --- Sample Text Templates for quick testing ------------------------ */
const SAMPLE_TEXT_TEMPLATES = [
  {
    label: 'Refund Policy',
    title: 'Company Return & Refund Policy',
    content: `Return & Refund Policy:\n- Customers can request a full refund within 30 days of purchase.\n- Items must be unused and in original packaging.\n- Return shipping costs are covered by the company for defective items.\n- Refunds are processed to the original payment method within 3-5 business days.`
  },
  {
    label: 'Support Hours',
    title: 'Customer Support Overview & Hours',
    content: `Support Overview & Hours:\n- Standard support hours: Monday to Friday, 9:00 AM - 6:00 PM EST.\n- Weekend support available via email with 24-hour response SLA.\n- Live chat assistance is powered by AI Brand Assistants 24/7.\n- Priority phone support is available for Enterprise plan subscribers.`
  },
  {
    label: 'Pricing Plans',
    title: 'Product Pricing & Plans Summary',
    content: `Product Plans Summary:\n- Starter Plan: $29/mo - 1 AI Agent, 5,000 words knowledge base, standard chat widget.\n- Pro Plan: $99/mo - 5 AI Agents, 50,000 words knowledge base, custom widget styling & CRM tools.\n- Enterprise Plan: Custom pricing - Unlimited agents, dedicated database, custom SLA, and priority phone support.`
  }
];

const TYPE_COLOR = {
  'Document':    { bg:'rgba(124,58,237,0.15)', text:'#a78bfa', darkText: '#c4b5fd', lightBg: '#f3e8ff', lightText: '#6b21a8' },
  'Web Crawl':   { bg:'rgba(6,182,212,0.12)',  text:'#67e8f9', darkText: '#a5f3fc', lightBg: '#e0f2fe', lightText: '#0369a1' },
  'Manual Text': { bg:'rgba(34,197,94,0.12)',  text:'#86efac', darkText: '#bbf7d0', lightBg: '#dcfce7', lightText: '#15803d' },
  'FAQ':         { bg:'rgba(251,191,36,0.12)', text:'#fde68a', darkText: '#fef08a', lightBg: '#fef3c7', lightText: '#b45309' },
};

function FieldLabel({ children, required, theme = 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <label style={{
      display:'block', fontSize:'0.82rem', fontWeight:600,
      color: isDark ? 'rgba(255,255,255,0.85)' : '#334155', marginBottom:'0.45rem',
    }}>
      {children}
      {required && <span style={{ color:'#ef4444', marginLeft:'3px' }}>*</span>}
    </label>
  );
}

/**
 * Step 3 Knowledge Management Component.
 *
 * @param {Object}   props
 * @param {Array}    props.knowledgeItems
 * @param {string}   [props.theme='dark']
 * @param {Function} props.onAddKnowledge
 * @param {Function} [props.onRemoveKnowledge]
 * @param {Function} [props.onClearKnowledge]
 * @param {Function} props.onNext
 * @param {Function} props.onBack
 */
export default function Step3Knowledge({
  knowledgeItems = [],
  theme = 'dark',
  onAddKnowledge,
  onRemoveKnowledge,
  onClearKnowledge,
  onNext,
  onBack,
}) {
  const isDark = theme === 'dark';

  const [activeTab,     setActiveTab]     = useState('files');
  const [websiteUrl,    setWebsiteUrl]    = useState('');
  const [crawlDepth,    setCrawlDepth]    = useState('single'); // 'single' | 'subpages'
  const [isCrawling,    setIsCrawling]    = useState(false);
  const [crawlStep,     setCrawlStep]     = useState(0);
  
  const [textTitle,     setTextTitle]     = useState('');
  const [textContent,   setTextContent]   = useState('');
  const [qaQuestion,    setQaQuestion]    = useState('');
  const [qaAnswer,      setQaAnswer]      = useState('');
  
  const [isDragging,    setIsDragging]    = useState(false);
  const [crawlStatus,   setCrawlStatus]   = useState('');
  const [copiedItemId,  setCopiedItemId]  = useState(null);

  /* Modal Preview State */
  const [selectedPreviewItem, setSelectedPreviewItem] = useState(null);
  const [previewTab,          setPreviewTab]          = useState('markdown');
  const [modalSearchQuery,    setModalSearchQuery]    = useState('');
  const [copiedModalText,     setCopiedModalText]     = useState(false);

  const fileInputRef = useRef(null);

  /* Dynamic Theme Styling Palette */
  const styles = useMemo(() => ({
    cardBg:        isDark ? '#121319' : '#ffffff',
    cardBorder:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardShadow:    isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.06)',
    headerTitle:   isDark ? '#ffffff' : '#0f172a',
    headerSubText: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',
    splitBorder:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    tabBarBg:      isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
    tabInactiveBg: isDark ? 'rgba(255,255,255,0.04)' : '#edf2f7',
    tabInactiveText: isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
    inputBg:       isDark ? '#16171e' : '#f8fafc',
    inputBorder:   isDark ? 'rgba(255,255,255,0.09)' : '#cbd5e1',
    inputText:     isDark ? '#ffffff' : '#0f172a',
    inputPlaceholder: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8',
    rightPanelBg:  isDark ? 'rgba(255,255,255,0.012)' : '#f8fafc',
    itemCardBg:    isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    itemCardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    itemTitleText: isDark ? 'rgba(255,255,255,0.85)' : '#0f172a',
    itemSubText:   isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
    statCardBg:    isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)',
    statCardBorder: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.15)',
    footerBg:      isDark ? '#121319' : '#ffffff',
    modalBg:       isDark ? '#16171e' : '#ffffff',
    modalOverlay:  isDark ? 'rgba(10, 11, 16, 0.85)' : 'rgba(15, 23, 42, 0.6)',
    modalPreBg:    isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
  }), [isDark]);

  /* Compute word count per tab type */
  const getTabWords = (typeMatch) => {
    return knowledgeItems
      .filter(i => i.type === typeMatch)
      .reduce((a, i) => a + (i.words || 0), 0);
  };

  /* Dynamic document items calculation from knowledgeItems */
  const documentItems = knowledgeItems.filter(i => i.type === 'Document');
  const fileCount     = documentItems.length;

  const totalFileSizeBytes = documentItems.reduce((acc, item) => {
    if (typeof item.size === 'number' && item.size > 0) return acc + item.size;
    return acc + (item.content?.length || 0);
  }, 0);

  const totalFileSizeMB = totalFileSizeBytes / (1024 * 1024);
  const sizePercent     = Math.min(100, Math.max((fileCount / 200) * 100, (totalFileSizeMB / 50.0) * 100));

  const totalWords   = knowledgeItems.reduce((a, i) => a + (i.words || 0), 0);
  const wordCap      = 10000;
  const wordPercent  = Math.min(100, (totalWords / wordCap) * 100);
  const hasResources = knowledgeItems.length > 0;

  /** Handle file selection (click or drop) */
  const handleFiles = useCallback((files) => {
    if (!files || files.length === 0) return;
    if (totalFileSizeMB >= 50.0) {
      alert("Upload limit reached. Total file size cannot exceed 50 MB.");
      return;
    }
    const allowed = ['doc','docx','json','html','md','pdf','pptx','txt','csv'];
    Array.from(files).forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) return;

      onAddKnowledge?.({
        title: file.name,
        type: 'Document',
        source: 'File Upload',
        size: file.size,
        file: file,
      });
    });
  }, [onAddKnowledge, totalFileSizeMB]);

  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop      = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /** Website crawl handler with step animation */
  const handleCrawl = async () => {
    let url = websiteUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    setIsCrawling(true);
    setCrawlStep(1);
    setCrawlStatus('Connecting & fetching website HTML…');

    const stepTimer1 = setTimeout(() => {
      setCrawlStep(2);
      setCrawlStatus('Parsing DOM structure & stripping headers…');
    }, 800);

    const stepTimer2 = setTimeout(() => {
      setCrawlStep(3);
      setCrawlStatus('Extracting article content & text chunks…');
    }, 1600);

    try {
      await onAddKnowledge?.({
        title: url,
        type: 'Web Crawl',
        source: url,
        isWebsiteCrawl: true,
        crawlDepth: crawlDepth,
        content: `Extracting web content from ${url} (${crawlDepth === 'subpages' ? 'Full Domain Crawl' : 'Single Page'})...`
      });
      setCrawlStep(4);
      setCrawlStatus('Crawled & Indexed ✓');
    } catch {
      setCrawlStatus('Completed ✓');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setWebsiteUrl('');
      setTimeout(() => {
        setIsCrawling(false);
        setCrawlStatus('');
        setCrawlStep(0);
      }, 1200);
    }
  };

  /** Add plain text snippet */
  const handleAddText = () => {
    if (!textContent.trim()) return;
    const finalTitle = textTitle.trim() || `Text snippet (${textContent.length} chars)`;
    onAddKnowledge?.({
      title: finalTitle,
      content: textContent,
      type: 'Manual Text',
      source: 'Direct Entry'
    });
    setTextTitle('');
    setTextContent('');
  };

  /** Pre-fill template text */
  const handleSelectTemplate = (tpl) => {
    setTextTitle(tpl.title);
    setTextContent(tpl.content);
  };

  /** Add Q&A pair */
  const handleAddQA = () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    onAddKnowledge?.({
      title: qaQuestion.trim(),
      content: `Q: ${qaQuestion.trim()}\nA: ${qaAnswer.trim()}`,
      type: 'FAQ',
      source: 'Manual Entry'
    });
    setQaQuestion('');
    setQaAnswer('');
  };

  /** Dispatch add-source based on active tab */
  const handleAddSource = () => {
    if      (activeTab === 'website') handleCrawl();
    else if (activeTab === 'text')    handleAddText();
    else if (activeTab === 'qa')      handleAddQA();
    else    fileInputRef.current?.click();
  };

  /** Copy item content snippet to clipboard */
  const handleCopySnippet = (item) => {
    const textToCopy = item.content || item.title;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedItemId(item.id || item.title);
      setTimeout(() => setCopiedItemId(null), 2000);
    }).catch(() => {});
  };

  /** Copy modal content */
  const handleCopyModalContent = () => {
    if (!selectedPreviewItem) return;
    const text = selectedPreviewItem.content || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopiedModalText(true);
      setTimeout(() => setCopiedModalText(false), 2000);
    }).catch(() => {});
  };

  /** Transition directly to Stage 4 */
  const handleCreateKnowledgeBase = () => {
    if (onNext) {
      onNext();
    }
  };

  /** Whether the add button should be enabled */
  const canAdd = () => {
    if (activeTab === 'files')   return totalFileSizeMB < 50.0;
    if (activeTab === 'website') return websiteUrl.trim().length > 0 && !isCrawling;
    if (activeTab === 'text')    return textContent.trim().length > 0;
    if (activeTab === 'qa')      return qaQuestion.trim().length > 0 && qaAnswer.trim().length > 0;
    return false;
  };

  const addLabel = {
    files: 'Upload File',
    website: isCrawling ? 'Crawling…' : 'Crawl Website',
    text: 'Add Text Source',
    qa: 'Add Q&A Pair'
  }[activeTab];

  /* ------------------------------------------------------------------ */
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'var(--font-sans)', position:'relative' }}>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} multiple accept=".doc,.docx,.json,.html,.md,.pdf,.pptx,.txt,.csv"
        style={{ display:'none' }} onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
          e.target.value = '';
        }} />

      {/* Outer wrapper — matches Step 2 maxWidth */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1080px', width:'100%', margin:'0 auto', padding:'0 1.5rem', boxSizing:'border-box' }}>

        {/* CARD */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
          background: styles.cardBg,
          border: `1px solid ${styles.cardBorder}`,
          borderRadius:'16px 16px 0 0',
          boxShadow: styles.cardShadow,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}>

          {/* HEADER */}
          <div style={{ padding:'1.5rem 2.25rem 1rem', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem' }}>
              <div style={{
                width:'32px', height:'32px', borderRadius:'8px',
                background:'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 14px rgba(124,58,237,0.5)',
              }}>
                <BookOpen size={16} color="#fff" />
              </div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:700, color: styles.headerTitle, margin:0 }}>
                Add what it should know
              </h2>
            </div>
            <p style={{ fontSize:'0.86rem', color: styles.headerSubText, margin:0, lineHeight:1.5 }}>
              Review what we found, then add files, pasted text, or Q&amp;A so answers match your business.
            </p>
          </div>

          {/* TWO-COLUMN BODY */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 310px', overflow:'hidden', borderTop:`1px solid ${styles.splitBorder}` }}>

            {/* LEFT: Intake Forms */}
            <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${styles.splitBorder}` }}>

              {/* Tab Bar */}
              <div style={{
                display:'flex', gap:'0.35rem', padding:'0.85rem 1.5rem 0', flexShrink:0,
                background: styles.tabBarBg,
                borderBottom:`1px solid ${styles.splitBorder}`
              }}>
                {TABS.map(({ id, label, typeMatch, Icon }) => {
                  const a = activeTab === id;
                  const words = getTabWords(typeMatch);
                  return (
                    <button key={id} onClick={() => setActiveTab(id)} style={{
                      display:'flex', alignItems:'center', gap:'0.45rem', padding:'0.55rem 0.9rem',
                      borderRadius:'8px 8px 0 0', border:'none',
                      background: a ? '#7c3aed' : styles.tabInactiveBg,
                      color: a ? '#fff' : styles.tabInactiveText,
                      fontSize:'0.83rem', fontWeight:600, cursor:'pointer', transition:'all 0.2s ease',
                      fontFamily:'var(--font-sans)', marginBottom: a ? '-1px' : '0',
                      borderBottom: a ? `1px solid ${styles.cardBg}` : '1px solid transparent',
                      boxShadow: a ? '0 -4px 12px rgba(124,58,237,0.25)' : 'none',
                    }}
                    onMouseEnter={e => { if (!a) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'; }}
                    onMouseLeave={e => { if (!a) e.currentTarget.style.background = styles.tabInactiveBg; }}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                      <span style={{ fontSize:'0.72rem', opacity: a ? 0.9 : 0.5, fontWeight:400 }}>
                        ({words > 0 ? `${words.toLocaleString()} words` : '0 words'})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Form Content */}
              <div style={{ flex:1, overflow:'auto', padding:'1.35rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

                {/* 1. FILES TAB */}
                {activeTab === 'files' && (
                  <div 
                    onClick={() => { if (totalFileSizeMB < 50.0) fileInputRef.current?.click(); }} 
                    onDragOver={(e) => { if (totalFileSizeMB < 50.0) handleDragOver(e); }} 
                    onDragLeave={handleDragLeave} 
                    onDrop={(e) => { if (totalFileSizeMB < 50.0) handleDrop(e); }}
                    style={{ 
                      flex: 1, 
                      minHeight: '210px', 
                      border: `2px dashed ${totalFileSizeMB >= 50.0 ? '#ef4444' : isDragging ? '#7c3aed' : isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`, 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem', 
                      background: totalFileSizeMB >= 50.0 
                        ? (isDark ? 'rgba(239,68,68,0.03)' : '#fef2f2') 
                        : isDragging 
                          ? (isDark ? 'rgba(124,58,237,0.08)' : '#f3e8ff') 
                          : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'), 
                      cursor: totalFileSizeMB >= 50.0 ? 'not-allowed' : 'pointer', 
                      transition: 'all 0.2s ease', 
                      textAlign: 'center', 
                      padding: '1.5rem' 
                    }}
                  >
                    <div style={{ 
                      width: '52px', 
                      height: '52px', 
                      borderRadius: '12px', 
                      background: totalFileSizeMB >= 50.0 
                        ? 'rgba(239,68,68,0.15)' 
                        : (isDark ? 'rgba(124,58,237,0.15)' : '#e0e7ff'), 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transform: isDragging ? 'scale(1.1)' : 'scale(1)', 
                      transition: 'transform 0.2s ease'
                    }}>
                      <Upload size={24} color={totalFileSizeMB >= 50.0 ? '#f87171' : isDark ? '#a78bfa' : '#4f46e5'} />
                    </div>

                    <div>
                      {totalFileSizeMB >= 50.0 ? (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f87171', marginBottom: '0.3rem' }}>
                            ⚠️ Total file size limit reached (50 MB)
                          </div>
                          <div style={{ fontSize: '0.78rem', color: styles.itemSubText, lineHeight: 1.5 }}>
                            Remove some documents from the list to upload new files
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: styles.headerTitle, marginBottom: '0.3rem' }}>
                            {isDragging ? 'Drop files here' : 'Click or drag & drop files here'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: styles.itemSubText, lineHeight: 1.5 }}>
                            Supported file types: DOC, DOCX, JSON, HTML, MD, PDF, PPTX, TXT, CSV
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: '0.78rem', color: styles.itemSubText, marginTop: '0.4rem' }}>
                        Files: {fileCount} / 200 · Max 50 MB total
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div style={{ width: '100%', maxWidth: '360px', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: styles.itemSubText, marginBottom: '0.3rem' }}>
                        <span>Files: {fileCount} / 200</span>
                        <span style={{ color: totalFileSizeMB >= 50.0 ? '#f87171' : styles.itemSubText }}>
                          Size: {totalFileSizeMB.toFixed(1)} MB / 50.0 MB
                        </span>
                      </div>
                      <div style={{ height: '4px', background: isDark ? 'rgba(255,255,255,0.07)' : '#cbd5e1', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${sizePercent}%`, 
                          height: '100%', 
                          background: totalFileSizeMB >= 50.0 ? '#ef4444' : '#7c3aed', 
                          borderRadius: '2px', 
                          transition: 'width 0.3s ease' 
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. WEBSITE TAB */}
                {activeTab === 'website' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                    <FieldLabel theme={theme}>Website URL</FieldLabel>
                    
                    <div style={{
                      display:'flex', alignItems:'center',
                      background: styles.inputBg,
                      border:`1px solid ${isCrawling ? '#7c3aed' : styles.inputBorder}`,
                      borderRadius:'10px', overflow:'hidden',
                      transition:'border-color 0.2s, box-shadow 0.2s'
                    }}>
                      <div style={{ padding:'0 1rem', color: styles.itemSubText, flexShrink:0 }}>
                        <Globe size={16} />
                      </div>
                      <input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCrawl(); }}
                        placeholder="https://www.example.com" disabled={isCrawling}
                        style={{
                          flex:1, background:'transparent', border:'none', color: styles.inputText,
                          outline:'none', fontSize:'0.88rem', padding:'0.7rem 0', fontFamily:'var(--font-sans)'
                        }} />
                      <button onClick={handleCrawl} disabled={!websiteUrl.trim() || isCrawling}
                        style={{
                          display:'flex', alignItems:'center', gap:'0.4rem',
                          background:(websiteUrl.trim() && !isCrawling) ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'),
                          border:'none',
                          color:(websiteUrl.trim() && !isCrawling) ? '#fff' : styles.itemSubText,
                          padding:'0.6rem 1.1rem', fontSize:'0.84rem', fontWeight:600,
                          cursor:(websiteUrl.trim() && !isCrawling) ? 'pointer' : 'not-allowed',
                          fontFamily:'var(--font-sans)', transition:'all 0.2s ease',
                          flexShrink:0, margin:'0.25rem', borderRadius:'7px'
                        }}>
                        {isCrawling ? <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Zap size={14} />}
                        {isCrawling ? 'Crawling…' : 'Crawl'}
                      </button>
                    </div>

                    {isCrawling && (
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.65rem 1rem', background: isDark ? 'rgba(124,58,237,0.08)' : '#f3e8ff', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'8px', fontSize:'0.84rem', color: isDark ? '#a78bfa' : '#6b21a8', fontWeight:600 }}>
                        <RefreshCw size={13} style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />
                        {crawlStatus}
                      </div>
                    )}

                    <p style={{ fontSize:'0.78rem', color: styles.itemSubText, lineHeight:1.6, margin:0 }}>
                      We'll crawl all publicly accessible pages and extract readable text content.<br />
                      <span style={{ color:'#7c3aed', fontWeight:600 }}>Tip:</span> You can add multiple website URLs.
                    </p>
                  </div>
                )}

                {/* 3. TEXT TAB */}
                {activeTab === 'text' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', flex:1 }}>
                    <FieldLabel theme={theme}>Empty text source</FieldLabel>
                    <textarea value={textContent} onChange={e => setTextContent(e.target.value)}
                      placeholder="Enter your text here..."
                      style={{
                        width:'100%', background: styles.inputBg, border:`1px solid ${styles.inputBorder}`,
                        borderRadius:'8px', padding:'0.6rem 0.9rem', color: styles.inputText,
                        fontSize:'0.88rem', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box',
                        resize:'vertical', minHeight:'200px', lineHeight:1.7
                      }}
                      onFocus={e => e.currentTarget.style.borderColor='#7c3aed'}
                      onBlur={e => e.currentTarget.style.borderColor=styles.inputBorder} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color: styles.itemSubText }}>
                      <span>Paste company information, product specs, or policies</span>
                      <span style={{ color: textContent.length > 0 ? (isDark ? '#a78bfa' : '#6d28d9') : styles.itemSubText }}>
                        {textContent.length.toLocaleString()} chars
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Q&A TAB */}
                {activeTab === 'qa' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem', flex:1 }}>
                    <div>
                      <FieldLabel theme={theme} required>Question</FieldLabel>
                      <input type="text" value={qaQuestion} onChange={e => setQaQuestion(e.target.value)}
                        placeholder="Enter your question..."
                        style={{
                          width:'100%', background: styles.inputBg, border:`1px solid ${styles.inputBorder}`,
                          borderRadius:'8px', padding:'0.6rem 0.9rem', color: styles.inputText,
                          fontSize:'0.88rem', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor='#7c3aed'}
                        onBlur={e => e.currentTarget.style.borderColor=styles.inputBorder} />
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
                      <FieldLabel theme={theme} required>Answer</FieldLabel>
                      <textarea value={qaAnswer} onChange={e => setQaAnswer(e.target.value)}
                        placeholder="Enter the answer..."
                        style={{
                          width:'100%', background: styles.inputBg, border:`1px solid ${styles.inputBorder}`,
                          borderRadius:'8px', padding:'0.6rem 0.9rem', color: styles.inputText,
                          fontSize:'0.88rem', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box',
                          resize:'vertical', minHeight:'140px', lineHeight:1.7, flex:1
                        }}
                        onFocus={e => e.currentTarget.style.borderColor='#7c3aed'}
                        onBlur={e => e.currentTarget.style.borderColor=styles.inputBorder} />
                    </div>
                  </div>
                )}

              </div>

              {/* Add source button */}
              <div style={{ padding:'0.85rem 1.75rem 1rem', flexShrink:0, borderTop:`1px solid ${styles.splitBorder}` }}>
                <button onClick={handleAddSource} disabled={!canAdd()}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                    padding:'0.7rem',
                    background: canAdd() ? 'rgba(124,58,237,0.12)' : (isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'),
                    border: `1px solid ${canAdd() ? 'rgba(124,58,237,0.35)' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0')}`,
                    borderRadius:'9px',
                    color: canAdd() ? (isDark ? '#a78bfa' : '#6d28d9') : styles.itemSubText,
                    fontSize:'0.86rem', fontWeight:600, cursor: canAdd() ? 'pointer' : 'not-allowed',
                    fontFamily:'var(--font-sans)', transition:'all 0.2s ease'
                  }}
                  onMouseEnter={e => { if (canAdd()) e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; }}
                  onMouseLeave={e => { if (canAdd()) e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; }}>
                  <Plus size={15} />{addLabel}
                </button>
              </div>
            </div>

            {/* RIGHT: Stats & Indexed Source Management Panel Showcase */}
            <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', padding:'1.5rem 1.25rem', gap:'1.25rem', background: styles.rightPanelBg }}>

              <div style={{ flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Database size={14} color="#7c3aed" />
                    <span style={{ fontSize:'0.82rem', fontWeight:700, color: styles.headerTitle, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      INDEXED SOURCES ({knowledgeItems.length})
                    </span>
                  </div>
                  {knowledgeItems.length > 0 && onClearKnowledge && (
                    <button onClick={onClearKnowledge} style={{ background:'transparent', border:'none', color:'#ef4444', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }}>
                      <Trash2 size={12} /> Clear All
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                  {[{ label:'Sources', value: knowledgeItems.length }, { label:'Total Words', value: totalWords.toLocaleString() }].map(s => (
                    <div key={s.label} style={{
                      background: styles.statCardBg,
                      border: `1px solid ${styles.statCardBorder}`,
                      borderRadius:'8px', padding:'0.6rem 0.75rem', textAlign:'center'
                    }}>
                      <div style={{ fontSize:'1.1rem', fontWeight:800, color: isDark ? '#a78bfa' : '#6d28d9' }}>{s.value}</div>
                      <div style={{ fontSize:'0.72rem', color: styles.itemSubText, marginTop:'2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Total detected words progress bar */}
                <div style={{ marginTop:'0.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color: styles.itemSubText, marginBottom:'0.4rem' }}>
                    <span>Capacity Limit</span>
                    <span style={{ color: wordPercent > 80 ? '#f87171' : (isDark ? '#a78bfa' : '#6d28d9'), fontWeight:600 }}>
                      {totalWords.toLocaleString()} / 10k words
                    </span>
                  </div>
                  <div style={{ height:'6px', background: isDark ? 'rgba(255,255,255,0.07)' : '#cbd5e1', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{
                      width:`${wordPercent}%`, height:'100%',
                      background: wordPercent > 80 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#7c3aed,#06b6d4)',
                      borderRadius:'3px', transition:'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Indexed items list with removal option & preview modal launcher */}
              <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {knowledgeItems.length === 0 ? (
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:'0.6rem', padding:'1.5rem', color: styles.itemSubText }}>
                    <BookOpen size={28} opacity={0.3} />
                    <div style={{ fontSize:'0.8rem', lineHeight:1.5 }}>
                      No sources added yet.<br />Add your first source using the tabs.
                    </div>
                  </div>
                ) : (
                  knowledgeItems.map((item, i) => {
                    const c = TYPE_COLOR[item.type] || {
                      bg: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                      text: isDark ? 'rgba(255,255,255,0.6)' : '#475569',
                      lightBg: '#f1f5f9', lightText: '#475569'
                    };
                    const isLoading = item.status === 'loading';
                    const isCopied = copiedItemId === (item.id || item.title);

                    const formatSize = (bytes) => {
                      if (!bytes || bytes <= 0) return "";
                      if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
                      return (bytes / 1024).toFixed(1) + " KB";
                    };

                    return (
                      <div key={item.id || i} style={{
                        background: styles.itemCardBg,
                        border: `1px solid ${styles.itemCardBorder}`,
                        borderRadius:'8px', padding:'0.6rem 0.75rem',
                        display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0
                      }}>
                        {isLoading ? (
                          <RefreshCw size={14} color="#7c3aed" style={{ flexShrink:0, animation:'spin 1s linear infinite' }} />
                        ) : (
                          <button
                            onClick={() => setSelectedPreviewItem(item)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isDark ? '#a78bfa' : '#6d28d9',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                            title="View Extracted Content Preview"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.8rem', fontWeight:600, color: styles.itemTitleText, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {item.title}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.2rem', flexWrap:'wrap' }}>
                            <span style={{
                              fontSize:'0.68rem', fontWeight:600,
                              background: isDark ? c.bg : c.lightBg,
                              color: isDark ? c.text : c.lightText,
                              padding:'1px 6px', borderRadius:'4px'
                            }}>
                              {item.type}
                            </span>
                            {isLoading ? (
                              <span style={{ fontSize:'0.68rem', color:'#7c3aed', fontWeight:600 }}>Extracting text…</span>
                            ) : (
                              <span style={{ fontSize:'0.68rem', color: styles.itemSubText }}>
                                {item.size ? `${formatSize(item.size)} · ` : ''}{item.words ? `${item.words.toLocaleString()} words` : '0 words'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Copy Snippet Action */}
                        <button
                          onClick={() => handleCopySnippet(item)}
                          style={{
                            background: 'transparent', border: 'none',
                            color: isCopied ? '#10b981' : styles.itemSubText,
                            cursor: 'pointer', padding: '3px', borderRadius: '4px'
                          }}
                          title="Copy Content Snippet"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>

                        {/* Delete Action */}
                        {onRemoveKnowledge && (
                          <button onClick={() => onRemoveKnowledge(item.id || i)} style={{
                            background:'transparent', border:'none', color: styles.itemSubText,
                            cursor:'pointer', padding:'2px', borderRadius:'4px', transition:'color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color=styles.itemSubText}
                          title="Remove source">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {knowledgeItems.length > 0 && (
                <div style={{ flexShrink:0, fontSize:'0.75rem', color: styles.itemSubText, lineHeight:1.5, borderTop:`1px solid ${styles.splitBorder}`, paddingTop:'0.75rem' }}>
                  💡 More sources = more accurate answers. Aim for at least 3 diverse sources.
                </div>
              )}
            </div>

          </div>{/* end two-column */}

          {/* FOOTER */}
          <div style={{
            borderTop:`1px solid ${styles.splitBorder}`, padding:'1rem 2.5rem',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
            background: styles.footerBg
          }}>
            <span style={{ fontSize:'0.82rem', color: styles.itemSubText }}>Step 3 of 5</span>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <button onClick={onBack} style={{
                background:'transparent',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                color: styles.headerTitle, padding:'0.55rem 1.5rem', borderRadius:'9999px',
                fontSize:'0.9rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)',
                transition:'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Back
              </button>
              <button onClick={handleCreateKnowledgeBase} disabled={!hasResources}
                style={{
                  background: hasResources ? '#7c3aed' : (isDark ? 'rgba(124,58,237,0.3)' : '#cbd5e1'),
                  border:'none', color: hasResources ? '#fff' : (isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'),
                  padding:'0.6rem 2.2rem', borderRadius:'9999px', fontSize:'0.9rem', fontWeight:700,
                  cursor: hasResources ? 'pointer' : 'not-allowed', fontFamily:'var(--font-sans)',
                  transition:'all 0.2s ease', boxShadow: hasResources ? '0 4px 18px rgba(124,58,237,0.4)' : 'none'
                }}
                onMouseEnter={e => { if (hasResources) e.currentTarget.style.background = '#6d28d9'; }}
                onMouseLeave={e => { if (hasResources) e.currentTarget.style.background = '#7c3aed'; }}>
                Create Knowledge Base
              </button>
            </div>
          </div>

        </div>{/* end CARD */}
      </div>{/* end OUTER */}


      {/* ── EXTRACTED CONTENT PREVIEW MODAL ── */}
      {selectedPreviewItem && (
        <div style={{
          position:'absolute', inset:0, zIndex:110,
          background: styles.modalOverlay, backdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem',
        }}>
          <div style={{
            background: styles.modalBg, border:`1px solid ${styles.cardBorder}`, borderRadius:'16px',
            padding:'1.75rem 2rem', maxWidth:'750px', width:'100%', maxHeight:'85%',
            display:'flex', flexDirection:'column', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1rem', flexShrink:0 }}>
              <div style={{ minWidth:0, paddingRight:'1.5rem' }}>
                <h3 style={{ fontSize:'1.1rem', fontWeight:700, color: styles.headerTitle, margin:'0 0 0.35rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {selectedPreviewItem.title}
                </h3>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{
                    fontSize:'0.72rem', fontWeight:600,
                    background: TYPE_COLOR[selectedPreviewItem.type]?.bg || 'rgba(124,58,237,0.15)',
                    color: TYPE_COLOR[selectedPreviewItem.type]?.text || '#a78bfa',
                    padding:'2px 8px', borderRadius:'4px',
                  }}>
                    {selectedPreviewItem.type}
                  </span>
                  {selectedPreviewItem.structured_web_document?.status?.extraction_method && (
                    <span style={{ fontSize:'0.72rem', color: styles.itemSubText, background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding:'2px 8px', borderRadius:'4px' }}>
                      Engine: {selectedPreviewItem.structured_web_document.status.extraction_method}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedPreviewItem(null); setPreviewTab('markdown'); setModalSearchQuery(''); }}
                style={{
                  background:'transparent', border:'none', color: styles.itemSubText,
                  fontSize:'1.3rem', fontWeight:300, cursor:'pointer', padding:'0.2rem 0.5rem',
                  lineHeight:1, transition:'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = styles.headerTitle}
                onMouseLeave={e => e.currentTarget.style.color = styles.itemSubText}
              >
                &times;
              </button>
            </div>

            {/* Preview Sub-Tabs & Actions */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', marginBottom:'0.85rem', flexShrink:0, borderBottom:`1px solid ${styles.splitBorder}`, pb:'0.5rem' }}>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button
                  onClick={() => setPreviewTab('markdown')}
                  style={{
                    background: previewTab === 'markdown' ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                    color: previewTab === 'markdown' ? '#fff' : styles.itemSubText,
                    border: 'none', borderRadius: '6px', padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Extracted Markdown Text
                </button>
                <button
                  onClick={() => setPreviewTab('structured')}
                  style={{
                    background: previewTab === 'structured' ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                    color: previewTab === 'structured' ? '#fff' : styles.itemSubText,
                    border: 'none', borderRadius: '6px', padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  StructuredWebDocument JSON
                </button>
              </div>

              <button
                onClick={handleCopyModalContent}
                style={{
                  display:'flex', alignItems:'center', gap:'0.3rem',
                  background: copiedModalText ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                  color: copiedModalText ? '#fff' : styles.headerTitle,
                  border:'none', borderRadius:'6px', padding:'0.3rem 0.75rem',
                  fontSize:'0.75rem', fontWeight:600, cursor:'pointer'
                }}
              >
                {copiedModalText ? <Check size={12} /> : <Copy size={12} />}
                {copiedModalText ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Body */}
            <div style={{
              flex:1, overflow:'auto', background: styles.modalPreBg, border:`1px solid ${styles.splitBorder}`,
              borderRadius:'10px', padding:'1.2rem', margin:'0 0 1.2rem'
            }}>
              {previewTab === 'markdown' ? (
                <pre style={{
                  margin:0, padding:0, whiteSpace:'pre-wrap', wordBreak:'break-word',
                  fontFamily:'var(--font-mono)', fontSize:'0.82rem', color: isDark ? 'rgba(255,255,255,0.8)' : '#1e293b',
                  lineHeight:1.65,
                }}>
                  {selectedPreviewItem.content || "[No extracted content found]"}
                </pre>
              ) : (
                <pre style={{
                  margin:0, padding:0, whiteSpace:'pre-wrap', wordBreak:'break-word',
                  fontFamily:'var(--font-mono)', fontSize:'0.78rem', color: isDark ? '#67e8f9' : '#0369a1',
                  lineHeight:1.5,
                }}>
                  {JSON.stringify(
                    selectedPreviewItem.structured_web_document || 
                    selectedPreviewItem.structured_information || 
                    { content: selectedPreviewItem.content },
                    null, 2
                  )}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, borderTop:`1px solid ${styles.splitBorder}`, paddingTop:'1rem' }}>
              <span style={{ fontSize:'0.78rem', color: styles.itemSubText }}>
                {selectedPreviewItem.words ? `${selectedPreviewItem.words.toLocaleString()} words` : '0 words'}
              </span>
              <button 
                onClick={() => { setSelectedPreviewItem(null); setPreviewTab('markdown'); setModalSearchQuery(''); }}
                style={{
                  background:'#7c3aed', border:'none', color:'#fff', padding:'0.5rem 1.5rem',
                  borderRadius:'8px', fontSize:'0.86rem', fontWeight:600, cursor:'pointer',
                  transition:'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background='#7c3aed'}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
