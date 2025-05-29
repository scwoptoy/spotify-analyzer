"""
Spotify Playlist Analyzer - FastAPI Backend
Main application entry point with OAuth support
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
from contextlib import asynccontextmanager
from loguru import logger

from .core.database import connect_to_mongo, close_mongo_connection
from .api.playlists import router as playlist_router
from .api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting Spotify Playlist Analyzer API...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("🛑 Shutting down Spotify Playlist Analyzer API...")
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="Spotify Playlist Analyzer API",
    description="AI-powered music taste analysis and playlist recommendations with OAuth",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(playlist_router)
app.include_router(auth_router)  # Add OAuth routes

@app.get("/")
async def root():
    """Root endpoint - API status"""
    return {
        "message": "🎵 Spotify Playlist Analyzer API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": [
            "Spotify OAuth authentication",
            "Playlist fetching and analysis", 
            "Musical taste profiling",
            "MongoDB data storage"
        ],
        "auth_endpoints": {
            "login": "/api/auth/login",
            "callback": "/api/auth/callback",
            "refresh": "/api/auth/refresh"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    try:
        from .core.database import db
        
        # Test database connection
        db_status = "connected" if db.client else "disconnected"
        
        # Test Spotify credentials
        spotify_status = "configured" if os.getenv("SPOTIFY_CLIENT_ID") else "not_configured"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "api": "running",
                "database": db_status,
                "spotify_oauth": spotify_status
            },
            "oauth_ready": db_status == "connected" and spotify_status == "configured"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {
        "message": "✅ Backend API with OAuth is working correctly!",
        "database_connected": True,
        "spotify_oauth": "ready",
        "available_endpoints": [
            "GET /api/auth/login - Start Spotify OAuth",
            "GET /api/auth/callback - OAuth callback",
            "POST /api/auth/refresh - Refresh tokens",
            "GET /api/playlists - Get user playlists (with token)",
            "GET /docs - API documentation"
        ]
    }