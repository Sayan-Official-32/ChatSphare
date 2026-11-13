import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import get_supabase_client
from app.routers import (
    auth_router,
    agents_router,
    crawl_router,
    brand_router,
    knowledge_router,
    playground_router,
    public_bot_router,
    publish_router,
    tools_router,
    subscription_router,
    credits_router,
    profile_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
)
logger = logging.getLogger("chatsphare.api")

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    logger.info(f"🚀 Starting {settings.APP_TITLE} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"🌐 Allowed CORS Origins: {settings.cors_origins_list}")
    
    # Verify Supabase client connection status
    db = get_supabase_client()
    if db:
        logger.info("📡 Supabase connection verified.")
    else:
        logger.warning("⚠️ Running in offline/stub DB mode. Provide Supabase credentials in .env to connect.")
    
    yield
    
    logger.info("🛑 Shutting down ChatSphare backend.")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="ChatSphare Enterprise AI Agent Operating Platform — Core Backend REST API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS for Frontend React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Measure request duration and inject X-Process-Time header."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Mount Static Files (widget runtime, icons, fullscreen shells)
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Mount Domain REST API Routers
app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(crawl_router)
app.include_router(brand_router)
app.include_router(knowledge_router)
app.include_router(playground_router)
app.include_router(public_bot_router)
app.include_router(publish_router)
app.include_router(tools_router)
app.include_router(subscription_router)
app.include_router(credits_router)
app.include_router(profile_router)


@app.get("/", tags=["General"])
async def root_endpoint():
    """Root status endpoint providing API health summary and documentation links."""
    return {
        "status": "online",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_check": "/api/health"
    }


@app.get("/api/health", tags=["Health & Diagnostics"])
async def health_check():
    """Health check endpoint for Docker probes, ALB, and frontend availability verification."""
    db_available = get_supabase_client() is not None
    return {
        "status": "healthy",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database_connected": db_available,
        "timestamp": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Launching {settings.APP_TITLE} on http://{settings.HOST}:{settings.PORT}")
    print(f"📚 OpenAPI Documentation available at http://{settings.HOST}:{settings.PORT}/docs")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
    )
