from typing import List, Optional, Dict, Any
from pydantic import Field, EmailStr
from app.models.base import BaseSchema


class ToolDefinition(BaseSchema):
    id: str
    name: str
    description: str
    category: str
    enabled: bool = False
    requires_auth: bool = False
    config_schema: Dict[str, Any] = Field(default_factory=dict)
    current_config: Dict[str, Any] = Field(default_factory=dict)


class ToolCatalogResponse(BaseSchema):
    agent_id: str
    tools: List[ToolDefinition] = Field(default_factory=list)


class ToolToggleRequest(BaseSchema):
    agent_id: str
    tool_id: str
    enabled: bool


class ToolConfigureRequest(BaseSchema):
    config: Dict[str, Any]


class LeadResponse(BaseSchema):
    id: str
    agent_id: str
    conversation_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    custom_data: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None


class LeadListResponse(BaseSchema):
    leads: List[LeadResponse] = Field(default_factory=list)
    total: int = 0


class ToolActionRequest(BaseSchema):
    tool_id: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ToolActionResponse(BaseSchema):
    tool_id: str
    success: bool
    result: Any
    message: Optional[str] = None
