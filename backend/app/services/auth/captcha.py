import random
import string
import time
import hmac
import hashlib
import base64
import json
from app.core.config import settings


def generate_svg_captcha() -> tuple[str, str]:
    """
    Generates a server-signed vector SVG challenge and an HMAC token.
    No image libraries (Pillow/OpenCV) required; pure SVG vector markup.
    """
    chars = string.ascii_uppercase + "23456789"
    # Exclude ambiguous characters: 0, O, 1, I
    chars = chars.replace("0", "").replace("O", "").replace("1", "").replace("I", "")
    text = "".join(random.choices(chars, k=5))
    
    width = 180
    height = 50
    
    # Generate random curved noise paths
    lines = []
    for _ in range(4):
        x1, y1 = random.randint(5, 50), random.randint(10, 40)
        x2, y2 = random.randint(60, 120), random.randint(10, 40)
        x3, y3 = random.randint(130, 175), random.randint(10, 40)
        stroke = random.choice(["#6366f1", "#a855f7", "#ec4899", "#3b82f6"])
        lines.append(f'<path d="M {x1} {y1} Q {x2} {y2} {x3} {y3}" stroke="{stroke}" stroke-width="1.5" fill="none" opacity="0.6"/>')

    # Generate characters with slight rotation and offsets
    text_elements = []
    for i, char in enumerate(text):
        x = 25 + i * 28 + random.randint(-2, 2)
        y = 34 + random.randint(-4, 4)
        rot = random.randint(-18, 18)
        color = random.choice(["#1e1b4b", "#312e81", "#4338ca", "#3730a3"])
        text_elements.append(
            f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-weight="bold" font-size="26" '
            f'fill="{color}" transform="rotate({rot}, {x}, {y})">{char}</text>'
        )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" '
        f'style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; user-select: none;">'
        + "".join(lines)
        + "".join(text_elements)
        + '</svg>'
    )

    # HMAC-sign the solution with timestamp
    payload = {
        "solution": text.upper(),
        "created_at": int(time.time()),
        "expires_at": int(time.time()) + 300  # 5 minutes validity
    }
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()
    
    sig = hmac.new(
        settings.CAPTCHA_SECRET_KEY.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).hexdigest()

    token = f"{payload_b64}.{sig}"
    return svg, token


def verify_svg_captcha(token: str, user_solution: str) -> bool:
    """Verifies that the user solution matches the HMAC-signed payload."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False
            
        payload_b64, sig = parts
        expected_sig = hmac.new(
            settings.CAPTCHA_SECRET_KEY.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(sig, expected_sig):
            return False

        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode())
        payload = json.loads(payload_bytes.decode())

        if time.time() > payload.get("expires_at", 0):
            return False

        return user_solution.strip().upper() == payload.get("solution", "")
    except Exception:
        return False
