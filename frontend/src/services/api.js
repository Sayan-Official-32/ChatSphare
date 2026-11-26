/**
 * @file api.js
 * @description Centralized API Service Layer for the ChatSphare React Frontend.
 *
 * Every function in this module maps to a Node.js BFF endpoint or FastAPI backend router endpoint.
 * React UI components import from this module and never execute raw `fetch` calls directly.
 *
 * Requests include `credentials: "include"` so the browser automatically transmits the HttpOnly
 * `bff_session` cookie managed securely by the backend server.
 */

/** Base URL prefix for all API calls. Uses VITE_API_URL if provided (e.g. on Vercel), else falls back to '/api'. */
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

/**
 * Generic fetch wrapper function for executing authenticated API requests.
 * Automatically attaches `credentials: 'include'` and standard JSON headers.
 * 
 * @async
 * @param {string} path - Relative API endpoint path (e.g. '/auth/me', '/crawl').
 * @param {RequestInit} [options={}] - Custom fetch options (method, body, headers).
 * @returns {Promise<any>} Parsed JSON response payload.
 * @throws {Error} Throws Error if response status is not OK (200-299).
 */
async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('chatsphare_token') || sessionStorage.getItem('chatsphare_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.detail || `API error ${response.status} on ${path}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Node.js BFF Session Endpoints (HttpOnly Cookie Management)
// ---------------------------------------------------------------------------

/**
 * Restores user profile and authentication state when the React app initializes.
 * Reads the caller's HttpOnly session cookie.
 * 
 * @async
 * @returns {Promise<{ authenticated: boolean, user: Object|null }>} User profile response object.
 */
export const fetchAuthMe = () => apiFetch('/auth/me');

/**
 * Exchanges a verified Firebase ID token for an HttpOnly `bff_session` cookie.
 * 
 * @async
 * @param {string} idToken - Raw Firebase JWT ID token string.
 * @param {Object} user - User metadata object (uid, email, displayName, photoURL).
 * @returns {Promise<{ authenticated: boolean, user: Object }>} Session confirmation response.
 */
export const createBFFSession = (idToken, user) =>
  apiFetch('/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      id_token: idToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        photoURL: user.photoURL || null,
      },
    }),
  });

/**
 * Updates the HttpOnly `bff_session` cookie when a refreshed Firebase token is generated.
 * 
 * @async
 * @param {string} idToken - Renewed Firebase ID token string.
 * @returns {Promise<{ authenticated: boolean }>} Session refresh status object.
 */
export const refreshBFFSession = (idToken) =>
  apiFetch('/auth/session/refresh', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });

/**
 * Destroys the user session and clears the HttpOnly `bff_session` cookie.
 * 
 * @async
 * @returns {Promise<{ authenticated: boolean }>} Logout response object.
 */
export const logoutBFFSession = () =>
  apiFetch('/auth/logout', { method: 'POST' });

/**
 * Fetches a server-generated vector SVG anti-bot challenge and signed HMAC token.
 * 
 * @async
 * @returns {Promise<{ status: string, captcha_token: string, svg: string, image_data_url: string, expires_in: number }>}
 */
export const fetchServerCaptcha = () => apiFetch(`/auth/captcha?_t=${Date.now()}`);

/**
 * Validates a user-entered CAPTCHA solution against the server-signed challenge token.
 * 
 * @async
 * @param {string} captchaToken - Server-issued HMAC token.
 * @param {string} userSolution - Code string entered by user.
 * @returns {Promise<{ status: string, message: string }>}
 */
export const verifyServerCaptcha = (captchaToken, userSolution) =>
  apiFetch('/auth/verify-captcha', {
    method: 'POST',
    body: JSON.stringify({ captcha_token: captchaToken, user_solution: userSolution }),
  });

/**
 * Resolves a username to its associated account login email without exposing database rows.
 * 
 * @async
 * @param {string} username - Target username.
 * @returns {Promise<{ found: boolean, email: string|null, display_name: string|null, message?: string }>}
 */
export const lookupEmailByUsername = (username) =>
  apiFetch('/auth/lookup-email', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });

/**
 * Checks if a username and/or email is available during account registration.
 * 
 * @async
 * @param {{ username?: string, email?: string }} payload - Check fields payload.
 * @returns {Promise<{ username_available: boolean, email_available: boolean, username_message: string|null, email_message: string|null }>}
 */
export const checkAccountAvailability = (payload) =>
  apiFetch('/auth/check-availability', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ---------------------------------------------------------------------------
// Business Agent & Operating Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetches the current user's agent state with nested knowledge items and tools attached.
 * 
 * @async
 * @returns {Promise<Object>} Complete agent dictionary object.
 */
export const fetchCurrentAgent = () => apiFetch('/agent/current');

/**
 * Lists all distinct bots created by the authenticated user (Level 1 & 2 Isolation).
 * 
 * @async
 * @returns {Promise<{ status: string, total_agents: number, agents: Array<Object> }>} List of user bots.
 */
export const fetchUserAgents = () => apiFetch('/agent/list');

/**
 * Fetches a specific isolated bot and its dedicated knowledge items by agent ID.
 * 
 * @async
 * @param {string} agentId - UUID of the target agent.
 * @returns {Promise<Object>} Isolated agent dictionary object.
 */
export const fetchAgentById = (agentId) => apiFetch(`/agent/${agentId}`);
export const fetchAgentDetails = (agentId) => apiFetch(`/agent/${agentId}`).catch(() => null);

/**
 * Fetches complete isolated project data for a given project_id.
 * 
 * @async
 * @param {string} projectId - Project ID / Key.
 * @returns {Promise<{ status: string, project: Object }>} Isolated project bundle object.
 */
export const fetchProjectDetails = (projectId) => apiFetch(`/agent/project/${projectId}`);

/**
 * Persists updated agent configurations (name, model, system prompt, knowledge attachments, tools).
 * 
 * @async
 * @param {Object} configPayload - Agent configuration settings.
 * @param {string} [agentId] - Target agent UUID.
 * @returns {Promise<Object>} Save response.
 */
export const saveAgentBrandConfig = async (configPayload, agentId = null) => {
  try {
    return await apiFetch('/agent/brand-config', {
      method: 'POST',
      body: JSON.stringify({ ...configPayload, agent_id: agentId || configPayload?.agent_id }),
    });
  } catch {
    return saveWizardDraft({ ...configPayload, agent_id: agentId || configPayload?.agent_id });
  }
};

/**
 * Synthesizes a structured 5-6 sentence Brand Summary and persona fields using Mistral LLM via LangChain.
 * 
 * @async
 * @param {Object} payload - Brand details (brand_name, domain, meta_description, text_content).
 * @returns {Promise<{ status: string, model: string, brand_description: string, role: string, greeting: string, tone: string, system_prompt: string }>}
 */
export const generateBrandSummary = (payload) =>
  apiFetch('/brand/generate-summary', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/**
 * Deletes a specific bot and cascades deletion to its documents, chunks, QA pairs, and chats.
 * 
 * @async
 * @param {string} agentId - UUID of the agent to delete.
 * @returns {Promise<{ status: string, message: string }>} Deletion confirmation.
 */
export const deleteAgent = (agentId) => apiFetch(`/agent/${agentId}`, { method: 'DELETE' });

/**
 * Triggers the vector indexing pipeline for an agent and returns performance metrics.
 * 
 * @async
 * @returns {Promise<{ status: string, agent_id: string, metrics: Object }>} Indexing status response.
 */
export const processAgentPipeline = () =>
  apiFetch('/agent/process', { method: 'POST' });

/**
 * Fetches the user's active in-progress wizard draft and sub-session history.
 * 
 * @async
 * @returns {Promise<{ status: string, has_draft: boolean, current_step: number, draft: Object|null, sub_sessions: Array<Object> }>}
 */
export const fetchActiveWizardDraft = () => apiFetch('/agent/draft');

/**
 * Saves or updates the user's in-progress wizard draft without creating duplicate bots.
 * 
 * @async
 * @param {Object} draftPayload - In-progress wizard draft dictionary.
 * @returns {Promise<{ status: string, has_draft: boolean, agent_id: string, current_step: number, draft: Object }>}
 */
export const saveWizardDraft = (draftPayload) =>
  apiFetch('/agent/draft', {
    method: 'POST',
    body: JSON.stringify(draftPayload),
  });

/**
 * Discards the user's in-progress wizard draft to start fresh from Step 1.
 * 
 * @async
 * @returns {Promise<{ status: string, message: string }>}
 */
export const discardWizardDraft = () =>
  apiFetch('/agent/draft', { method: 'DELETE' });

/**
 * Saves an immutable stage-by-stage sub-session snapshot when clicking 'Next' on any stage.
 * 
 * @async
 * @param {Object} sessionPayload - { agent_id, stage_number, stage_name, snapshot_data }
 * @returns {Promise<{ status: string, agent_id: string, stage_number: number, stage_name: string, snapshot_saved: boolean }>}
 */
export const saveSubSession = (sessionPayload) =>
  apiFetch('/agent/sub-session', {
    method: 'POST',
    body: JSON.stringify(sessionPayload),
  });

/**
 * Finalizes the 5-step agent creation workflow, marking the agent as published and completing the task.
 * 
 * @async
 * @param {string} agentId - UUID of the agent to publish.
 * @returns {Promise<{ status: string, agent_id: string, is_published: boolean, workflow_completed: boolean, message: string }>}
 */
export const publishAgent = (agentId) =>
  apiFetch(`/agent/${agentId}/publish`, { method: 'POST' });
export const publishAgentWorkflow = (dummy, agentId) =>
  publishAgent(agentId);

/**
 * Atomically commits Steps 1, 2, and 3 data to Supabase when Stage 3 is completed.
 * 
 * @async
 * @param {Object} setupPayload - Complete setup payload ({ brand, agent, knowledge_items }).
 * @returns {Promise<Object>} Commit response with agent_id, brand_id, and indexing metrics.
 */
export const commitAgentSetup = (setupPayload) =>
  apiFetch('/agent/setup-commit', {
    method: 'POST',
    body: JSON.stringify(setupPayload),
  });

/**
 * Fetches HTML script tag and cURL embed code snippets for deploying the widget.
 * 
 * @async
 * @returns {Promise<{ widget_script: string, api_curl: string, active_channels: Array<string> }>} Snippets response.
 */
export const fetchEmbedCode = () =>
  apiFetch('/publish/embed-code', { method: 'POST' });

// ---------------------------------------------------------------------------
// Step 1: Start / Web Crawling
// ---------------------------------------------------------------------------

/**
 * Kicks off background website crawl, metadata extraction, and AI brand synthesis.
 * 
 * @async
 * @param {string} targetUrl - Target website URL string to crawl.
 * @returns {Promise<Object>} Extracted agent brand metadata dictionary.
 */
export const crawlWebsite = (targetUrl) =>
  apiFetch('/crawl', {
    method: 'POST',
    body: JSON.stringify({ url: targetUrl, target_url: targetUrl }),
  });

// ---------------------------------------------------------------------------
// Step 2: Brand Configuration
// ---------------------------------------------------------------------------

/**
 * Persists brand identity, theme colors, logo URL, and widget customization settings.
 * 
 * @async
 * @param {Object} brandPayload - Brand configuration fields object.
 * @returns {Promise<Object>} Saved brand response status and agent object.
 */
export const saveBrandConfig = (brandPayload) =>
  apiFetch('/brand/save', {
    method: 'POST',
    body: JSON.stringify(brandPayload),
  });

// ---------------------------------------------------------------------------
// Step 3: Knowledge Management
// ---------------------------------------------------------------------------

/**
 * Adds a new text document or web page snippet to the agent's Knowledge Base.
 * 
 * @async
 * @param {Object} item - Knowledge item fields object (title, type, source, content).
 * @returns {Promise<Object>} Created knowledge item response.
 */
export const addKnowledgeItem = (item, agentId = null) =>
  apiFetch('/knowledge/upload', {
    method: 'POST',
    body: JSON.stringify({ ...item, agent_id: agentId || item.agent_id }),
  });

/**
 * Uploads a raw binary document (PDF, DOCX, PPTX, HTML, etc.) using multipart form data.
 * 
 * @async
 * @param {File} file - File object to upload.
 * @param {string} [type='Document'] - Category type.
 * @param {string} [source='File Upload'] - Source description.
 * @param {string} [agentId=null] - Target agent identifier.
 * @returns {Promise<Object>} Created knowledge item response.
 */
export const uploadKnowledgeFile = (file, type = 'Document', source = 'File Upload', agentId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('source', source);
  if (agentId) {
    formData.append('agent_id', agentId);
  }
  return apiFetch('/knowledge/upload-file', {
    method: 'POST',
    body: formData,
  });
};

/**
 * Crawls target website URL, extracts structured content, and indexes REAL text into Knowledge Base.
 * 
 * @async
 * @param {string} url - Target website URL string.
 * @param {string} [agentId=null] - Target agent identifier.
 * @returns {Promise<Object>} Crawled knowledge item response payload.
 */
export const crawlWebsiteKnowledge = (url, agentId = null) =>
  apiFetch('/knowledge/website', {
    method: 'POST',
    body: JSON.stringify({ url, agent_id: agentId }),
  });

/**
 * Executes a vector similarity search across the agent's knowledge index.
 * 
 * @async
 * @param {string} query - Search question or prompt string.
 * @param {string} [agentId=null] - Target agent identifier.
 * @returns {Promise<Object>} Similarity search results object.
 */
export const searchKnowledge = (query, agentId = null) =>
  apiFetch('/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, agent_id: agentId }),
  });

// ---------------------------------------------------------------------------
// Step 4: Tools & Connect Phase Integrations
// ---------------------------------------------------------------------------

/**
 * Fetches the categorized tools marketplace catalog with live connection states for the agent.
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @returns {Promise<{ status: string, agent_id: string, tools: Array<Object> }>} Tools catalog response.
 */
export const fetchToolsCatalog = (agentId) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}`);

/**
 * Enables or disables an integration tool capability for an agent.
 * 
 * @async
 * @param {string} toolId - Target tool identifier string (e.g. 'google_calendar').
 * @param {boolean} enabled - Activation state flag.
 * @param {string} [agentId] - Target agent UUID.
 * @returns {Promise<Object>} Updated tool status response.
 */
export const toggleTool = (toolId, enabled, agentId = null) =>
  apiFetch('/tools/toggle', {
    method: 'POST',
    body: JSON.stringify({ tool_id: toolId, enabled, agent_id: agentId }),
  });

/**
 * Saves custom configuration settings for a tool (e.g. Lead Capture fields, trigger settings).
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @param {string} toolId - Target tool identifier.
 * @param {Object} configuration - Configuration dictionary.
 * @param {boolean} [enabled] - Optional new enabled state.
 * @returns {Promise<Object>} Saved configuration response.
 */
export const configureTool = (agentId, toolId, configuration, enabled = null) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}/configure`, {
    method: 'POST',
    body: JSON.stringify({ tool_id: toolId, configuration, enabled }),
  });

/**
 * Connects Google Workspace OAuth integrations (Google Calendar, Sheets, Drive) and unlocks the tool.
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @param {string} toolId - Target tool identifier.
 * @param {Object} [authData={}] - Authentication data / token payload.
 * @param {Object} [configuration={}] - Specific tool configuration (spreadsheet_id, calendar_id).
 * @returns {Promise<Object>} Connected status response.
 */
export const connectOAuthTool = (agentId, toolId, authData = {}, configuration = {}) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}/oauth/connect`, {
    method: 'POST',
    body: JSON.stringify({
      tool_id: toolId,
      provider: 'google',
      auth_data: authData,
      configuration: configuration,
    }),
  });

/**
 * Disconnects an OAuth integration and re-locks the tool.
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @param {string} toolId - Target tool identifier.
 * @returns {Promise<Object>} Disconnected status response.
 */
export const disconnectOAuthTool = (agentId, toolId) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}/oauth/disconnect?tool_id=${toolId}`, {
    method: 'POST',
  });

/**
 * Executes or tests a live tool action (e.g. book calendar event, append row to sheets, capture lead).
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @param {string} toolId - Target tool identifier.
 * @param {string} action - Action name (e.g. 'book_meeting', 'append_row', 'capture_lead').
 * @param {Object} payload - Action arguments payload.
 * @returns {Promise<Object>} Execution result response.
 */
export const executeToolAction = (agentId, toolId, action, payload = {}) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}/action`, {
    method: 'POST',
    body: JSON.stringify({ tool_id: toolId, action, payload }),
  });

/**
 * Fetches all captured visitor leads for the agent.
 * 
 * @async
 * @param {string} agentId - UUID of the agent.
 * @returns {Promise<{ status: string, total_leads: number, leads: Array<Object> }>} Captured leads response.
 */
export const fetchCapturedLeads = (agentId) =>
  apiFetch(`/tools/${agentId || 'agent-cb-99'}/leads`);

// ---------------------------------------------------------------------------
// Step 5: Playground Chat
// ---------------------------------------------------------------------------

/**
 * Sends messages to the agent inside the Step 5 Playground simulator with session & agent isolation.
 * 
 * @async
 * @param {Array} messages - Chronological chat history messages list.
 * @param {string} [agentId] - Target agent UUID.
 * @param {string} [conversationId] - Target conversation session UUID.
 * @returns {Promise<Object>} Assistant response turn object with metadata.
 */
export const sendPlaygroundMessage = (messages, agentId = null, conversationId = null) =>
  apiFetch('/playground/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      agent_id: agentId,
      conversation_id: conversationId,
    }),
  });

/**
 * Fetches real historical conversation sessions stored in Supabase database for an agent.
 * 
 * @async
 * @param {string} [agentId] - Target agent UUID.
 * @returns {Promise<{ status: string, conversations: Array<Object> }>}
 */
export const fetchPlaygroundConversations = (agentId = null) =>
  apiFetch(agentId ? `/playground/conversations?agent_id=${encodeURIComponent(agentId)}` : '/playground/conversations');

/**
 * Fetches exact chronological chat messages for a conversation session.
 * 
 * @async
 * @param {string} conversationId - Conversation session UUID.
 * @returns {Promise<{ status: string, conversation_id: string, messages: Array<Object> }>}
 */
export const fetchPlaygroundConversationMessages = (conversationId) =>
  apiFetch(`/playground/conversations/${encodeURIComponent(conversationId)}`);

/**
 * Deletes a specific conversation session and its messages from Supabase database.
 * 
 * @async
 * @param {string} conversationId - Conversation session UUID.
 * @returns {Promise<{ status: string, message: string, conversation_id: string }>}
 */
export const deletePlaygroundConversation = (conversationId) =>
  apiFetch(`/playground/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
  });

/**
 * Synthesizes structured system instructions using mistral-small-latest.
 * 
 * @async
 * @param {Object} brandData - Brand details payload.
 * @returns {Promise<{ status: string, model: string, system_prompt: string, instructions: string }>} Generated instructions.
 */
export const generateAgentInstructions = (brandData) =>
  apiFetch('/agent/generate-instructions', {
    method: 'POST',
    body: JSON.stringify(brandData),
  });

/**
 * Fetches AI instruction generation quota and usage limits for the authenticated user.
 * 
 * @async
 * @returns {Promise<{ status: string, quota: { user_id: string, plan_tier: string, is_normal_user: boolean, used: number, max_allowed: number|null, remaining: number|null, can_generate: boolean } }>}
 */
export const fetchAiInstructionsQuota = () =>
  apiFetch('/agent/instructions-quota');

/**
 * Fetches available AI models dynamically filtered by configured API keys in environment.
 * 
 * @async
 * @returns {Promise<{ status: string, models: Array<Object> }>} Available models response.
 */
export const fetchAvailableModels = () =>
  apiFetch('/agent/available-models');


// ---------------------------------------------------------------------------
// Knowledge Base Collections Management
// ---------------------------------------------------------------------------

/**
 * Fetches Knowledge Bases accessible to the authenticated user,
 * optionally scoped by project (`projectId`).
 * 
 * @async
 * @param {string} [projectId] - Optional Project/Brand ID key.
 * @returns {Promise<{ status: string, total: number, knowledge_bases: Array<Object> }>}
 */
export const fetchKnowledgeBases = (projectId = null) =>
  apiFetch(projectId ? `/knowledge/bases?project_id=${encodeURIComponent(projectId)}` : '/knowledge/bases');

/**
 * Fetches detailed Knowledge Base data for the edit view,
 * including pre-filled files, websites, texts, Q&A pairs, and live character counts.
 * 
 * @async
 * @param {string} kbId - Knowledge Base ID.
 * @returns {Promise<{ status: string, knowledge_base: Object }>}
 */
export const fetchKnowledgeBaseDetails = (kbId) => apiFetch(`/knowledge/bases/${kbId}`);

/**
 * Creates a new Knowledge Base collection.
 * 
 * @async
 * @param {Object} payload - { name, description, status, agent_ids, documents }
 * @returns {Promise<{ status: string, knowledge_base: Object }>}
 */
export const createKnowledgeBase = (payload) =>
  apiFetch('/knowledge/bases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/**
 * Updates a Knowledge Base metadata and agent links.
 * 
 * @async
 * @param {string} kbId - Knowledge Base ID.
 * @param {Object} payload - { name, description, status, agent_ids }
 * @returns {Promise<{ status: string, knowledge_base: Object }>}
 */
export const updateKnowledgeBase = (kbId, payload) =>
  apiFetch(`/knowledge/bases/${kbId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

/**
 * Deletes a Knowledge Base collection.
 * 
 * @async
 * @param {string} kbId - Knowledge Base ID.
 * @returns {Promise<{ status: string, deleted_kb_id: string }>}
 */
export const deleteKnowledgeBase = (kbId) =>
  apiFetch(`/knowledge/bases/${kbId}`, {
    method: 'DELETE',
  });

// ---------------------------------------------------------------------------
// Subscription & Promo Code Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetches the currently authenticated user's subscription and plan tier details.
 * 
 * @async
 * @returns {Promise<{ user_id: string, plan_tier: string, display_plan: string, is_paid: boolean, active_subscription: Object|null }>}
 */
export const fetchCurrentSubscription = () =>
  apiFetch('/subscription/current', { method: 'GET' });

/**
 * Validates a promo code against active database promo passes for a given plan tier.
 * 
 * @async
 * @param {string} code - The promo code to validate.
 * @param {string} targetPlan - Target plan tier ('explorer', 'builder', 'scale').
 * @returns {Promise<{ valid: boolean, code: string, plan_tier: string, discount_percent: number, description: string, message: string }>}
 */
export const validatePromoCode = (code, targetPlan) =>
  apiFetch('/subscription/validate-promocode', {
    method: 'POST',
    body: JSON.stringify({ code, target_plan: targetPlan }),
  });

/**
 * Redeems an authorized promo code and upgrades the user's subscription in Supabase.
 * 
 * @async
 * @param {Object} payload - { code, plan_tier, billing_cycle, currency }
 * @returns {Promise<{ status: string, message: string, plan_tier: string, display_plan: string, billing_cycle: string, renews_at: string }>}
 */
export const applySubscriptionPromoCode = (payload) =>
  apiFetch('/subscription/apply-promocode', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ---------------------------------------------------------------------------
// User Profile & Teamspace API Keys Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetches the user profile and preferences directly from Supabase public.users.
 * 
 * @async
 * @returns {Promise<{ id: string, email: string, display_name: string, photo_url: string|null, plan_tier: string, created_at: string, preferences: Object }>}
 */
export const fetchUserProfile = () =>
  apiFetch('/user/profile', { method: 'GET' });

/**
 * Updates the user's display name, avatar photo, or preferences in public.users.
 * 
 * @async
 * @param {Object} payload - { display_name?: string, photo_url?: string, preferences?: Object }
 * @returns {Promise<Object>} Updated profile object.
 */
export const updateUserProfile = (payload) =>
  apiFetch('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

/**
 * Removes the custom avatar photo in public.users, reverting to user initials.
 * 
 * @async
 * @returns {Promise<Object>} Refreshed profile object.
 */
export const removeUserPhoto = () =>
  apiFetch('/user/profile/photo', { method: 'DELETE' });

/**
 * Lists active teamspace API runtime keys.
 * 
 * @async
 * @returns {Promise<Array<Object>>}
 */
export const fetchTeamspaceApiKeys = () =>
  apiFetch('/user/api-keys', { method: 'GET' });

/**
 * Generates a new scoped teamspace runtime API key.
 * 
 * @async
 * @param {string} name - Friendly label for the API key.
 * @returns {Promise<{ id: string, name: string, secret_key: string, key_prefix: string, key_hash: string, created_at: string }>}
 */
export const createTeamspaceApiKey = (name) =>
  apiFetch('/user/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

/**
 * Revokes / deletes a teamspace API key.
 * 
 * @async
 * @param {string} keyId - API key UUID.
 * @returns {Promise<{ status: string, message: string }>}
 */
export const revokeTeamspaceApiKey = (keyId) =>
  apiFetch(`/user/api-keys/${keyId}`, { method: 'DELETE' });

/**
 * Fetches user credit balance, monthly allowance, and model rate costs.
 * 
 * @async
 * @returns {Promise<{ total: number, used: number, remaining: number, remaining_percent: number, plan_tier: string, cycle_end: string, model_costs: Object }>}
 */
export const fetchUserCredits = () =>
  apiFetch('/user/credits', { method: 'GET' });

/**
 * Fetches recent credit transactions for the authenticated user.
 * 
 * @async
 * @returns {Promise<Array<Object>>}
 */
export const fetchCreditHistory = () =>
  apiFetch('/user/credits/history', { method: 'GET' });



