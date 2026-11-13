from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.tool import (
    ToolCatalogResponse,
    ToolDefinition,
    ToolToggleRequest,
    ToolConfigureRequest,
    LeadListResponse,
    LeadResponse,
    ToolActionRequest,
    ToolActionResponse,
)

router = APIRouter(prefix="/api/tools", tags=["Tools & Integrations"])

_MOCK_LEADS = [
    LeadResponse(
        id="lead-1",
        agent_id="default-agent-1",
        conversation_id="conv-101",
        name="Sarah Jenkins",
        email="sarah.j@enterprise.com",
        phone="+1 (555) 234-5678",
        custom_data={"inquiry": "Enterprise pricing demo"},
        created_at="2026-11-13T06:15:00Z"
    ),
    LeadResponse(
        id="lead-2",
        agent_id="default-agent-1",
        conversation_id="conv-102",
        name="Alex Rivera",
        email="alex@growthstartup.io",
        phone="+1 (555) 876-5432",
        custom_data={"inquiry": "Custom widget integration"},
        created_at="2026-11-13T06:40:00Z"
    )
]


def _get_base_tools():
    return [
        ToolDefinition(
            id="lead_capture",
            name="Lead Capture Form",
            description="Collect visitor contact information (name, email, phone) before or during chat conversation.",
            category="lead_generation",
            enabled=True,
            current_config={"require_email": True, "require_phone": False, "heading": "Get in touch with our team"}
        ),
        ToolDefinition(
            id="booking_calendar",
            name="Meeting Scheduler",
            description="Allow customers to schedule demo appointments directly in the chat widget.",
            category="scheduling",
            enabled=False,
            current_config={"calendar_link": "https://cal.com/your-brand"}
        ),
        ToolDefinition(
            id="custom_webhook",
            name="Outbound Webhook",
            description="POST lead submissions and conversation summaries to your CRM or Zapier endpoint.",
            category="integration",
            enabled=False,
            current_config={"endpoint_url": ""}
        )
    ]


@router.get("/available", response_model=List[ToolDefinition])
async def get_available_tools(user: UserProfile = Depends(get_current_user)):
    """List of all available integrations and tools in ChatSphare."""
    return _get_base_tools()


@router.get("/{agent_id}", response_model=ToolCatalogResponse)
async def get_agent_tools_catalog(agent_id: str = "default-agent-1", user: UserProfile = Depends(get_current_user)):
    """Catalog of tools configured for a specific agent."""
    return ToolCatalogResponse(agent_id=agent_id, tools=_get_base_tools())


@router.post("/toggle")
async def toggle_tool(payload: ToolToggleRequest, user: UserProfile = Depends(get_current_user)):
    """Enable or disable a specific tool for the agent."""
    return {
        "status": "success",
        "agent_id": payload.agent_id,
        "tool_id": payload.tool_id,
        "enabled": payload.enabled
    }


@router.post("/{agent_id}/configure")
async def configure_tool(agent_id: str, payload: ToolConfigureRequest, user: UserProfile = Depends(get_current_user)):
    """Update configuration properties for an enabled tool."""
    return {"status": "success", "agent_id": agent_id, "config": payload.config}


@router.get("/{agent_id}/leads", response_model=LeadListResponse)
@router.get("/leads", response_model=LeadListResponse)
async def get_leads(agent_id: Optional[str] = None, user: UserProfile = Depends(get_current_user)):
    """Retrieve captured visitor leads for the agent."""
    return LeadListResponse(leads=_MOCK_LEADS, total=len(_MOCK_LEADS))


@router.post("/{agent_id}/action", response_model=ToolActionResponse)
async def execute_tool_action(agent_id: str, payload: ToolActionRequest, user: UserProfile = Depends(get_current_user)):
    """Execute a tool action invocation during a chat turn."""
    return ToolActionResponse(
        tool_id=payload.tool_id,
        success=True,
        result={"status": "captured", "timestamp": "2026-11-13T07:00:00Z"},
        message="Tool executed successfully"
    )
