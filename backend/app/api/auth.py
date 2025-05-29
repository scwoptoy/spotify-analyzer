"""
Authentication API Routes
Handles Spotify OAuth flow
"""
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from typing import Dict, Any
import secrets
from datetime import datetime, timedelta
from loguru import logger

from ..services.spotify_service import spotify_oauth_service
from ..models.playlist import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# In-memory storage for OAuth states (in production, use Redis or database)
oauth_states = {}

@router.get("/login")
async def spotify_login():
    """Initiate Spotify OAuth login"""
    try:
        # Generate a random state parameter for security
        state = secrets.token_urlsafe(32)
        
        # Store state temporarily (expires in 10 minutes)
        oauth_states[state] = {
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        
        # Clean up expired states
        cleanup_expired_states()
        
        # Get authorization URL
        auth_url = spotify_oauth_service.get_authorization_url(state=state)
        
        logger.info(f"Generated Spotify authorization URL with state: {state}")
        
        return {
            "auth_url": auth_url,
            "state": state,
            "message": "Redirect user to auth_url to begin Spotify OAuth flow"
        }
        
    except Exception as e:
        logger.error(f"Error initiating Spotify login: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate Spotify login")

@router.get("/callback")
async def spotify_callback(code: str = None, state: str = None, error: str = None):
    """Handle Spotify OAuth callback"""
    try:
        # Check for OAuth errors
        if error:
            logger.error(f"Spotify OAuth error: {error}")
            raise HTTPException(status_code=400, detail=f"Spotify OAuth error: {error}")
        
        # Validate required parameters
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code not provided")
        
        if not state:
            raise HTTPException(status_code=400, detail="State parameter not provided")
        
        # Validate state parameter
        if state not in oauth_states:
            raise HTTPException(status_code=400, detail="Invalid or expired state parameter")
        
        # Check if state is expired
        state_data = oauth_states[state]
        if datetime.now() > state_data["expires_at"]:
            del oauth_states[state]
            raise HTTPException(status_code=400, detail="State parameter expired")
        
        # Clean up used state
        del oauth_states[state]
        
        # Exchange authorization code for tokens
        logger.info("Exchanging authorization code for access tokens")
        token_data = await spotify_oauth_service.exchange_code_for_tokens(code)
        
        if not token_data:
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code for tokens")
        
        # Get user information
        access_token = token_data.get("access_token")
        user_data = await spotify_oauth_service.get_current_user(access_token)
        
        if not user_data:
            raise HTTPException(status_code=400, detail="Failed to fetch user information")
        
        # Store or update user in database
        user = await get_or_create_user(user_data, token_data)
        
        logger.info(f"Successfully authenticated user: {user_data.get('id')}")
        
        # In a real app, you'd create a session or JWT token here
        # For now, we'll return the user data and tokens
        return {
            "message": "Successfully authenticated with Spotify",
            "user": {
                "spotify_id": user_data.get("id"),
                "display_name": user_data.get("display_name"),
                "email": user_data.get("email"),
                "images": user_data.get("images", [])
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": token_data.get("refresh_token"),
                "expires_in": token_data.get("expires_in"),
                "token_type": token_data.get("token_type")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Spotify callback: {e}")
        raise HTTPException(status_code=500, detail="Failed to process Spotify callback")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh Spotify access token"""
    try:
        token_data = await spotify_oauth_service.refresh_access_token(refresh_token)
        
        if not token_data:
            raise HTTPException(status_code=400, detail="Failed to refresh access token")
        
        return {
            "access_token": token_data.get("access_token"),
            "expires_in": token_data.get("expires_in"),
            "token_type": token_data.get("token_type")
        }
        
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh access token")

@router.get("/user/{access_token}")
async def get_user_info(access_token: str):
    """Get current user information (for testing)"""
    try:
        user_data = await spotify_oauth_service.get_current_user(access_token)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired access token")
        
        return user_data
        
    except Exception as e:
        logger.error(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user information")

async def get_or_create_user(spotify_user_data: Dict[str, Any], token_data: Dict[str, Any]) -> User:
    """Get existing user or create new one"""
    try:
        spotify_id = spotify_user_data.get("id")
        email = spotify_user_data.get("email")
        
        # Try to find existing user
        user = await User.find_one({"spotify_id": spotify_id})
        
        if user:
            # Update existing user
            user.display_name = spotify_user_data.get("display_name")
            user.email = email
            user.updated_at = datetime.now()
            await user.save()
            logger.info(f"Updated existing user: {spotify_id}")
        else:
            # Create new user
            user = User(
                auth0_id=f"spotify_{spotify_id}",  # Temporary auth0_id
                email=email,
                spotify_id=spotify_id,
                display_name=spotify_user_data.get("display_name"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            await user.save()
            logger.info(f"Created new user: {spotify_id}")
        
        return user
        
    except Exception as e:
        logger.error(f"Error creating/updating user: {e}")
        raise

def cleanup_expired_states():
    """Clean up expired OAuth states"""
    current_time = datetime.now()
    expired_states = [
        state for state, data in oauth_states.items()
        if current_time > data["expires_at"]
    ]
    
    for state in expired_states:
        del oauth_states[state]
    
    if expired_states:
        logger.info(f"Cleaned up {len(expired_states)} expired OAuth states")