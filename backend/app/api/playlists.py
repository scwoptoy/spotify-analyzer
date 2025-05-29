
"""
Playlist API Routes
Handles all playlist-related endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Optional
from loguru import logger
import asyncio
from datetime import datetime

from ..services.spotify_service import spotify_oauth_service
from ..models.playlist import Playlist, Track, AudioFeatures, PlaylistAnalysis, AnalysisStatus
from ..core.auth import get_current_user  # We'll implement this later

router = APIRouter(prefix="/api/playlists", tags=["playlists"])

# Mock user ID for development (replace with real auth later)
MOCK_USER_ID = "dev_user_123"

@router.get("/oauth")
async def get_user_playlists_oauth(
    access_token: str,
    refresh: bool = False
):
    """Get all playlists for the current user using OAuth token"""
    try:
        logger.info(f"Fetching playlists with OAuth token")
        
        # First, get user info to identify the user
        user_data = await spotify_oauth_service.get_current_user(access_token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid access token")
        
        user_id = user_data.get("id")
        
        if not refresh:
            # Try to get cached playlists from database first
            cached_playlists = await Playlist.find({"user_id": user_id}).to_list()
            if cached_playlists:
                logger.info(f"Returning {len(cached_playlists)} cached playlists for user {user_id}")
                return [
                    {
                        "id": str(playlist.id),
                        "spotify_id": playlist.spotify_id,
                        "name": playlist.name,
                        "description": playlist.description,
                        "track_count": playlist.track_count,
                        "images": playlist.images,
                        "owner": playlist.owner.dict(),
                        "public": playlist.public,
                        "collaborative": playlist.collaborative,
                        "tracks_fetched": playlist.tracks_fetched,
                        "analysis_status": playlist.analysis.status if playlist.analysis else "pending",
                        "created_at": playlist.created_at,
                        "updated_at": playlist.updated_at
                    }
                    for playlist in cached_playlists
                ]
        
        # Fetch fresh data from Spotify using OAuth
        spotify_playlists = await spotify_oauth_service.get_user_playlists(access_token)
        
        if not spotify_playlists:
            logger.warning("No playlists returned from Spotify API")
            return []
        
        # Save or update playlists in database
        saved_playlists = []
        for spotify_playlist in spotify_playlists:
            # Check if playlist already exists
            existing_playlist = await Playlist.find_one({"spotify_id": spotify_playlist["spotify_id"]})
            
            if existing_playlist:
                # Update existing playlist
                existing_playlist.name = spotify_playlist["name"]
                existing_playlist.description = spotify_playlist.get("description", "")
                existing_playlist.track_count = spotify_playlist["track_count"]
                existing_playlist.images = spotify_playlist.get("images") or []
                existing_playlist.snapshot_id = spotify_playlist["snapshot_id"]
                existing_playlist.updated_at = datetime.now()
                
                await existing_playlist.save()
                saved_playlists.append(existing_playlist)
            else:
                # Create new playlist
                new_playlist = Playlist(
                    spotify_id=spotify_playlist["spotify_id"],
                    name=spotify_playlist["name"],
                    description=spotify_playlist.get("description", ""),
                    track_count=spotify_playlist["track_count"],
                    public=spotify_playlist.get("public", True),
                    collaborative=spotify_playlist.get("collaborative", False),
                    owner=spotify_playlist["owner"],
                    user_id=user_id,
                    images=spotify_playlist.get("images") or [],
                    external_urls=spotify_playlist.get("external_urls", {}),
                    snapshot_id=spotify_playlist["snapshot_id"]
                )
                
                await new_playlist.save()
                saved_playlists.append(new_playlist)
        
        logger.info(f"Successfully processed {len(saved_playlists)} playlists for user {user_id}")
        
        # Return formatted playlists
        return [
            {
                "id": str(playlist.id),
                "spotify_id": playlist.spotify_id,
                "name": playlist.name,
                "description": playlist.description,
                "track_count": playlist.track_count,
                "images": playlist.images,
                "owner": playlist.owner.dict(),
                "public": playlist.public,
                "collaborative": playlist.collaborative,
                "tracks_fetched": playlist.tracks_fetched,
                "analysis_status": playlist.analysis.status if playlist.analysis else "pending",
                "created_at": playlist.created_at,
                "updated_at": playlist.updated_at
            }
            for playlist in saved_playlists
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching OAuth playlists: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlists: {str(e)}")

@router.get("/", response_model=List[Dict])
async def get_user_playlists(
    user_id: str = MOCK_USER_ID,
    refresh: bool = False
):
    """Get all playlists for the current user"""
    try:
        # For now, we'll use mock Spotify token - replace with real auth later
        mock_access_token = "mock_token"
        
        # Get playlists from Spotify API
        logger.info(f"Fetching playlists for user {user_id}")
        
        if not refresh:
            # Try to get cached playlists from database first
            cached_playlists = await Playlist.find({"user_id": user_id}).to_list()
            if cached_playlists:
                logger.info(f"Returning {len(cached_playlists)} cached playlists")
                return [
                    {
                        "id": str(playlist.id),
                        "spotify_id": playlist.spotify_id,
                        "name": playlist.name,
                        "description": playlist.description,
                        "track_count": playlist.track_count,
                        "images": playlist.images,
                        "owner": playlist.owner.dict(),
                        "public": playlist.public,
                        "collaborative": playlist.collaborative,
                        "tracks_fetched": playlist.tracks_fetched,
                        "analysis_status": playlist.analysis.status if playlist.analysis else "pending",
                        "created_at": playlist.created_at,
                        "updated_at": playlist.updated_at
                    }
                    for playlist in cached_playlists
                ]
        
        # Fetch fresh data from Spotify
        spotify_playlists = await spotify_oauth_service.get_user_playlists(mock_access_token, "me")
        
        if not spotify_playlists:
            logger.warning("No playlists returned from Spotify API")
            return []
        
        # Save or update playlists in database
        saved_playlists = []
        for spotify_playlist in spotify_playlists:
            # Check if playlist already exists
            existing_playlist = await Playlist.find_one({"spotify_id": spotify_playlist["spotify_id"]})
            
            if existing_playlist:
                # Update existing playlist
                existing_playlist.name = spotify_playlist["name"]
                existing_playlist.description = spotify_playlist.get("description", "")
                existing_playlist.track_count = spotify_playlist["track_count"]
                existing_playlist.images = spotify_playlist.get("images") or []
                existing_playlist.snapshot_id = spotify_playlist["snapshot_id"]
                existing_playlist.update_timestamp()
                
                await existing_playlist.save()
                saved_playlists.append(existing_playlist)
            else:
                # Create new playlist
                new_playlist = Playlist(
                    spotify_id=spotify_playlist["spotify_id"],
                    name=spotify_playlist["name"],
                    description=spotify_playlist.get("description", ""),
                    track_count=spotify_playlist["track_count"],
                    public=spotify_playlist.get("public", True),
                    collaborative=spotify_playlist.get("collaborative", False),
                    owner=spotify_playlist["owner"],
                    user_id=user_id,
                    images=spotify_playlist.get("images", []),
                    external_urls=spotify_playlist.get("external_urls", {}),
                    snapshot_id=spotify_playlist["snapshot_id"]
                )
                
                await new_playlist.save()
                saved_playlists.append(new_playlist)
        
        logger.info(f"Successfully processed {len(saved_playlists)} playlists")
        
        # Return formatted playlists
        return [
            {
                "id": str(playlist.id),
                "spotify_id": playlist.spotify_id,
                "name": playlist.name,
                "description": playlist.description,
                "track_count": playlist.track_count,
                "images": playlist.images,
                "owner": playlist.owner.dict(),
                "public": playlist.public,
                "collaborative": playlist.collaborative,
                "tracks_fetched": playlist.tracks_fetched,
                "analysis_status": playlist.analysis.status if playlist.analysis else "pending",
                "created_at": playlist.created_at,
                "updated_at": playlist.updated_at
            }
            for playlist in saved_playlists
        ]
        
    except Exception as e:
        logger.error(f"Error fetching user playlists: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlists: {str(e)}")

@router.get("/{playlist_id}/tracks")
async def get_playlist_tracks(playlist_id: str, force_refresh: bool = False):
    """Get tracks for a specific playlist"""
    try:
        # Find playlist in database
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        # Check if we need to fetch tracks
        if not force_refresh and playlist.tracks_fetched and playlist.tracks:
            logger.info(f"Returning {len(playlist.tracks)} cached tracks for playlist {playlist_id}")
            return {
                "playlist_id": playlist_id,
                "tracks": [track.dict() for track in playlist.tracks],
                "total_tracks": len(playlist.tracks),
                "fetched_at": playlist.last_fetched_at
            }
        
        # Fetch tracks from Spotify
        mock_access_token = "mock_token"
        logger.info(f"Fetching tracks from Spotify for playlist {playlist_id}")
        
        spotify_tracks = await spotify_oauth_service.get_playlist_tracks(playlist_id, mock_access_token)
        
        if not spotify_tracks:
            logger.warning(f"No tracks returned for playlist {playlist_id}")
            return {
                "playlist_id": playlist_id,
                "tracks": [],
                "total_tracks": 0,
                "fetched_at": datetime.now()
            }
        
        # Convert to Track models
        tracks = []
        for spotify_track in spotify_tracks:
            track = Track(
                spotify_id=spotify_track["spotify_id"],
                name=spotify_track["name"],
                artists=spotify_track["artists"],
                album=spotify_track["album"],
                duration_ms=spotify_track["duration_ms"],
                popularity=spotify_track["popularity"],
                preview_url=spotify_track.get("preview_url"),
                external_urls=spotify_track.get("external_urls", {})
            )
            tracks.append(track)
        
        # Update playlist with tracks
        playlist.tracks = tracks
        playlist.mark_tracks_fetched()
        await playlist.save()
        
        logger.info(f"Successfully fetched and saved {len(tracks)} tracks for playlist {playlist_id}")
        
        return {
            "playlist_id": playlist_id,
            "tracks": [track.dict() for track in tracks],
            "total_tracks": len(tracks),
            "fetched_at": playlist.last_fetched_at
        }
        
    except Exception as e:
        logger.error(f"Error fetching tracks for playlist {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tracks: {str(e)}")

@router.post("/{playlist_id}/fetch-audio-features")
async def fetch_audio_features(playlist_id: str, background_tasks: BackgroundTasks):
    """Fetch audio features for all tracks in a playlist"""
    try:
        # Find playlist
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        if not playlist.tracks:
            raise HTTPException(status_code=400, detail="Playlist has no tracks. Fetch tracks first.")
        
        # Check if audio features already fetched recently
        if playlist.audio_features_fetched and not playlist.needs_refresh:
            return {
                "message": "Audio features already fetched",
                "playlist_id": playlist_id,
                "tracks_with_features": len([t for t in playlist.tracks if t.audio_features])
            }
        
        # Add background task to fetch audio features
        background_tasks.add_task(fetch_audio_features_task, playlist_id)
        
        return {
            "message": "Audio features fetching started in background",
            "playlist_id": playlist_id,
            "total_tracks": len(playlist.tracks),
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Error starting audio features fetch for playlist {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start audio features fetch: {str(e)}")

async def fetch_audio_features_task(playlist_id: str):
    """Background task to fetch audio features"""
    try:
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist or not playlist.tracks:
            return
        
        mock_access_token = "mock_token"
        
        # Get track IDs
        track_ids = [track.spotify_id for track in playlist.tracks if track.spotify_id]
        
        if not track_ids:
            logger.warning(f"No valid track IDs found for playlist {playlist_id}")
            return
        
        # Fetch audio features from Spotify
        logger.info(f"Fetching audio features for {len(track_ids)} tracks")
        audio_features = await spotify_oauth_service.get_audio_features(track_ids, mock_access_token)
        
        # Create a lookup dictionary
        features_lookup = {feature["spotify_id"]: feature for feature in audio_features}
        
        # Update tracks with audio features
        updated_count = 0
        for track in playlist.tracks:
            if track.spotify_id in features_lookup:
                feature_data = features_lookup[track.spotify_id]
                track.audio_features = AudioFeatures(**feature_data)
                updated_count += 1
        
        # Mark as fetched and save
        playlist.audio_features_fetched = True
        playlist.update_timestamp()
        await playlist.save()
        
        logger.info(f"Successfully updated {updated_count} tracks with audio features for playlist {playlist_id}")
        
    except Exception as e:
        logger.error(f"Error in fetch_audio_features_task for playlist {playlist_id}: {e}")

@router.get("/{playlist_id}/analysis")
async def get_playlist_analysis(playlist_id: str):
    """Get analysis results for a playlist"""
    try:
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        if not playlist.analysis:
            return {
                "playlist_id": playlist_id,
                "status": "not_analyzed",
                "message": "Playlist has not been analyzed yet"
            }
        
        return {
            "playlist_id": playlist_id,
            "analysis": playlist.analysis.dict(),
            "summary": playlist.analysis_summary
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis for playlist {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis: {str(e)}")

@router.post("/{playlist_id}/analyze")
async def analyze_playlist(playlist_id: str, background_tasks: BackgroundTasks):
    """Start playlist analysis"""
    try:
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        if not playlist.tracks:
            raise HTTPException(status_code=400, detail="Playlist has no tracks. Fetch tracks first.")
        
        # Check if tracks have audio features
        tracks_with_features = [t for t in playlist.tracks if t.audio_features]
        if len(tracks_with_features) == 0:
            raise HTTPException(status_code=400, detail="No audio features found. Fetch audio features first.")
        
        # Start analysis in background
        background_tasks.add_task(analyze_playlist_task, playlist_id)
        
        return {
            "message": "Playlist analysis started",
            "playlist_id": playlist_id,
            "tracks_to_analyze": len(tracks_with_features),
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Error starting analysis for playlist {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")

async def analyze_playlist_task(playlist_id: str):
    """Background task to analyze playlist"""
    try:
        start_time = datetime.now()
        
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist or not playlist.tracks:
            return
        
        # Filter tracks with audio features
        tracks_with_features = [t for t in playlist.tracks if t.audio_features]
        
        if not tracks_with_features:
            logger.warning(f"No tracks with audio features for playlist {playlist_id}")
            return
        
        logger.info(f"Analyzing {len(tracks_with_features)} tracks for playlist {playlist_id}")
        
        # Calculate averages
        total_tracks = len(tracks_with_features)
        
        # Audio feature averages
        avg_acousticness = sum(t.audio_features.acousticness for t in tracks_with_features) / total_tracks
        avg_danceability = sum(t.audio_features.danceability for t in tracks_with_features) / total_tracks
        avg_energy = sum(t.audio_features.energy for t in tracks_with_features) / total_tracks
        avg_instrumentalness = sum(t.audio_features.instrumentalness for t in tracks_with_features) / total_tracks
        avg_liveness = sum(t.audio_features.liveness for t in tracks_with_features) / total_tracks
        avg_loudness = sum(t.audio_features.loudness for t in tracks_with_features) / total_tracks
        avg_speechiness = sum(t.audio_features.speechiness for t in tracks_with_features) / total_tracks
        avg_valence = sum(t.audio_features.valence for t in tracks_with_features) / total_tracks
        avg_tempo = sum(t.audio_features.tempo for t in tracks_with_features) / total_tracks
        
        # Other statistics
        total_duration_ms = sum(t.duration_ms for t in playlist.tracks)
        avg_popularity = sum(t.popularity for t in playlist.tracks) / len(playlist.tracks)
        
        # Find dominant characteristics
        keys = [t.audio_features.key for t in tracks_with_features]
        modes = [t.audio_features.mode for t in tracks_with_features]
        time_signatures = [t.audio_features.time_signature for t in tracks_with_features]
        
        dominant_key = max(set(keys), key=keys.count) if keys else None
        dominant_mode = max(set(modes), key=modes.count) if modes else None
        dominant_time_signature = max(set(time_signatures), key=time_signatures.count) if time_signatures else None
        
        # Artist analysis
        all_artists = []
        for track in playlist.tracks:
            for artist in track.artists:
                all_artists.append(artist.name)
        
        artist_counts = {}
        for artist in all_artists:
            artist_counts[artist] = artist_counts.get(artist, 0) + 1
        
        top_artists = [
            {"name": artist, "track_count": count}
            for artist, count in sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Generate mood description
        mood_description = generate_mood_description(avg_valence, avg_energy, avg_danceability)
        energy_level = "high" if avg_energy > 0.7 else "medium" if avg_energy > 0.4 else "low"
        danceability_level = "high" if avg_danceability > 0.7 else "medium" if avg_danceability > 0.4 else "low"
        
        # Create analysis result
        analysis = PlaylistAnalysis(
            status=AnalysisStatus.COMPLETED,
            total_tracks=total_tracks,
            total_duration_ms=total_duration_ms,
            average_popularity=avg_popularity,
            avg_acousticness=avg_acousticness,
            avg_danceability=avg_danceability,
            avg_energy=avg_energy,
            avg_instrumentalness=avg_instrumentalness,
            avg_liveness=avg_liveness,
            avg_loudness=avg_loudness,
            avg_speechiness=avg_speechiness,
            avg_valence=avg_valence,
            avg_tempo=avg_tempo,
            dominant_key=dominant_key,
            dominant_mode=dominant_mode,
            dominant_time_signature=dominant_time_signature,
            top_artists=top_artists,
            unique_artists_count=len(artist_counts),
            mood_description=mood_description,
            energy_level=energy_level,
            danceability_level=danceability_level,
            recommendation_seed_tracks=[t.spotify_id for t in tracks_with_features[:5]],
            analysis_duration_seconds=(datetime.now() - start_time).total_seconds()
        )
        
        # Save analysis
        playlist.mark_analysis_complete(analysis)
        await playlist.save()
        
        logger.info(f"Successfully analyzed playlist {playlist_id} in {analysis.analysis_duration_seconds:.2f} seconds")
        
    except Exception as e:
        logger.error(f"Error in analyze_playlist_task for playlist {playlist_id}: {e}")

def generate_mood_description(valence: float, energy: float, danceability: float) -> str:
    """Generate a human-readable mood description"""
    if valence > 0.7 and energy > 0.7:
        return "Upbeat and energetic - perfect for parties and workouts"
    elif valence > 0.7 and energy < 0.4:
        return "Happy and relaxed - great for casual listening"
    elif valence < 0.3 and energy > 0.6:
        return "Intense and dramatic - powerful emotional impact"
    elif valence < 0.3 and energy < 0.4:
        return "Melancholic and introspective - perfect for quiet moments"
    elif danceability > 0.8:
        return "Highly danceable - gets you moving"
    elif energy > 0.8:
        return "High energy - pumps you up"
    elif valence > 0.6:
        return "Generally positive and uplifting"
    elif valence < 0.4:
        return "Somewhat melancholic or contemplative"
    else:
        return "Balanced mix of moods and energy levels"

@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Delete a playlist from our database (not from Spotify)"""
    try:
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        await playlist.delete()
        
        return {
            "message": "Playlist deleted successfully",
            "playlist_id": playlist_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting playlist {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete playlist: {str(e)}")

@router.get("/{playlist_id}")
async def get_playlist_details(playlist_id: str):
    """Get detailed information about a specific playlist"""
    try:
        playlist = await Playlist.find_one({"spotify_id": playlist_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        return {
            "id": str(playlist.id),
            "spotify_id": playlist.spotify_id,
            "name": playlist.name,
            "description": playlist.description,
            "track_count": playlist.track_count,
            "images": playlist.images,
            "owner": playlist.owner.dict(),
            "public": playlist.public,
            "collaborative": playlist.collaborative,
            "tracks_fetched": playlist.tracks_fetched,
            "audio_features_fetched": playlist.audio_features_fetched,
            "analysis_status": playlist.analysis.status if playlist.analysis else "pending",
            "analysis_summary": playlist.analysis_summary,
            "created_at": playlist.created_at,
            "updated_at": playlist.updated_at,
            "last_fetched_at": playlist.last_fetched_at,
            "last_analyzed_at": playlist.last_analyzed_at,
            "needs_refresh": playlist.needs_refresh
        }
        
    except Exception as e:
        logger.error(f"Error getting playlist details for {playlist_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get playlist details: {str(e)}")