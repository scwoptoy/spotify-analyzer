"""
Spotify OAuth Service
Handles Spotify Web API authentication and data fetching
"""
import httpx
import base64
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import os
from urllib.parse import urlencode
from loguru import logger

class SpotifyOAuthService:
    """Service for Spotify OAuth and API interactions"""
    
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:3000/callback")
        self.base_url = "https://api.spotify.com/v1"
        self.auth_url = "https://accounts.spotify.com/api/token"
        self.authorize_url = "https://accounts.spotify.com/authorize"
        
        if not self.client_id or not self.client_secret:
            logger.warning("Spotify credentials not found in environment variables")
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate Spotify authorization URL for OAuth flow"""
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": "playlist-read-private playlist-read-collaborative user-read-private user-read-email",
        }
        
        if state:
            params["state"] = state
            
        return f"{self.authorize_url}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, authorization_code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access and refresh tokens"""
        try:
            # Encode client credentials
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "authorization_code",
                "code": authorization_code,
                "redirect_uri": self.redirect_uri
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.auth_url, headers=headers, data=data)
                response.raise_for_status()
                
                token_data = response.json()
                logger.info("Successfully exchanged authorization code for tokens")
                return token_data
                
        except Exception as e:
            logger.error(f"Failed to exchange authorization code for tokens: {e}")
            return None
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token using refresh token"""
        try:
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.auth_url, headers=headers, data=data)
                response.raise_for_status()
                
                token_data = response.json()
                logger.info("Successfully refreshed access token")
                return token_data
                
        except Exception as e:
            logger.error(f"Failed to refresh access token: {e}")
            return None
    
    async def get_current_user(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get current user's profile information"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/me"
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                user_data = response.json()
                logger.info(f"Successfully fetched user profile for {user_data.get('id')}")
                return user_data
                
        except Exception as e:
            logger.error(f"Failed to fetch user profile: {e}")
            return None
    
    async def get_user_playlists(self, access_token: str) -> List[Dict[str, Any]]:
        """Fetch user's playlists from Spotify API"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            all_playlists = []
            offset = 0
            limit = 50
            
            async with httpx.AsyncClient() as client:
                while True:
                    url = f"{self.base_url}/me/playlists"
                    params = {"limit": limit, "offset": offset}
                    
                    response = await client.get(url, headers=headers, params=params)
                    response.raise_for_status()
                    
                    data = response.json()
                    playlists = data.get("items", [])
                    
                    if not playlists:
                        break
                    
                    # Format playlist data
                    for playlist in playlists:
                        if playlist and playlist.get("tracks", {}).get("total", 0) > 0:
                            formatted_playlist = {
                                "spotify_id": playlist["id"],
                                "name": playlist["name"],
                                "description": playlist.get("description", ""),
                                "track_count": playlist["tracks"]["total"],
                                "public": playlist.get("public", False),
                                "collaborative": playlist.get("collaborative", False),
                                "owner": {
                                    "id": playlist["owner"]["id"],
                                    "display_name": playlist["owner"].get("display_name")
                                },
                                "images": playlist.get("images", []),
                                "external_urls": playlist.get("external_urls", {}),
                                "snapshot_id": playlist["snapshot_id"]
                            }
                            all_playlists.append(formatted_playlist)
                    
                    offset += limit
                    if len(playlists) < limit:
                        break
            
            logger.info(f"Successfully fetched {len(all_playlists)} playlists")
            return all_playlists
            
        except Exception as e:
            logger.error(f"Failed to fetch user playlists: {e}")
            return []

# Create singleton instance
spotify_oauth_service = SpotifyOAuthService()