/**
 * Frontend Spotify Service
 * Handles API calls to our backend for Spotify data
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface PlaylistOwner {
  id: string;
  display_name?: string;
}

export interface PlaylistImage {
  url: string;
  height?: number;
  width?: number;
}

export interface Playlist {
  id: string;
  spotify_id: string;
  name: string;
  description: string;
  track_count: number;
  images: PlaylistImage[];
  owner: PlaylistOwner;
  public: boolean;
  collaborative: boolean;
  tracks_fetched: boolean;
  analysis_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Track {
  spotify_id: string;
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    id: string;
    release_date?: string;
  };
  duration_ms: number;
  popularity: number;
  preview_url?: string;
  external_urls: Record<string, string>;
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
}

export interface PlaylistAnalysis {
  status: string;
  total_tracks: number;
  total_duration_ms: number;
  average_popularity: number;
  avg_acousticness: number;
  avg_danceability: number;
  avg_energy: number;
  avg_valence: number;
  avg_tempo: number;
  mood_description: string;
  energy_level: string;
  danceability_level: string;
  top_artists: Array<{
    name: string;
    track_count: number;
  }>;
  analyzed_at: string;
}

class SpotifyService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`Response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all playlists for the current user
   */
  async getPlaylists(refresh: boolean = false): Promise<Playlist[]> {
    const endpoint = `/api/playlists${refresh ? '?refresh=true' : ''}`;
    return this.request<Playlist[]>(endpoint);
  }

  /**
   * Get tracks for a specific playlist
   */
  async getPlaylistTracks(playlistId: string, forceRefresh: boolean = false): Promise<{
    playlist_id: string;
    tracks: Track[];
    total_tracks: number;
    fetched_at: string;
  }> {
    const endpoint = `/api/playlists/${playlistId}/tracks${forceRefresh ? '?force_refresh=true' : ''}`;
    return this.request(endpoint);
  }

  /**
   * Start fetching audio features for a playlist
   */
  async fetchAudioFeatures(playlistId: string): Promise<{
    message: string;
    playlist_id: string;
    status: string;
  }> {
    const endpoint = `/api/playlists/${playlistId}/fetch-audio-features`;
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  /**
   * Start playlist analysis
   */
  async analyzePlaylist(playlistId: string): Promise<{
    message: string;
    playlist_id: string;
    status: string;
  }> {
    const endpoint = `/api/playlists/${playlistId}/analyze`;
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  /**
   * Get analysis results for a playlist
   */
  async getPlaylistAnalysis(playlistId: string): Promise<{
    playlist_id: string;
    status: string;
    analysis?: PlaylistAnalysis;
    summary?: any;
  }> {
    const endpoint = `/api/playlists/${playlistId}/analysis`;
    return this.request(endpoint);
  }

  /**
   * Get detailed information about a playlist
   */
  async getPlaylistDetails(playlistId: string): Promise<Playlist & {
    analysis_summary: any;
    needs_refresh: boolean;
  }> {
    const endpoint = `/api/playlists/${playlistId}`;
    return this.request(endpoint);
  }

  /**
   * Delete a playlist from our database
   */
  async deletePlaylist(playlistId: string): Promise<{
    message: string;
    playlist_id: string;
  }> {
    const endpoint = `/api/playlists/${playlistId}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const spotifyService = new SpotifyService();
export default spotifyService;