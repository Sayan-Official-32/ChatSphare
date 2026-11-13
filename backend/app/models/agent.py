from typing import List, Optional, Dict, Any
from pydantic import Field
from app.models.base import BaseSchema
from app.models.brand import BrandDNA


class WidgetSettings(BaseSchema):
    theme: str = "Light"  # "Light" | "Dark" | "Custom"
    position: str = "Right"  # "Right" | "Left"
    placeholder: str = "Type your message..."
    launcher_text: Optional[str] = "Chat with us"
    accent_color: Optional[str] = None
    border_radius: int = 16


class AgentBase(BaseSchema):
    display_name: str
    role: str = "Customer Support Specialist"
    tone: str = "Professional & Helpful"
    system_prompt: Optional[str] = None
    custom_instructions: Optional[str] = None
    greeting_message: str = "Hello! How can I help you today?"
    is_public: bool = True
    widget_settings: WidgetSettings = Field(default_factory=WidgetSettings)


class AgentCreate(AgentBase):
    brand_id: Optional[str] = None


class AgentUpdate(BaseSchema):
    display_name: Optional[str] = None
    role: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: Optional[str] = None
    custom_instructions: Optional[str] = None
    greeting_message: Optional[str] = None
    is_public: Optional[bool] = None
    widget_settings: Optional[WidgetSettings] = None


class AgentResponse(AgentBase):
    id: str
    brand_id: Optional[str] = None
    is_default: bool = True
    current_version: int = 1
    brand: Optional[BrandDNA] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AgentListResponse(BaseSchema):
    agents: List[AgentResponse] = Field(default_factory=list)
    total: int = 0


class WizardDraft(BaseSchema):
    step: int = 1
    website_url: Optional[str] = None
    brand_dna: Optional[BrandDNA] = None
    agent_config: Optional[AgentBase] = None
    selected_pages: List[str] = Field(default_factory=list)
    uploaded_files: List[str] = Field(default_factory=list)
    sub_sessions: Dict[str, Any] = Field(default_factory=dict)


class SubSessionRequest(BaseSchema):
    step: int
    data: Dict[str, Any]


class SetupCommitRequest(BaseSchema):
    website_url: str
    brand: BrandDNA
    agent: AgentBase
    crawled_pages: List[Dict[str, Any]] = Field(default_factory=list)
    uploaded_files: List[Dict[str, Any]] = Field(default_factory=list)


class BrandConfigRequest(BaseSchema):
    agent_id: str
    brand_name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    font_family: Optional[str] = None
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = None
    widget_settings: Optional[WidgetSettings] = None


class GenerateInstructionsRequest(BaseSchema):
    brand_name: str
    industry: Optional[str] = None
    role: str = "Customer Support Specialist"
    tone: str = "Professional & Helpful"
    key_details: Optional[str] = None


class InstructionsQuotaResponse(BaseSchema):
    remaining: int = 5
    total_quota: int = 5
    resets_in_hours: int = 24


class ModelItem(BaseSchema):
    id: str
    name: str
    provider: str
    context_length: int
    is_default: bool = False


class AvailableModelsResponse(BaseSchema):
    models: List[ModelItem] = Field(default_factory=list)
    default_model: str
