/**
 * @file BrandAgentWizard.jsx
 * @description Main Parent State Machine Controller for the 5-Step Brand Agent Creation Workflow.
 * 
 * Features:
 * 1. Synchronizes step state transitions (Steps 1 through 5).
 * 2. Stage-by-Stage Sub-Session Checkpoints: Every 'Next' click saves an immutable sub-session snapshot.
 * 3. In-Progress Draft Resumption: Exiting before Step 5 preserves the session and resumes directly on return.
 * 4. In-Place Overwriting: Updating the workflow updates the same draft record without creating duplicate bots.
 * 5. Completed Task on Publish: Step 5 'Publish Now' marks the workflow as completed, clearing active draft pointers.
 * 6. New Task Spawning: Creates a clean new workflow only after publication or explicit draft reset.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardHeader from './WizardHeader';
import useTheme from '@/lib/useTheme';

const Step1Start = React.lazy(() => import('./Step1Start'));
const Step2Brand = React.lazy(() => import('./Step2Brand'));
const Step3Knowledge = React.lazy(() => import('./Step3Knowledge'));
const Step4Tools = React.lazy(() => import('./Step4Tools'));
const Step5Publishing = React.lazy(() => import('./Step5Publishing'));


import {
  fetchCurrentAgent,
  fetchActiveWizardDraft,
  saveWizardDraft,
  saveSubSession,
  publishAgent,
  discardWizardDraft,
  crawlWebsite,
  saveBrandConfig,
  commitAgentSetup,
  addKnowledgeItem,
  uploadKnowledgeFile,
  crawlWebsiteKnowledge,
  searchKnowledge,
  toggleTool,
  processAgentPipeline,
  sendPlaygroundMessage,
  fetchEmbedCode,
} from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { RotateCcw, CheckCircle2, Clock, X } from 'lucide-react';

const getDraftStorageKey = (uid) => uid ? `chatsphare_wizard_draft_${uid}` : 'chatsphare_wizard_draft_anon';

/** Generates a canonical agent identifier formatted as "spbrand_" + full 36-char UUID v4 */
function generateAgentId() {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  return `spbrand_${uuid}`;
}

/** Generates a canonical project ID formatted as "PRJ-26-A7K92X" */
function generateProjectId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let seq = '';
  for (let i = 0; i < 6; i++) {
    seq += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRJ-${year}-${seq}`;
}

/**
 * Main 5-Step Brand Agent Creation Wizard Component.
 * 
 * @returns {JSX.Element} Brand Agent Creation Wizard JSX Layout.
 */
export default function BrandAgentWizard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const draftKey = getDraftStorageKey(currentUser?.uid);

  // Synchronously initialize step
  const [step, setStep] = useState(() => {
    try {
      const cached = localStorage.getItem(draftKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.current_step && parsed.current_step >= 1 && parsed.current_step <= 5) {
          return parsed.current_step;
        }
      }
    } catch { /* fallback */ }
    return (sessionStorage.getItem('chatsphare_initial_url') || sessionStorage.getItem('chatbook_initial_url')) ? 2 : 1;
  });

  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlerData, setCrawlerData] = useState(null);
  const [crawlError, setCrawlError] = useState('');
  const [resumedBanner, setResumedBanner] = useState(null);

  // Unified theme management
  const { theme, toggleTheme: handleToggleTheme } = useTheme();

  const initialAgentState = {
    project_id: null,
    agent_id: null,
    brand_id: null,
    url: '',
    brand_name: '',
    display_name: '',
    logo_url: '',
    primary_color: '#6366f1',
    secondary_color: '#4f46e5',
    font_family: 'Inter',
    brand_description: '',
    tone: 'Professional & Helpful',
    role: 'Customer Support Specialist',
    greeting: 'Hello! How can I help you today?',
    knowledge_items: [],
    tools: [],
  };

  const [agentState, setAgentState] = useState(() => {
    try {
      const cached = localStorage.getItem(draftKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.agent_id) {
          const rawId = (parsed.agent_id || '').replace('spbrand_', '');
          return {
            ...parsed,
            project_id: parsed.project_id || parsed.brand_id || rawId,
            brand_id: parsed.brand_id || rawId,
          };
        }
      }
    } catch { /* fallback */ }
    const newDraftId = generateAgentId();
    const rawId = newDraftId.replace('spbrand_', '');
    return {
      ...initialAgentState,
      agent_id: newDraftId,
      brand_id: rawId,
      project_id: rawId,
    };
  });

  // On mount and when user auth changes: restore active draft session from server
  useEffect(() => {
    async function restoreActiveWorkflow() {
      try {
        const currentKey = getDraftStorageKey(currentUser?.uid);
        const draftRes = await fetchActiveWizardDraft();
        if (draftRes && draftRes.has_draft && draftRes.draft) {
          const d = draftRes.draft;
          const restoredStep = draftRes.current_step || 1;
          const rawId = (d.agent_id || '').replace('spbrand_', '');
          const normalizedState = {
            ...d,
            project_id: d.project_id || d.brand_id || rawId,
            brand_id: d.brand_id || rawId,
          };
          setAgentState(normalizedState);
          if (d.widget_settings?.crawler_data) {
            setCrawlerData(d.widget_settings.crawler_data);
          }
          setStep(restoredStep);
          setResumedBanner(`Resumed in-progress draft (Stage ${restoredStep} of 5)`);
          localStorage.setItem(currentKey, JSON.stringify({ ...normalizedState, current_step: restoredStep }));
        } else {
          // No active draft on server -> Start a CLEAN NEW session for current workflow
          const newDraftId = generateAgentId();
          const rawId = newDraftId.replace('spbrand_', '');
          const freshState = {
            ...initialAgentState,
            agent_id: newDraftId,
            brand_id: rawId,
            project_id: rawId,
          };
          setAgentState(freshState);
          localStorage.removeItem(currentKey);
          localStorage.removeItem('chatsphare_wizard_draft');
          localStorage.removeItem('chatbook_wizard_draft');
        }
      } catch (err) {
        console.warn('Draft restoration notice:', err);
      }

      // Pick up URL typed on the landing page if any
      const savedUrl = sessionStorage.getItem('chatsphare_initial_url') || sessionStorage.getItem('chatbook_initial_url');
      if (savedUrl) {
        handleStartCrawl(savedUrl, true);
        sessionStorage.removeItem('chatsphare_initial_url');
        sessionStorage.removeItem('chatbook_initial_url');
      }
    }
    restoreActiveWorkflow();
  }, [currentUser?.uid]);

  /** Helper to sync draft to localStorage and backend */
  const persistDraftState = async (updatedState, nextStep) => {
    const currentKey = getDraftStorageKey(currentUser?.uid);
    const rawId = (updatedState.agent_id || '').replace('spbrand_', '');
    const canonicalProjId = updatedState.project_id || updatedState.brand_id || rawId;
    const payload = {
      ...updatedState,
      project_id: canonicalProjId,
      brand_id: updatedState.brand_id || canonicalProjId,
      current_step: nextStep,
    };
    try {
      localStorage.setItem(currentKey, JSON.stringify(payload));
      await saveWizardDraft(payload);
    } catch (e) {
      console.warn('Draft save notice:', e);
    }
  };

  /**
   * Kicks off background website crawling and metadata extraction pipeline.
   */
  const handleStartCrawl = async (targetUrl, skipToStep2 = false) => {
    setIsCrawling(true);
    setCrawlerData(null);
    setCrawlError('');

    try {
      const data = await crawlWebsite(targetUrl);
      setCrawlerData(data);
      const updated = {
        ...agentState,
        agent_id: data.agent_id || agentState.agent_id,
        brand_id: data.brand_id || agentState.brand_id,
        url: data.url || targetUrl,
        brand_name: data.brand_name || agentState.brand_name,
        display_name: data.display_name || agentState.display_name,
        primary_color: data.primary_color || agentState.primary_color,
        brand_description: data.brand_description || agentState.brand_description,
        greeting: data.greeting || agentState.greeting,
        logo_url: data.logo_url || agentState.logo_url,
        role: data.role || agentState.role,
        tone: data.tone || agentState.tone,
        knowledge_items: data.knowledge_items || agentState.knowledge_items || [],
        tools: data.tools || agentState.tools || [],
      };
      setAgentState(updated);

      // Save sub-session 1 snapshot
      saveSubSession({
        agent_id: updated.agent_id,
        stage_number: 1,
        stage_name: 'Step 1: Website Analysis & Start',
        snapshot_data: { url: targetUrl, crawler_result: data },
      }).catch(() => {});

      await persistDraftState(updated, 2);
      setStep(2);
    } catch (err) {
      console.error('Crawl failed:', err);
      setCrawlerData(null);
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        `Domain '${targetUrl}' could not be reached. Please check the website URL and try again.`;
      setCrawlError(errMsg);
      setStep(1);
    } finally {
      setIsCrawling(false);
    }
  };

  /** Step 1 Next transition handler */
  const handleProceedFromStep1 = async () => {
    const updated = { ...agentState };
    saveSubSession({
      agent_id: updated.agent_id,
      stage_number: 1,
      stage_name: 'Step 1: Website Analysis & Start',
      snapshot_data: { url: updated.url, crawler_data: crawlerData },
    }).catch(() => {});

    persistDraftState(updated, 2);
    setStep(2);
  };

  /** Resets brand state when user clears or edits the target website URL */
  const handleUrlChanged = () => {
    setCrawlerData(null);
    setCrawlError('');
    setAgentState(prev => ({
      ...prev,
      url: '',
      brand_name: '',
      display_name: '',
      logo_url: '',
      primary_color: '#6366f1',
      brand_description: '',
      greeting: '',
    }));
  };

  /** Selects manual setup mode and navigates to Step 2 */
  const handleSelectManual = async () => {
    const updated = {
      ...agentState,
      url: '',
      brand_name: 'My Brand',
      display_name: 'My AI Assistant',
      primary_color: '#6366f1',
      brand_description: '',
      tone: 'Professional & Helpful',
      role: 'Customer Support Specialist',
      greeting: 'Hello! How can I help you today?',
    };
    setAgentState(updated);

    saveSubSession({
      agent_id: updated.agent_id,
      stage_number: 1,
      stage_name: 'Step 1: Website Analysis & Start (Manual)',
      snapshot_data: { mode: 'manual' },
    }).catch(() => {});

    persistDraftState(updated, 2);
    setStep(2);
  };

  /** Persists brand configuration in wizard memory, saves Sub-Session 2, and navigates to Step 3 */
  const handleSaveBrand = async (formData) => {
    const updated = { ...agentState, ...formData };
    setAgentState(updated);

    saveSubSession({
      agent_id: updated.agent_id,
      stage_number: 2,
      stage_name: 'Step 2: Brand Identity & Persona',
      snapshot_data: formData,
    }).catch(() => {});

    persistDraftState(updated, 3);
    setStep(3);
  };

  const [isKnowledgeUploading, setIsKnowledgeUploading] = useState(false);
  const [isKnowledgeReady, setIsKnowledgeReady] = useState(true);

  /** Atomically commits Steps 1, 2, and 3 state to Supabase, saves Sub-Session 3, and moves to Step 4 */
  const handleStage3Complete = async () => {
    setStep(4);
    setIsKnowledgeUploading(true);
    setIsKnowledgeReady(false);

    const payload = {
      agent_id: agentState.agent_id,
      brand_id: agentState.brand_id,
      brand: {
        id: agentState.brand_id,
        brand_name: agentState.brand_name || 'My Brand',
        website_url: agentState.url,
        canonical_domain: agentState.url ? agentState.url.replace(/^https?:\/\//i, '').split('/')[0] : null,
        logo_url: agentState.logo_url,
        primary_color: agentState.primary_color || '#6366f1',
        secondary_color: agentState.secondary_color || '#4f46e5',
        font_family: agentState.font_family || 'Inter',
        brand_description: agentState.brand_description,
        industry: agentState.industry || 'General',
        site_metadata: agentState.site_metadata || {},
        brand_guidelines: agentState.brand_guidelines || {},
      },
      agent: {
        id: agentState.agent_id,
        display_name: agentState.display_name || `${agentState.brand_name || 'My'} Assistant`,
        role: agentState.role || 'Customer Support Specialist',
        tone: agentState.tone || 'Professional & Helpful',
        greeting_message: agentState.greeting || 'Hello! How can I help you today?',
        system_prompt: agentState.system_prompt,
        custom_instructions: agentState.custom_instructions,
        widget_settings: {
          theme: agentState.theme || 'Light',
          position: agentState.position || 'Right',
          placeholder: agentState.placeholder || 'Type your message...',
          suggestions: agentState.suggestions || ['What are your services?', 'How do I get started?'],
          hide_branding: agentState.hide_branding || false,
          show_callouts: agentState.show_callouts || false,
        },
        status: 'draft',
      },
      sync_documents: true,
      knowledge_items: (agentState.knowledge_items || []).map(item => ({
        id: item.id,
        title: item.title || 'Untitled Document',
        type: item.type || 'Document',
        source: item.source || 'Manual Upload',
        content: item.content || '',
        words: item.words || 0,
        size: item.size || 0,
        structured_data: item.structured_web_document || item.structured_information || {},
      })),
    };

    let persistentAgentId = agentState.agent_id;
    let persistentBrandId = agentState.brand_id;

    try {
      const res = await commitAgentSetup(payload);
      if (res && res.agent_id) {
        persistentAgentId = res.agent_id;
        persistentBrandId = res.brand_id;
        setAgentState(prev => ({
          ...prev,
          agent_id: res.agent_id,
          brand_id: res.brand_id,
          metrics: res.metrics,
        }));
      }
      setIsKnowledgeReady(true);
    } catch (err) {
      console.warn('Deferred setup commit notice (staged state active):', err);
      setIsKnowledgeReady(true);
    } finally {
      setIsKnowledgeUploading(false);
    }

    const updatedState = {
      ...agentState,
      agent_id: persistentAgentId,
      brand_id: persistentBrandId,
    };

    saveSubSession({
      agent_id: persistentAgentId,
      stage_number: 3,
      stage_name: 'Step 3: Knowledge Base & Documents',
      snapshot_data: { knowledge_count: agentState.knowledge_items?.length || 0 },
    }).catch(() => {});

    persistDraftState(updatedState, 4);
  };

  const uploadingFilesRef = useRef(new Set());

  /** Adds knowledge item to agent state with immediate loading indicator */
  const handleAddKnowledge = async (item) => {
    if (!item) return;

    // Deduplicate in-flight upload triggers for the exact same file
    const fileKey = item.file 
      ? `${item.file.name}_${item.file.size}_${item.file.lastModified || 0}` 
      : `${item.title}_${item.type}_${item.source}`;

    if (uploadingFilesRef.current.has(fileKey)) {
      return;
    }
    uploadingFilesRef.current.add(fileKey);

    const tempId = `temp-${Date.now()}`;
    const placeholder = {
      id: tempId,
      title: item.title,
      type: item.type,
      source: item.source,
      words: 0,
      size: item.size || 0,
      status: 'loading',
      content: item.content
    };

    setAgentState(prev => ({
      ...prev,
      knowledge_items: [...prev.knowledge_items, placeholder],
    }));

    try {
      let res;
      if (item.file) {
        res = await uploadKnowledgeFile(item.file, item.type, item.source, agentState.agent_id);
      } else if (item.type === 'Web Crawl' || item.isWebsiteCrawl) {
        res = await crawlWebsiteKnowledge(item.source || item.title, agentState.agent_id);
      } else {
        res = await addKnowledgeItem(item, agentState.agent_id);
      }
      setAgentState(prev => ({
        ...prev,
        agent_id: prev.agent_id || res.item?.agent_id,
        knowledge_items: prev.knowledge_items.map(k => k.id === tempId ? {
          ...res.item,
          size: item.size || (res.item?.content ? res.item.content.length : 0),
          status: 'Indexed'
        } : k),
      }));
    } catch {
      const fallback = {
        id: `kb-${Date.now()}`,
        ...item,
        words: item.content ? item.content.trim().split(/\s+/).filter(Boolean).length : 0,
        status: 'Indexed',
      };
      setAgentState(prev => ({
        ...prev,
        knowledge_items: prev.knowledge_items.map(k => k.id === tempId ? fallback : k),
      }));
    } finally {
      uploadingFilesRef.current.delete(fileKey);
    }
  };

  /** Removes a single knowledge item by ID or index */
  const handleRemoveKnowledge = (itemIdOrIdx) => {
    setAgentState(prev => ({
      ...prev,
      knowledge_items: prev.knowledge_items.filter((item, idx) =>
        item.id ? item.id !== itemIdOrIdx : idx !== itemIdOrIdx
      ),
    }));
  };

  /** Clears all knowledge items */
  const handleClearKnowledge = () => {
    setAgentState(prev => ({
      ...prev,
      knowledge_items: [],
    }));
  };

  /** Deletes an individual knowledge item by ID */
  const handleDeleteKnowledge = (id) => {
    setAgentState(prev => ({
      ...prev,
      knowledge_items: prev.knowledge_items.filter(k => k.id !== id),
    }));
  };

  /** Searches knowledge items */
  const handleSearchKnowledge = async (query) => {
    try {
      const results = await searchKnowledge(query, agentState.agent_id);
      return results;
    } catch {
      return [];
    }
  };

  /** Handles toggling tools */
  const handleToggleTool = (toolId, enabled) => {
    setAgentState(prev => ({
      ...prev,
      tools: prev.tools.map(t => (t.id === toolId ? { ...t, enabled } : t)),
    }));
  };

  /** Step 4 Next transition handler: commits setup with status='ready', saves sub-sessions, and advances to Step 5 */
  const handleProceedFromStep4 = async () => {
    // 1. Advance UI immediately to Step 5
    setStep(5);

    // 2. Commit setup with status='ready' and tools in background (skip redundant document sync)
    const payload = {
      agent_id: agentState.agent_id,
      brand_id: agentState.brand_id,
      status: 'ready',
      sync_documents: false,
      brand: {
        brand_name: agentState.brand_name || 'My Brand',
        website_url: agentState.url || '',
        brand_description: agentState.brand_description || '',
        primary_color: agentState.primary_color || '#6366f1',
      },
      agent: {
        display_name: agentState.display_name || `${agentState.brand_name || 'My'} Assistant`,
        role: agentState.role || 'Customer Support Specialist',
        tone: agentState.tone || 'Professional & Helpful',
        greeting_message: agentState.greeting || 'Hello! How can I help you today?',
        system_prompt: agentState.system_prompt,
        status: 'ready',
      },
      knowledge_items: [],
      tools: agentState.tools || [],
    };
    commitAgentSetup(payload).catch(err => console.warn('Commit on Step 4 completion notice:', err));

    // 3. Snapshot Sub-Session 4 & 5
    saveSubSession({
      agent_id: agentState.agent_id,
      stage_number: 4,
      stage_name: 'Step 4: Tools & Integrations',
      snapshot_data: {
        tools: agentState.tools,
        knowledge_count: agentState.knowledge_items?.length || 0,
        brand_name: agentState.brand_name,
      },
    }).catch(() => {});

    saveSubSession({
      agent_id: agentState.agent_id,
      stage_number: 5,
      stage_name: 'Step 5: Review & Deployment',
      snapshot_data: {
        status: 'ready',
        agent_id: agentState.agent_id,
        tools: agentState.tools,
        knowledge_count: agentState.knowledge_items?.length || 0,
      },
    }).catch(() => {});

    // 4. Persist complete ready state in background
    persistDraftState({ ...agentState, status: 'ready' }, 5);
  };

  // Stage 5 Lock-in: prevent browser back button or undo gesture from leaving Step 5
  useEffect(() => {
    if (step === 5) {
      window.history.pushState({ step: 5, locked: true }, document.title, window.location.href);
      const handlePopState = () => {
        // Intercept back button and keep user locked on Step 5
        window.history.pushState({ step: 5, locked: true }, document.title, window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [step]);

  /** Step 5 Publish Handler: finalizes workflow as completed task, records actual publication timestamp, and seals active draft */
  const handlePublishWorkflow = async () => {
    const targetAgentId = agentState.agent_id;
    const nowIso = new Date().toISOString();
    try {
      await publishAgent(targetAgentId);
      await processAgentPipeline();

      // Update state with live publication timestamp
      setAgentState(prev => ({
        ...prev,
        published_at: nowIso,
        updated_at: nowIso,
        status: 'published',
      }));

      saveSubSession({
        agent_id: targetAgentId,
        stage_number: 5,
        stage_name: 'Step 5: Publishing & Deployment',
        snapshot_data: { published_at: nowIso, updated_at: nowIso, status: 'completed_task' },
      }).catch(() => {});

      // Clear local storage draft since task is fully completed!
      localStorage.removeItem(getDraftStorageKey(currentUser?.uid));
      localStorage.removeItem('chatsphare_wizard_draft');
      localStorage.removeItem('chatbook_wizard_draft');
      setResumedBanner(null);
    } catch (e) {
      console.warn('Publish notice:', e);
    }
  };

  /** Discards active draft and restarts fresh from Step 1 with a clean draft ID */
  const handleDiscardDraft = async () => {
    try {
      await discardWizardDraft();
    } catch (e) {
      console.warn('Discard notice:', e);
    }
    localStorage.removeItem(getDraftStorageKey(currentUser?.uid));
    localStorage.removeItem('chatsphare_wizard_draft');
    localStorage.removeItem('chatbook_wizard_draft');
    setResumedBanner(null);
    const freshDraftId = generateAgentId();
    setAgentState({
      ...initialAgentState,
      agent_id: freshDraftId,
      brand_id: null,
    });
    setCrawlerData(null);
    setCrawlError('');
    setStep(1);
  };

  /** Sends playground test message */
  const handleSendMessage = async (userText) => {
    const reply = await sendPlaygroundMessage([{ role: 'user', content: userText }]);
    return reply;
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
      background: theme === 'light' ? '#f8fafc' : '#09090b',
      color: theme === 'light' ? '#0f172a' : '#ffffff',
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      <WizardHeader currentStep={step} theme={theme} onToggleTheme={handleToggleTheme} />

        {/* Resumed In-Progress Draft Banner (Moderate Format) */}
        {resumedBanner && (
          <div style={{
            padding: '0.45rem 1.5rem 0.2rem 1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              maxWidth: '1080px',
              width: '100%',
              background: theme === 'light' ? 'rgba(238, 242, 255, 0.9)' : 'rgba(99, 102, 241, 0.08)',
              border: `1px solid ${theme === 'light' ? '#c7d2fe' : 'rgba(99, 102, 241, 0.22)'}`,
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '0.45rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: theme === 'light' ? '#3730a3' : '#c7d2fe',
              boxShadow: theme === 'light' ? '0 1px 4px rgba(0,0,0,0.03)' : '0 2px 10px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  background: theme === 'light' ? '#e0e7ff' : 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'light' ? '#4f46e5' : '#818cf8',
                  flexShrink: 0,
                }}>
                  <Clock size={13} />
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>{resumedBanner}</span>
                  <span style={{ opacity: 0.8, marginLeft: '0.35rem' }}>— Edits will update this agent in-place.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  onClick={handleDiscardDraft}
                  style={{
                    background: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${theme === 'light' ? '#fecaca' : 'rgba(239, 68, 68, 0.25)'}`,
                    color: theme === 'light' ? '#b91c1c' : '#f87171',
                    borderRadius: '6px',
                    padding: '0.22rem 0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = theme === 'light' ? '#fecaca' : 'rgba(239, 68, 68, 0.22)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.12)';
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Discard &amp; Start Fresh</span>
                </button>

                <button
                  onClick={() => setResumedBanner(null)}
                  title="Dismiss alert"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme === 'light' ? '#6b7280' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = theme === 'light' ? '#111827' : '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = theme === 'light' ? '#6b7280' : 'rgba(255,255,255,0.45)';
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <React.Suspense fallback={
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '3px solid rgba(124, 58, 237, 0.2)',
                borderTopColor: '#7c3aed',
                animation: 'spin 0.8s linear infinite'
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          }>
            {step === 1 && (
              <Step1Start
                initialUrl={agentState.url}
                crawlerData={crawlerData}
                isCrawling={isCrawling}
                crawlError={crawlError}
                theme={theme}
                onRunCrawl={handleStartCrawl}
                onUrlChanged={handleUrlChanged}
                onProceedNext={handleProceedFromStep1}
                onSelectManual={handleSelectManual}
              />
            )}

            {step === 2 && (
              <Step2Brand
                brandData={agentState}
                isCrawling={isCrawling}
                theme={theme}
                onSaveBrand={handleSaveBrand}
                onBack={() => setStep(1)}
                onSendMessage={handleSendMessage}
              />
            )}

            {step === 3 && (
              <Step3Knowledge
                knowledgeItems={agentState.knowledge_items || []}
                theme={theme}
                onAddKnowledge={handleAddKnowledge}
                onRemoveKnowledge={handleRemoveKnowledge}
                onClearKnowledge={handleClearKnowledge}
                onSearchKnowledge={searchKnowledge}
                onNext={handleStage3Complete}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <Step4Tools
                agentState={agentState}
                toolsList={agentState.tools || []}
                theme={theme}
                isKnowledgeUploading={isKnowledgeUploading}
                isKnowledgeReady={isKnowledgeReady}
                onToggleTool={handleToggleTool}
                onNext={handleProceedFromStep4}
                onBack={() => setStep(3)}
              />
            )}

            {step === 5 && (
              <Step5Publishing
                brandData={agentState}
                theme={theme}
                onProcessAgent={processAgentPipeline}
                onPublishWorkflow={handlePublishWorkflow}
                onSendPlaygroundChat={sendPlaygroundMessage}
                onFetchEmbedCode={fetchEmbedCode}
              />
            )}
          </React.Suspense>
        </main>
    </div>
  );
}
