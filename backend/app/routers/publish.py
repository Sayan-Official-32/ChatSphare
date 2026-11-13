from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.auth import UserProfile

router = APIRouter(prefix="/api/publish", tags=["Publish & Distribution"])


class EmbedCodeRequest(BaseModel):
    agent_id: str
    custom_domain: str = "http://127.0.0.1:8000"


class EmbedCodeResponse(BaseModel):
    agent_id: str
    script_tag: str
    iframe_snippet: str
    wordpress_instructions: str
    shopify_snippet: str
    nextjs_component: str
    standalone_url: str


@router.post("/embed-code", response_model=EmbedCodeResponse)
async def generate_embed_codes(payload: EmbedCodeRequest, user: UserProfile = Depends(get_current_user)):
    """
    Generates ready-to-paste integration snippets across all supported web stacks.
    Powers the Deploy Space in the Studio.
    """
    base_url = payload.custom_domain.rstrip('/')
    script_snippet = f'<script src="{base_url}/widget-embed.js" data-agent-id="{payload.agent_id}" defer></script>'
    iframe_snippet = f'<iframe src="{base_url}/fullscreen-widget/{payload.agent_id}" width="100%" height="600" frameborder="0"></iframe>'
    standalone_url = f"{base_url}/fullscreen-widget/{payload.agent_id}"

    return EmbedCodeResponse(
        agent_id=payload.agent_id,
        script_tag=script_snippet,
        iframe_snippet=iframe_snippet,
        standalone_url=standalone_url,
        wordpress_instructions=(
            "1. In your WordPress Admin panel, go to Appearance -> Theme File Editor or use a 'Header and Footer Scripts' plugin.\n"
            f"2. Paste the following snippet into the Footer Scripts section:\n{script_snippet}"
        ),
        shopify_snippet=(
            "<!-- Paste this snippet into theme.liquid before the closing </body> tag -->\n"
            f"{script_snippet}"
        ),
        nextjs_component=(
            "import Script from 'next/script';\n\n"
            "export default function ChatSphareWidget() {\n"
            "  return (\n"
            f"    <Script src=\"{base_url}/widget-embed.js\" data-agent-id=\"{payload.agent_id}\" strategy=\"lazyOnload\" />\n"
            "  );\n"
            "}"
        )
    )
