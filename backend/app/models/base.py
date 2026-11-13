from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    """Base schema for ChatSphare with Pydantic v2 configuration."""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
    )


class ApiResponse(BaseSchema):
    """Standard unified response envelope."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
