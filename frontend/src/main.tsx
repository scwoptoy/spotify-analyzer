import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/Auth/LoginButton';
import LogoutButton from './components/Auth/LogoutButton';
import UserProfile from './components/Auth/UserProfile';
import PlaylistGrid from './components/Playlist/PlaylistGrid';
import { Playlist } from './services/spotify';

function App() {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  
  // Debug logging - this will help us see what's happening with Auth0
  console.log('Auth0 State:', { isLoading, isAuthenticated, error });
  console.log('Environment Variables:', {
    domain: process.env.REACT_APP_AUTH0_DOMAIN,
    clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
    apiUrl: process.env.REACT_APP_API_URL
  });

  const handlePlaylistSelect = (playlist: Playlist) => {
    console.log('Selected playlist:', playlist);
    setSelectedPlaylist(playlist);
    setShowPlaylistView(true);
  };

  const handlePlaylistAnalyze = (playlist: Playlist) => {
    console.log('Analyzing playlist:', playlist);
    setSelectedPlaylist(playlist);
    // We'll implement analysis view later
  };

  const handleBackToPlaylists = () => {
    setShowPlaylistView(false);
    setSelectedPlaylist(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
          <div className="text-gray-400 text-sm mt-2">
            Initializing Spotify Playlist Analyzer
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <div className="text-red-400 text-xl mb-4">
            Authentication Error
          </div>
          <div className="text-gray-300 mb-6">
            {error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={handleBackToPlaylists}
                className="text-2xl font-bold text-green-400 hover:text-green-300 transition-colors duration-200"
              >
                🎵 Spotify Playlist Analyzer
              </button>
              {selectedPlaylist && showPlaylistView && (
                <span className="text-gray-400 ml-4">
                  / {selectedPlaylist.name}
                </span>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && <UserProfile />}
              <LoginButton />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* Welcome Screen */
          <div className="text-center py-20">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Discover Your Musical Taste
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Analyze your Spotify playlists with AI-powered insights. Get personalized recommendations 
              and understand your unique musical preferences.
            </p>
            
            <div className="mb-12">
              <LoginButton />
            </div>
            
            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl mb-4">🎼</div>
                <h3 className="text-lg font-semibold mb-2">Musical Analysis</h3>
                <p className="text-gray-400">
                  Deep dive into your playlist's audio features, mood, and energy levels
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-gray-400">
                  Get personalized song recommendations based on your taste profile
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Visual Insights</h3>
                <p className="text-gray-400">
                  Beautiful charts and visualizations of your musical preferences
                </p>
              </div>
            </div>
            
            {/* Debug info for development */}
            <div className="mt-12 text-xs text-gray-600 space-y-1">
              <p>🔧 Development Mode Active</p>
              <p>Status: Ready for Spotify Integration</p>
              <p>Backend: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</p>
            </div>
          </div>
        ) : (
          /* Authenticated User Content */
          <div>
            {!showPlaylistView ? (
              /* Playlist Grid View */
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
                  <p className="text-gray-400">
                    Ready to analyze your Spotify playlists and discover new music?
                  </p>
                </div>
                
                <PlaylistGrid
                  onPlaylistSelect={handlePlaylistSelect}
                  onPlaylistAnalyze={handlePlaylistAnalyze}
                />
              </div>
            ) : (
              /* Individual Playlist View */
              <div>
                <div className="mb-6">
                  <button
                    onClick={handleBackToPlaylists}
                    className="flex items-center text-green-400 hover:text-green-300 mb-4"
                  >
                    ← Back to Playlists
                  </button>
                  
                  <h1 className="text-3xl font-bold mb-2">{selectedPlaylist?.name}</h1>
                  <p className="text-gray-400">
                    {selectedPlaylist?.track_count} tracks • 
                    by {selectedPlaylist?.owner.display_name || selectedPlaylist?.owner.id}
                  </p>
                </div>
                
                {/* Playlist Details - We'll implement this next */}
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🎵</div>
                  <h3 className="text-xl font-semibold mb-2">Playlist View Coming Soon</h3>
                  <p className="text-gray-400 mb-6">
                    We're working on the detailed playlist view with track listings and analysis results.
                  </p>
                  <p className="text-sm text-gray-500">
                    Selected: {selectedPlaylist?.name} ({selectedPlaylist?.track_count} tracks)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;