"""
Playlist Data Models
MongoDB models for storing playlist and track data
"""
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class TrackArtist(BaseModel):
    """Artist information for a track"""
    name: str
    spotify_id: str = Field(alias="id")

class TrackAlbum(BaseModel):
    """Album information for a track"""
    name: str
    spotify_id: str = Field(alias="id")
    release_date: Optional[str] = None

class AudioFeatures(BaseModel):
    """Spotify audio features for a track"""
    acousticness: float = Field(ge=0.0, le=1.0)
    danceability: float = Field(ge=0.0, le=1.0)
    energy: float = Field(ge=0.0, le=1.0)
    instrumentalness: float = Field(ge=0.0, le=1.0)
    liveness: float = Field(ge=0.0, le=1.0)
    loudness: float = Field(ge=-60.0, le=0.0)
    speechiness: float = Field(ge=0.0, le=1.0)
    valence: float = Field(ge=0.0, le=1.0)
    tempo: float = Field(gt=0.0)
    key: int = Field(ge=-1, le=11)
    mode: int = Field(ge=0, le=1)
    time_signature: int = Field(ge=1, le=7)
    duration_ms: int = Field(gt=0)

class Track(BaseModel):
    """Track information"""
    spotify_id: str
    name: str
    artists: List[TrackArtist] = []
    album: TrackAlbum
    duration_ms: int
    popularity: int = Field(ge=0, le=100)
    preview_url: Optional[str] = None
    external_urls: Dict[str, str] = {}
    audio_features: Optional[AudioFeatures] = None

class PlaylistOwner(BaseModel):
    """Playlist owner information"""
    spotify_id: str = Field(alias="id")
    display_name: Optional[str] = None

class AnalysisStatus(str, Enum):
    """Status of playlist analysis"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class PlaylistAnalysis(BaseModel):
    """Results of playlist analysis"""
    status: AnalysisStatus = AnalysisStatus.PENDING
    total_tracks: int = 0
    total_duration_ms: int = 0
    average_popularity: float = 0.0
    avg_acousticness: float = 0.0
    avg_danceability: float = 0.0
    avg_energy: float = 0.0
    avg_valence: float = 0.0
    avg_tempo: float = 0.0
    mood_description: str = ""
    energy_level: str = ""
    top_artists: List[Dict[str, Any]] = []
    analyzed_at: datetime = Field(default_factory=datetime.now)

class Playlist(Document):
    """Main playlist document stored in MongoDB"""
    
    # Spotify metadata
    spotify_id: Indexed(str, unique=True)
    name: str
    description: str = ""
    track_count: int = 0
    public: bool = True
    collaborative: bool = False
    
    # Owner information
    owner: PlaylistOwner
    user_id: Indexed(str)  # Our internal user ID
    
    # Visual
    images: List[Dict[str, Any]] = []
    external_urls: Dict[str, str] = {}
    
    # Spotify metadata
    snapshot_id: str
    
    # Track data
    tracks: List[Track] = []
    tracks_fetched: bool = False
    audio_features_fetched: bool = False
    
    # Analysis results
    analysis: Optional[PlaylistAnalysis] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    last_fetched_at: Optional[datetime] = None
    last_analyzed_at: Optional[datetime] = None
    
    class Settings:
        name = "playlists"
    
    def mark_tracks_fetched(self):
        """Mark that tracks have been successfully fetched"""
        self.tracks_fetched = True
        self.last_fetched_at = datetime.now()
    
    def mark_analysis_complete(self, analysis_result: PlaylistAnalysis):
        """Mark analysis as complete and store results"""
        self.analysis = analysis_result
        self.last_analyzed_at = datetime.now()
    
    @property
    def needs_refresh(self) -> bool:
        """Check if playlist data needs to be refreshed from Spotify"""
        if not self.last_fetched_at:
            return True
        age = datetime.now() - self.last_fetched_at
        return age.total_seconds() > 3600

class User(Document):
    """User document for storing user preferences and history"""
    
    # Authentication
    auth0_id: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    spotify_id: Optional[Indexed(str)] = None
    
    # Profile
    display_name: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "users"