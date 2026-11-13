import sys
from pathlib import Path
import uvicorn

# Ensure the backend directory is present in sys.path for direct imports
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.core.config import settings

__all__ = ["app"]

if __name__ == "__main__":
    print(f"🚀 Launching {settings.APP_TITLE} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    print(f"📡 API Server: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 Interactive Swagger Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🩺 Health Check Probe: http://{settings.HOST}:{settings.PORT}/api/health\n")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
    )
