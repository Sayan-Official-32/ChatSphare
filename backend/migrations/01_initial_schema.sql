-- ==============================================================================
-- ChatSphare Platform: Initial Database Migration (01_initial_schema.sql)
-- Target: Supabase PostgreSQL 15+ with pgvector
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- 2. Users & Authentication
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    auth_provider TEXT DEFAULT 'firebase',
    email_verified BOOLEAN DEFAULT FALSE,
    plan_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==============================================================================
-- 3. Brands (Visual Identity & Crawled Brand DNA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    website_url TEXT,
    canonical_domain TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    secondary_color TEXT DEFAULT '#4f46e5',
    font_family TEXT DEFAULT 'Inter',
    brand_description TEXT,
    industry TEXT,
    brand_guidelines JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

-- ==============================================================================
-- 4. Agents (Configured Conversational Representatives)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'Customer Support Specialist',
    tone TEXT DEFAULT 'Professional & Helpful',
    system_prompt TEXT,
    custom_instructions TEXT,
    greeting_message TEXT DEFAULT 'Hello! How can I help you today?',
    is_default BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    current_version INT DEFAULT 1,
    widget_settings JSONB DEFAULT '{"theme": "Light", "position": "Right", "placeholder": "Type your message..."}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_brand_id ON public.agents(brand_id);

-- ==============================================================================
-- 5. Knowledge Base Documents (Crawled Pages & Uploaded Files)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT DEFAULT 'web_crawl', -- 'web_crawl', 'pdf', 'docx', 'manual_faq'
    source_url TEXT,
    content TEXT,
    character_count INT DEFAULT 0,
    word_count INT DEFAULT 0,
    token_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_agent_id ON public.documents(agent_id);

-- ==============================================================================
-- 6. Knowledge Chunks with 1024-d Vector Embeddings (BGE-M3)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    chunk_index INT DEFAULT 0,
    chunk_text TEXT NOT NULL,
    raw_text TEXT,
    heading_hierarchy TEXT[],
    content_hash TEXT,
    embedding VECTOR(1024),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent_id ON public.knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON public.knowledge_chunks(document_id);

-- 7. HNSW Cosine Distance Vector Index (Ultra-fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
ON public.knowledge_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ==============================================================================
-- 8. Chat Conversations & Messages
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    user_ip TEXT,
    browser TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_agent_id ON public.chat_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_visitor_id ON public.chat_conversations(visitor_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    message TEXT NOT NULL,
    token_count INT DEFAULT 0,
    response_time INT DEFAULT 0, -- In milliseconds
    citations JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- ==============================================================================
-- 9. Leads Captured by Embedded Widget / Fullscreen Agent
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    custom_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON public.leads(agent_id);

-- ==============================================================================
-- 10. Billing, Credits Accounting & Promo Codes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    plan_tier TEXT DEFAULT 'free',
    monthly_allowance INT DEFAULT 2000,
    monthly_used INT DEFAULT 0,
    topup_credits INT DEFAULT 0,
    cycle_start TIMESTAMPTZ DEFAULT NOW(),
    cycle_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id TEXT,
    conversation_id TEXT,
    model_used TEXT,
    credits_deducted INT NOT NULL,
    action_type TEXT DEFAULT 'chat_query',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    plan_tier TEXT DEFAULT 'pro',
    credits_bonus INT DEFAULT 5000,
    max_redemptions INT DEFAULT 100,
    redemptions_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. Stored Procedure: RAG Cosine Similarity Vector Search
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding VECTOR(1024),
    match_agent_id UUID,
    match_count INT DEFAULT 4,
    similarity_threshold FLOAT DEFAULT 0.20
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    heading_hierarchy TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.document_id,
        kc.chunk_text,
        kc.heading_hierarchy,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_chunks kc
    WHERE kc.agent_id = match_agent_id
      AND 1 - (kc.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY kc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
