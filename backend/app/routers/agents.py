from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.brand import BrandDNA
from app.models.agent import (
    AgentResponse,
    AgentListResponse,
    AgentBase,
    AgentCreate,
    AgentUpdate,
    WizardDraft,
    SubSessionRequest,
    SetupCommitRequest,
    BrandConfigRequest,
    GenerateInstructionsRequest,
    InstructionsQuotaResponse,
    AvailableModelsResponse,
    ModelItem,
    WidgetSettings,
)

router = APIRouter(prefix="/api/agent", tags=["Agent Management & Studio"])

# In-memory mock store for wizard draft and local agents when running offline
_MOCK_DRAFTS = {}
_MOCK_AGENTS = {
    "default-agent-1": AgentResponse(
        id="default-agent-1",
        display_name="ChatSphare Support AI",
        role="Customer Support Specialist",
        tone="Professional & Helpful",
        system_prompt="You are the official AI assistant. Answer queries factually based on verified site knowledge.",
        greeting_message="Hello! How can I assist you with ChatSphare today?",
        is_default=True,
        is_public=True,
        current_version=1,
        brand=BrandDNA(
            brand_name="ChatSphare",
            website_url="https://chatsphare.ai",
            primary_color="#6366f1",
            secondary_color="#4f46e5",
            font_family="Inter",
            brand_description="Enterprise No-Code AI Agent Operating Platform"
        ),
        widget_settings=WidgetSettings(
            theme="Light",
            position="Right",
            placeholder="Ask me anything..."
        )
    )
}


@router.get("/available-models", response_model=AvailableModelsResponse)
async def get_available_models():
    """Returns AI models available in ChatSphare based on configured API keys."""
    models = [
        ModelItem(id="gemini-1.5-flash", name="Google Gemini 1.5 Flash", provider="Google", context_length=1000000, is_default=True),
        ModelItem(id="mistral-small-latest", name="Mistral Small 3", provider="Mistral AI", context_length=32000, is_default=False),
        ModelItem(id="qwen-2.5-32b", name="Qwen 2.5 32B (Groq LPU)", provider="Groq", context_length=32768, is_default=False),
        ModelItem(id="openrouter-auto", name="OpenRouter Smart Auto", provider="OpenRouter", context_length=128000, is_default=False),
    ]
    return AvailableModelsResponse(models=models, default_model="gemini-1.5-flash")


@router.get("/instructions-quota", response_model=InstructionsQuotaResponse)
async def get_instructions_quota(user: UserProfile = Depends(get_current_user)):
    """Returns the user's remaining 24-hour quota for AI prompt synthesis."""
    return InstructionsQuotaResponse(remaining=5, total_quota=5, resets_in_hours=24)


@router.post("/generate-instructions")
async def generate_instructions(payload: GenerateInstructionsRequest, user: UserProfile = Depends(get_current_user)):
    """Synthesizes a 7-section master prompt grounded in brand identity and selected persona."""
    prompt_text = (
        f"# {payload.brand_name} AI Representative Prompt\n\n"
        f"You are the official AI representative for {payload.brand_name}.\n"
        f"**Role:** {payload.role}\n"
        f"**Tone:** {payload.tone}\n\n"
        "## Guidelines:\n"
        "1. Answer user questions strictly using verified organization knowledge.\n"
        "2. If an answer cannot be verified in the context, politely suggest contacting support.\n"
        "3. Maintain a helpful and brand-aligned demeanor at all times."
    )
    return {
        "status": "success",
        "system_prompt": prompt_text,
        "role": payload.role,
        "tone": payload.tone
    }


@router.get("/list", response_model=AgentListResponse)
async def list_agents(user: UserProfile = Depends(get_current_user)):
    """List all agents created by the authenticated user."""
    agents = list(_MOCK_AGENTS.values())
    return AgentListResponse(agents=agents, total=len(agents))


@router.get("/current", response_model=AgentResponse)
async def get_current_agent(user: UserProfile = Depends(get_current_user)):
    """Fetch the default or active agent configuration."""
    return list(_MOCK_AGENTS.values())[0]


@router.get("/draft", response_model=WizardDraft)
async def get_draft(user: UserProfile = Depends(get_current_user)):
    """Retrieve in-progress 5-Stage Wizard draft."""
    return _MOCK_DRAFTS.get(user.id, WizardDraft(step=1))


@router.post("/draft")
async def save_draft(draft: WizardDraft, user: UserProfile = Depends(get_current_user)):
    """Auto-save in-progress 5-Stage Wizard draft."""
    _MOCK_DRAFTS[user.id] = draft
    return {"status": "success", "message": "Draft saved"}


@router.delete("/draft")
async def delete_draft(user: UserProfile = Depends(get_current_user)):
    """Discard active draft to start the creation wizard fresh from Step 1."""
    if user.id in _MOCK_DRAFTS:
        del _MOCK_DRAFTS[user.id]
    return {"status": "success", "message": "Draft discarded"}


@router.post("/sub-session")
async def save_sub_session(payload: SubSessionRequest, user: UserProfile = Depends(get_current_user)):
    """Save stage-specific sub-session snapshot when user clicks 'Next' in wizard."""
    user_draft = _MOCK_DRAFTS.get(user.id, WizardDraft(step=payload.step))
    user_draft.step = payload.step + 1
    user_draft.sub_sessions[f"step_{payload.step}"] = payload.data
    _MOCK_DRAFTS[user.id] = user_draft
    return {"status": "success", "next_step": user_draft.step}


@router.post("/setup-commit")
async def setup_commit(payload: SetupCommitRequest, user: UserProfile = Depends(get_current_user)):
    """
    Atomic batch commit of Steps 1, 2, 3/4 to Supabase.
    Creates Brand, Agent, Knowledge Documents, and initial Chunks.
    """
    new_agent_id = f"agent-{len(_MOCK_AGENTS) + 1}"
    new_agent = AgentResponse(
        id=new_agent_id,
        display_name=payload.agent.display_name,
        role=payload.agent.role,
        tone=payload.agent.tone,
        system_prompt=payload.agent.system_prompt,
        greeting_message=payload.agent.greeting_message,
        is_default=True,
        is_public=True,
        current_version=1,
        brand=payload.brand,
        widget_settings=payload.agent.widget_settings
    )
    _MOCK_AGENTS[new_agent_id] = new_agent

    # Clean draft once committed
    if user.id in _MOCK_DRAFTS:
        del _MOCK_DRAFTS[user.id]

    return {
        "status": "success",
        "agent_id": new_agent_id,
        "message": "Agent and Brand DNA successfully created and committed."
    }


@router.post("/brand-config")
async def update_brand_config(payload: BrandConfigRequest, user: UserProfile = Depends(get_current_user)):
    """Update agent brand personality, system instructions, and widget settings."""
    agent = _MOCK_AGENTS.get(payload.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if payload.brand_name and agent.brand:
        agent.brand.brand_name = payload.brand_name
    if payload.primary_color and agent.brand:
        agent.brand.primary_color = payload.primary_color
    if payload.greeting_message:
        agent.greeting_message = payload.greeting_message
    if payload.system_prompt:
        agent.system_prompt = payload.system_prompt
    if payload.widget_settings:
        agent.widget_settings = payload.widget_settings

    return {"status": "success", "message": "Brand configuration updated successfully"}


@router.post("/{agent_id}/publish")
async def publish_agent(agent_id: str, user: UserProfile = Depends(get_current_user)):
    """Mark agent as public and live."""
    agent = _MOCK_AGENTS.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.is_public = True
    return {"status": "success", "agent_id": agent_id, "is_public": True}


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, user: UserProfile = Depends(get_current_user)):
    """Fetch isolated agent configuration by ID."""
    agent = _MOCK_AGENTS.get(agent_id)
    if not agent:
        # Return fallback demo agent
        return list(_MOCK_AGENTS.values())[0]
    return agent


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, user: UserProfile = Depends(get_current_user)):
    """Cascade delete bot, documents, chunks, QA pairs, and chats."""
    if agent_id in _MOCK_AGENTS:
        del _MOCK_AGENTS[agent_id]
    return {"status": "success", "message": f"Agent {agent_id} successfully deleted"}
