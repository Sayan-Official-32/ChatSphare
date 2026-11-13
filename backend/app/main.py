import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import get_supabase_client

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
)
logger = logging.getLogger("chatsphare.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    logger.info(f"🚀 Starting {settings.APP_TITLE} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"🌐 Allowed CORS Origins: {settings.cors_origins_list}")
    
    # Initialize Supabase client on startup
    db = get_supabase_client()
    if db:
        logger.info("📡 Supabase connection verified.")
    else:
        logger.warning("⚠️ Running in offline/unconnected DB mode. Provide Supabase credentials in .env to connect.")
    
    yield
    
    logger.info("🛑 Shutting down ChatSphare backend.")


# Initialize FastAPI instance
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
    """Middleware to measure request processing duration."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


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
    """Health check endpoint for Docker probes, ALB, and frontend team availability checks."""
    db_available = get_supabase_client() is not None
    return {
        "status": "healthy",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database_connected": db_available,
        "timestamp": time.time()
    }
