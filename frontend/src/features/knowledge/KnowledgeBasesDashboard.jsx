/**
 * @file KnowledgeBasesDashboard.jsx
 * @description Enterprise Knowledge Bases Dashboard View matching the reference UI design.
 * 
 * Features:
 * 1. Global left navigation sidebar integration with active 'Knowledge Bases' sub-item.
 * 2. Header with title, subtitle, theme toggle, and '+ Create New Knowledge Base' primary button.
 * 3. Search filter bar with live keyword query and real-time result count indicator (e.g. '1 results').
 * 4. Interactive table with column sorting (Name, Created At, Last Updated, Status).
 * 5. Row display: Cylinder KB icon, KB Name, timestamps, Agents Using KB pill badges, Active status pill, Edit and Delete actions.
 * 6. Create Knowledge Base Modal with multi-agent attachment and initial source intake (Files, Website URL, Manual Text).
 * 7. Edit Knowledge Base Modal with document management and agent assignment.
 * 8. Safe delete confirmation dialog.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Database,
  Library,
  Layers,
  Edit3,
  Trash2,
  ExternalLink,
  Sun,
  Moon,
  Loader2,
  X,
  Check,
  AlertCircle,
  FileText,
  Globe,
  Upload,
  Bot,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  fetchKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  fetchUserAgents,
} from '@/services/api';
import useTheme from '@/lib/useTheme';

/**
 * Formats ISO timestamp into human-readable date and time (e.g. 'Jul 26, 2026, 12:56 PM').
 * 
 * @param {string|Date} ts - Raw timestamp string or Date object.
 * @returns {string} Formatted date/time string.
 */
function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'N/A';
    return `${d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  } catch {
    return 'N/A';
  }
}

/**
 * Knowledge Bases Dashboard Component.
 * 
 * @returns {JSX.Element} Knowledge Bases Dashboard layout JSX.
 */
export default function KnowledgeBasesDashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Unified Theme Management
  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();

  // State
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [userAgents, setUserAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [sortField, setSortField] = useState('updated_at'); // 'name' | 'created_at' | 'updated_at' | 'status' | 'project'
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState(null);
  const [deletingKb, setDeletingKb] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  // Create Modal Form Fields
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [sourceType, setSourceType] = useState('text'); // 'text' | 'url' | 'file'
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Extract distinct projects
  const projectsList = useMemo(() => {
    const map = new Map();
    knowledgeBases.forEach((kb) => {
      const id = kb.project_id || 'default-proj';
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: kb.project_name || 'My Project',
          key: kb.project_key || `proj_${id.slice(0, 8)}`,
        });
      }
    });
    userAgents.forEach((ag) => {
      const id = ag.brand_id || ag.project_id;
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          name: ag.brand_name || ag.display_name || 'My Project',
          key: `proj_${id.slice(0, 8)}`,
        });
      }
    });
    return Array.from(map.values());
  }, [knowledgeBases, userAgents]);

  // Initial Load
  const loadData = async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const [kbRes, agRes] = await Promise.all([
        fetchKnowledgeBases().catch(() => ({ knowledge_bases: [] })),
        fetchUserAgents().catch(() => ({ agents: [] })),
      ]);

      const kbs = kbRes?.knowledge_bases || [];
      const ags = agRes?.agents || [];
      setKnowledgeBases(kbs);
      setUserAgents(ags);
    } catch (err) {
      console.warn('Knowledge bases fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedKbs = useMemo(() => {
    let result = [...knowledgeBases];

    // Project Filter
    if (selectedProjectId !== 'all') {
      result = result.filter(
        (kb) =>
          kb.project_id === selectedProjectId ||
          kb.project_key === selectedProjectId ||
          (selectedProjectId === 'default-proj' && !kb.project_id)
      );
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((kb) => {
        const nameMatch = (kb.name || '').toLowerCase().includes(q);
        const descMatch = (kb.description || '').toLowerCase().includes(q);
        const projMatch = (kb.project_name || kb.project_key || '').toLowerCase().includes(q);
        const agentMatch = (kb.agents_using || []).some((a) =>
          (a.display_name || a.brand_name || '').toLowerCase().includes(q)
        );
        return nameMatch || descMatch || projMatch || agentMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortField === 'created_at' || sortField === 'updated_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [knowledgeBases, searchQuery, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setNewKbName('');
    setNewKbDesc('');
    setSelectedAgentIds(userAgents.map((a) => a.id || a.agent_id));
    setSourceType('text');
    setSourceTitle('');
    setSourceContent('');
    setSourceUrl('');
    setUploadedFileName('');
    setIsCreateModalOpen(true);
  };

  // Submit Create Knowledge Base
  const handleCreateKbSubmit = async (e) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setSubmitting(true);
    try {
      const docs = [];
      if (sourceType === 'text' && sourceContent.trim()) {
        docs.push({
          title: sourceTitle.trim() || `${newKbName} Guide`,
          content: sourceContent.trim(),
          source: 'Manual Entry',
          type: 'Document',
        });
      } else if (sourceType === 'url' && sourceUrl.trim()) {
        docs.push({
          title: sourceTitle.trim() || sourceUrl.trim(),
          content: `Website knowledge source indexed from ${sourceUrl.trim()}`,
          source: sourceUrl.trim(),
          type: 'Website',
        });
      } else if (sourceType === 'file' && uploadedFileName) {
        docs.push({
          title: uploadedFileName,
          content: sourceContent || `Document parsed from ${uploadedFileName}`,
          source: uploadedFileName,
          type: 'File Upload',
        });
      }

      const payload = {
        name: newKbName.trim(),
        description: newKbDesc.trim(),
        agent_ids: selectedAgentIds,
        status: 'Active',
        documents: docs,
      };

      const res = await createKnowledgeBase(payload);
      if (res && res.knowledge_base) {
        setKnowledgeBases((prev) => [res.knowledge_base, ...prev]);
      } else {
        await loadData();
      }

      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Create KB error:', err);
      setErrorNotice('Failed to create knowledge base. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Knowledge Base
  const handleEditKbSubmit = async (e) => {
    e.preventDefault();
    if (!editingKb || !editingKb.name.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: editingKb.name.trim(),
        description: editingKb.description?.trim(),
        status: editingKb.status || 'Active',
        agent_ids: editingKb.agent_ids || (editingKb.agents_using || []).map((a) => a.id || a.agent_id),
      };

      const res = await updateKnowledgeBase(editingKb.id, payload);
      if (res && res.knowledge_base) {
        setKnowledgeBases((prev) =>
          prev.map((k) => (k.id === editingKb.id ? { ...k, ...res.knowledge_base } : k))
        );
      } else {
        await loadData();
      }

      setEditingKb(null);
    } catch (err) {
      console.error('Edit KB error:', err);
      setErrorNotice('Failed to update knowledge base.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Knowledge Base
  const handleDeleteKbConfirm = async () => {
    if (!deletingKb) return;
    setSubmitting(true);
    try {
      await deleteKnowledgeBase(deletingKb.id);
      setKnowledgeBases((prev) => prev.filter((k) => k.id !== deletingKb.id));
      setDeletingKb(null);
    } catch (err) {
      console.error('Delete KB error:', err);
      setKnowledgeBases((prev) => prev.filter((k) => k.id !== deletingKb.id));
      setDeletingKb(null);
    } finally {
      setSubmitting(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setSourceTitle(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceContent(event.target?.result || '');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: isDark ? '#0c0e14' : '#fafafa',
        color: isDark ? '#ffffff' : '#0f172a',
        transition: 'background 0.3s ease, color 0.3s ease',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
        {/* Top Header Bar */}
        <header
          style={{
            padding: '2rem 3rem 1.25rem 3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: isDark ? '#0c0e14' : '#ffffff',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 0.35rem 0',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Knowledge Bases
            </h1>
            <p
              style={{
                fontSize: '0.92rem',
                color: isDark ? '#94a3b8' : '#6b7280',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Manage the knowledge sources your agents can draw from.
            </p>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            style={{
              padding: '0.55rem',
              borderRadius: '9px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
              color: isDark ? '#f8fafc' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        {/* Action Bar (Search & Create Button) */}
        <div
          style={{
            padding: '1.5rem 3rem 1.25rem 3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Search Box with Result Counter */}
            <div
              style={{
                position: 'relative',
                width: '320px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  color: isDark ? '#64748b' : '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: '0.65rem 4.5rem 0.65rem 2.6rem',
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
                  background: isDark ? '#141721' : '#ffffff',
                  color: isDark ? '#ffffff' : '#111827',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  fontSize: '0.78rem',
                  color: isDark ? '#64748b' : '#9ca3af',
                  fontWeight: 500,
                  pointerEvents: 'none',
                }}
              >
                {filteredAndSortedKbs.length} results
              </span>
            </div>

            {/* Project Filter Dropdown */}
            {projectsList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
                    background: isDark ? '#141721' : '#ffffff',
                    color: isDark ? '#ffffff' : '#111827',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <option value="all">All Projects ({knowledgeBases.length})</option>
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* + Create New Knowledge Base Button */}
          <button
            onClick={handleOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '9px',
              background: '#7c3aed',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
              transition: 'background 0.2s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#6d28d9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#7c3aed')}
          >
            <Plus size={16} />
            <span>Create New Knowledge Base</span>
          </button>
        </div>

        {/* 3. Table Container */}
        <div
          style={{
            flex: 1,
            padding: '0 3rem 2rem 3rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: isDark ? '#12151f' : '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
              overflow: 'hidden',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) 110px 100px',
                padding: '0.85rem 1.5rem',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isDark ? '#94a3b8' : '#6b7280',
                userSelect: 'none',
              }}
            >
              {/* Name Column */}
              <div
                onClick={() => handleSort('name')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                <span>Name</span>
                <ChevronsUpDown size={14} style={{ opacity: sortField === 'name' ? 1 : 0.4 }} />
              </div>

              {/* Created At Column */}
              <div
                onClick={() => handleSort('created_at')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                <span>Created At</span>
                <ChevronsUpDown size={14} style={{ opacity: sortField === 'created_at' ? 1 : 0.4 }} />
              </div>

              {/* Last Updated Column */}
              <div
                onClick={() => handleSort('updated_at')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                <span>Last Updated</span>
                <ChevronsUpDown size={14} style={{ opacity: sortField === 'updated_at' ? 1 : 0.4 }} />
              </div>

              {/* Agents Using KB Column */}
              <div>Agents Using KB</div>

              {/* Status Column */}
              <div
                onClick={() => handleSort('status')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                <span>Status</span>
                <ChevronsUpDown size={14} style={{ opacity: sortField === 'status' ? 1 : 0.4 }} />
              </div>

              {/* Actions Column */}
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Table Body Rows */}
            {loading ? (
              <div
                style={{
                  padding: '4rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: isDark ? '#64748b' : '#9ca3af',
                }}
              >
                <Loader2 size={24} className="animate-spin" />
                <span style={{ fontSize: '0.88rem' }}>Loading Knowledge Bases...</span>
              </div>
            ) : filteredAndSortedKbs.length === 0 ? (
              <div
                style={{
                  padding: '4rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(124,58,237,0.15)' : '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Library size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: isDark ? '#ffffff' : '#111827',
                    }}
                  >
                    No Knowledge Bases Found
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: isDark ? '#64748b' : '#6b7280',
                      maxWidth: '360px',
                    }}
                  >
                    {searchQuery
                      ? `No knowledge bases match "${searchQuery}". Try a different keyword.`
                      : 'Create your first knowledge base repository to power your AI brand agents.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={handleOpenCreateModal}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Create Knowledge Base
                  </button>
                )}
              </div>
            ) : (
              filteredAndSortedKbs.map((kb) => (
                <div
                  key={kb.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) 110px 100px',
                    padding: '1rem 1.5rem',
                    alignItems: 'center',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'}`,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isDark
                      ? 'rgba(255,255,255,0.02)'
                      : '#f9fafb')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  {/* Name with Icon Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isDark ? 'rgba(124,58,237,0.2)' : '#ede9fe',
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Database size={17} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          color: isDark ? '#ffffff' : '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{kb.name}</span>
                        {(kb.project_key || kb.project_name) && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '12px',
                              background: isDark ? 'rgba(6,182,212,0.15)' : '#e0f2fe',
                              color: isDark ? '#38bdf8' : '#0284c7',
                              fontWeight: 500,
                            }}
                            title={`Project: ${kb.project_name || 'My Project'} (${kb.project_id || kb.project_key})`}
                          >
                            {kb.project_key || `proj_${(kb.project_id || 'default').slice(0, 8)}`}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: isDark ? '#64748b' : '#9ca3af',
                          marginTop: '0.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{kb.doc_count || 1} {(kb.doc_count || 1) === 1 ? 'source' : 'sources'}</span>
                        {kb.project_name && (
                          <>
                            <span>•</span>
                            <span>{kb.project_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Created At */}
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: isDark ? '#cbd5e1' : '#4b5563',
                      fontWeight: 400,
                    }}
                  >
                    {formatTimestamp(kb.created_at)}
                  </div>

                  {/* Last Updated */}
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: isDark ? '#cbd5e1' : '#4b5563',
                      fontWeight: 400,
                    }}
                  >
                    {formatTimestamp(kb.updated_at)}
                  </div>

                  {/* Agents Using KB */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(() => {
                      const seenNames = new Set();
                      const uniqueAgents = [];
                      (kb.agents_using || []).forEach((ag) => {
                        const name = ag.display_name || ag.name || ag.agent_name || ag.brand_name;
                        if (name && !seenNames.has(name)) {
                          seenNames.add(name);
                          uniqueAgents.push({ ...ag, name });
                        }
                      });

                      if (uniqueAgents.length === 0) {
                        return (
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: isDark ? '#64748b' : '#9ca3af',
                              fontStyle: 'italic',
                            }}
                          >
                            Unassigned
                          </span>
                        );
                      }

                      return uniqueAgents.map((ag) => (
                        <span
                          key={ag.id || ag.name}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '16px',
                            background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                            fontSize: '0.76rem',
                            fontWeight: 500,
                            color: isDark ? '#e2e8f0' : '#374151',
                            whiteSpace: 'nowrap',
                          }}
                          title={`Agent: ${ag.name}`}
                        >
                          {ag.name}
                        </span>
                      ));
                    })()}
                  </div>

                  {/* Status Pill */}
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background:
                          kb.status === 'Inactive'
                            ? isDark
                              ? '#334155'
                              : '#e2e8f0'
                            : '#7c3aed',
                        color: kb.status === 'Inactive' ? (isDark ? '#94a3b8' : '#475569') : '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {kb.status || 'Active'}
                    </span>
                  </div>

                  {/* Actions (Edit Pencil + Delete Trash) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      onClick={() => navigate(`/app/knowledge-bases/edit/${kb.id}`)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: '7px',
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#7c3aed';
                        e.currentTarget.style.background = isDark
                          ? 'rgba(124,58,237,0.15)'
                          : '#ede9fe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Edit Knowledge Base"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => setDeletingKb(kb)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: '7px',
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = isDark
                          ? 'rgba(239,68,68,0.15)'
                          : '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Delete Knowledge Base"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* ── CREATE KNOWLEDGE BASE MODAL ────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => !submitting && setIsCreateModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: isDark ? '#141721' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Library size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Create New Knowledge Base
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: isDark ? '#94a3b8' : '#6b7280',
                    }}
                  >
                    Set up a repository of ground truth knowledge for your bots.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateKbSubmit} style={{ overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* KB Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  >
                    Knowledge Base Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKbName}
                    onChange={(e) => setNewKbName(e.target.value)}
                    placeholder="e.g. Customer Support KB, Product FAQs, API Docs"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? '#0c0e14' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newKbDesc}
                    onChange={(e) => setNewKbDesc(e.target.value)}
                    placeholder="Brief description of what knowledge is contained here..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? '#0c0e14' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Agents Using KB (Checkboxes) */}
                {userAgents.length > 0 && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        color: isDark ? '#e2e8f0' : '#374151',
                      }}
                    >
                      Attach to Agents
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: isDark ? '#0c0e14' : '#f9fafb',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      }}
                    >
                      {userAgents.map((ag) => {
                        const agId = ag.id || ag.agent_id;
                        const isChecked = selectedAgentIds.includes(agId);
                        return (
                          <label
                            key={agId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              color: isDark ? '#cbd5e1' : '#374151',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agId));
                                } else {
                                  setSelectedAgentIds([...selectedAgentIds, agId]);
                                }
                              }}
                              style={{ accentColor: '#7c3aed' }}
                            />
                            <span>{ag.display_name || ag.brand_name || 'Agent'}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Initial Data Source Intake */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  >
                    Add Initial Knowledge Source (Optional)
                  </label>

                  {/* Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {[
                      { id: 'text', label: 'Plain Text / FAQs', Icon: FileText },
                      { id: 'url', label: 'Website URL', Icon: Globe },
                      { id: 'file', label: 'File Upload', Icon: Upload },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSourceType(id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem',
                          borderRadius: '6px',
                          border: `1px solid ${
                            sourceType === id
                              ? '#7c3aed'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#e5e7eb'
                          }`,
                          background:
                            sourceType === id
                              ? isDark
                                ? 'rgba(124,58,237,0.2)'
                                : '#ede9fe'
                              : 'transparent',
                          color:
                            sourceType === id
                              ? '#7c3aed'
                              : isDark
                              ? '#94a3b8'
                              : '#6b7280',
                          fontSize: '0.78rem',
                          fontWeight: sourceType === id ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {sourceType === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={sourceTitle}
                        onChange={(e) => setSourceTitle(e.target.value)}
                        placeholder="Document Title (e.g. Return Policy, Pricing FAQ)"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                          background: isDark ? '#0c0e14' : '#f9fafb',
                          color: isDark ? '#ffffff' : '#111827',
                          fontSize: '0.84rem',
                          outline: 'none',
                        }}
                      />
                      <textarea
                        rows={3}
                        value={sourceContent}
                        onChange={(e) => setSourceContent(e.target.value)}
                        placeholder="Paste text or FAQ items here..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                          background: isDark ? '#0c0e14' : '#f9fafb',
                          color: isDark ? '#ffffff' : '#111827',
                          fontSize: '0.84rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {sourceType === 'url' && (
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/docs"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                        background: isDark ? '#0c0e14' : '#f9fafb',
                        color: isDark ? '#ffffff' : '#111827',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  )}

                  {sourceType === 'file' && (
                    <div
                      style={{
                        border: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => document.getElementById('kb-file-input')?.click()}
                    >
                      <input
                        id="kb-file-input"
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                      <Upload size={20} style={{ color: '#7c3aed', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {uploadedFileName || 'Click to select PDF, DOCX, TXT, or MD'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                    background: 'transparent',
                    color: isDark ? '#cbd5e1' : '#4b5563',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newKbName.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    background: '#7c3aed',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: submitting || !newKbName.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !newKbName.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Create Knowledge Base</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT KNOWLEDGE BASE MODAL ──────────────────────────────────────── */}
      {editingKb && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => !submitting && setEditingKb(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: isDark ? '#141721' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Edit3 size={18} style={{ color: '#7c3aed' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Edit Knowledge Base
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: isDark ? '#94a3b8' : '#6b7280',
                    }}
                  >
                    Modify name, description, and attached agents.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingKb(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditKbSubmit} style={{ overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  >
                    Knowledge Base Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingKb.name}
                    onChange={(e) => setEditingKb({ ...editingKb, name: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? '#0c0e14' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingKb.description || ''}
                    onChange={(e) => setEditingKb({ ...editingKb, description: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db'}`,
                      background: isDark ? '#0c0e14' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Attached Agents */}
                {userAgents.length > 0 && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        color: isDark ? '#e2e8f0' : '#374151',
                      }}
                    >
                      Attached Agents
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: isDark ? '#0c0e14' : '#f9fafb',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      }}
                    >
                      {userAgents.map((ag) => {
                        const agId = ag.id || ag.agent_id;
                        const currentAgents = editingKb.agent_ids || (editingKb.agents_using || []).map((a) => a.id || a.agent_id);
                        const isChecked = currentAgents.includes(agId);
                        return (
                          <label
                            key={agId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              color: isDark ? '#cbd5e1' : '#374151',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const nextIds = isChecked
                                  ? currentAgents.filter((id) => id !== agId)
                                  : [...currentAgents, agId];
                                setEditingKb({ ...editingKb, agent_ids: nextIds });
                              }}
                              style={{ accentColor: '#7c3aed' }}
                            />
                            <span>{ag.display_name || ag.brand_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingKb(null)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                    background: 'transparent',
                    color: isDark ? '#cbd5e1' : '#4b5563',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !editingKb.name.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    background: '#7c3aed',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ─────────────────────────────────────── */}
      {deletingKb && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => !submitting && setDeletingKb(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: isDark ? '#141721' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Trash2 size={22} />
            </div>

            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
              Delete Knowledge Base?
            </h3>
            <p
              style={{
                margin: '0 0 1.25rem 0',
                fontSize: '0.88rem',
                color: isDark ? '#94a3b8' : '#6b7280',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete <strong>"{deletingKb.name}"</strong>? Agents using this
              knowledge base will no longer draw from its documents.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingKb(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                  background: 'transparent',
                  color: isDark ? '#cbd5e1' : '#4b5563',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteKbConfirm}
                disabled={submitting}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
