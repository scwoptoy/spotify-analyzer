# Spotify Playlist Analyzer - FastAPI Backend Main Application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime

# Create FastAPI application
app = FastAPI(
    title="Spotify Playlist Analyzer API",
    description="AI-powered music taste analysis and playlist generation",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [
    "http://localhost:3000",  # React development server
    "http://localhost:3001",  # Alternative React port
    "http://frontend:3000",   # Docker container
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Spotify Playlist Analyzer API is running!",
        "version": "0.1.0",
        "timestamp": datetime.now().isoformat(),
        "status": "healthy"
    }

# Health check for monitoring
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "spotify-analyzer-backend"
    }

# API status endpoint
@app.get("/api/status")
async def api_status():
    return {
        "api_version": "v1",
        "status": "operational",
        "features": {
            "authentication": "not_implemented",
            "playlist_analysis": "not_implemented", 
            "recommendations": "not_implemented"
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )