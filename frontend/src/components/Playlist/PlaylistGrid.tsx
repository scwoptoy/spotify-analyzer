/**
 * PlaylistGrid Component
 * Displays a grid of playlist cards with loading states and error handling
 */
import React, { useState, useEffect } from 'react';
import PlaylistCard from './PlaylistCard';
import { Playlist } from '../../services/spotify';
import spotifyService from '../../services/spotify';

interface PlaylistGridProps {
  onPlaylistSelect: (playlist: Playlist) => void;
  onPlaylistAnalyze: (playlist: Playlist) => void;
  accessToken?: string;
}

const PlaylistGrid: React.FC<PlaylistGridProps> = ({ 
  onPlaylistSelect, 
  onPlaylistAnalyze,
  accessToken 
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPlaylistIds, setLoadingPlaylistIds] = useState<Set<string>>(new Set());

// Load playlists on component mount
useEffect(() => {
  console.log('📋 PlaylistGrid useEffect triggered');
  console.log('📋 AccessToken received:', !!accessToken);
  console.log('📋 About to call loadPlaylists...');
  loadPlaylists();
}, [accessToken]);

  const loadPlaylists = async (refresh: boolean = false) => {
    console.log('📋 loadPlaylists called with:', { refresh, accessToken: !!accessToken });
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Loading playlists...', { accessToken: !!accessToken });
      
      let fetchedPlaylists: Playlist[];
      
      if (accessToken) {
        // Use OAuth endpoint if we have an access token
        console.log('Using OAuth endpoint with access token');
        fetchedPlaylists = await spotifyService.getPlaylistsOAuth(accessToken, refresh);
      } else {
        // Fallback to old endpoint for backward compatibility
        console.log('Using fallback endpoint (no access token)');
        fetchedPlaylists = await spotifyService.getPlaylists(refresh);
      }
      
      console.log(`Loaded ${fetchedPlaylists.length} playlists`);
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      console.error('Error loading playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePlaylistSelect = async (playlist: Playlist) => {
    try {
      setLoadingPlaylistIds(prev => new Set(prev).add(playlist.spotify_id));
      
      // If tracks haven't been fetched, fetch them first
      if (!playlist.tracks_fetched) {
        console.log(`Fetching tracks for playlist: ${playlist.name}`);
        await spotifyService.getPlaylistTracks(playlist.spotify_id);
        
        // Update the playlist in our state
        setPlaylists(prev => prev.map(p => 
          p.spotify_id === playlist.spotify_id 
            ? { ...p, tracks_fetched: true }
            : p
        ));
      }
      
      onPlaylistSelect(playlist);
    } catch (err) {
      console.error('Error selecting playlist:', err);
      setError(`Failed to load tracks for ${playlist.name}`);
    } finally {
      setLoadingPlaylistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlist.spotify_id);
        return newSet;
      });
    }
  };

  const handlePlaylistAnalyze = async (playlist: Playlist) => {
    try {
      setLoadingPlaylistIds(prev => new Set(prev).add(playlist.spotify_id));
      
      // If analysis is already completed, just show it
      if (playlist.analysis_status === 'completed') {
        onPlaylistAnalyze(playlist);
        return;
      }

      // First ensure tracks are fetched
      if (!playlist.tracks_fetched) {
        console.log(`Fetching tracks for analysis: ${playlist.name}`);
        await spotifyService.getPlaylistTracks(playlist.spotify_id);
      }

      // Then fetch audio features
      console.log(`Fetching audio features for: ${playlist.name}`);
      await spotifyService.fetchAudioFeatures(playlist.spotify_id);

      // Start analysis
      console.log(`Starting analysis for: ${playlist.name}`);
      await spotifyService.analyzePlaylist(playlist.spotify_id);

      // Update playlist status
      setPlaylists(prev => prev.map(p => 
        p.spotify_id === playlist.spotify_id 
          ? { ...p, tracks_fetched: true, analysis_status: 'in_progress' as const }
          : p
      ));

      // Notify parent component
      onPlaylistAnalyze({ ...playlist, analysis_status: 'in_progress' });
      
    } catch (err) {
      console.error('Error analyzing playlist:', err);
      setError(`Failed to analyze ${playlist.name}`);
    } finally {
      setLoadingPlaylistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlist.spotify_id);
        return newSet;
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
        <p className="text-gray-300 text-lg">Loading your playlists...</p>
        <p className="text-gray-500 text-sm mt-2">
          {accessToken ? 'Fetching from your Spotify account...' : 'This may take a moment'}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-300 mb-6 text-center max-w-md">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => loadPlaylists()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Try Again
          </button>
          <button
            onClick={() => setError(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-gray-400 text-6xl mb-4">🎵</div>
        <h3 className="text-xl font-semibold text-white mb-2">No playlists found</h3>
        <p className="text-gray-300 mb-6 text-center max-w-md">
          {accessToken 
            ? "We couldn't find any playlists in your Spotify account. Make sure you have playlists with tracks."
            : "Please connect your Spotify account to see your playlists."
          }
        </p>
        <button
          onClick={() => loadPlaylists(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh from Spotify'}
        </button>
      </div>
    );
  }

  // Success state - show playlists
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
          <p className="text-gray-400">
            Found {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} in your Spotify account
          </p>
        </div>
        
        <button
          onClick={() => loadPlaylists(true)}
          className={`
            px-4 py-2 rounded-md font-medium transition-colors duration-200
            ${refreshing 
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
          disabled={refreshing}
        >
          {refreshing ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Refreshing...
            </span>
          ) : (
            '🔄 Refresh'
          )}
        </button>
      </div>

      {/* Error Alert (if any) */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            <span className="text-red-100">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.spotify_id}
            playlist={playlist}
            onSelect={handlePlaylistSelect}
            onAnalyze={handlePlaylistAnalyze}
            isLoading={loadingPlaylistIds.has(playlist.spotify_id)}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>
          Total tracks across all playlists: {playlists.reduce((sum, p) => sum + p.track_count, 0).toLocaleString()}
        </p>
        <p>
          Analyzed: {playlists.filter(p => p.analysis_status === 'completed').length} | 
          Pending: {playlists.filter(p => p.analysis_status === 'pending').length}
        </p>
      </div>
    </div>
  );
};

export default PlaylistGrid;