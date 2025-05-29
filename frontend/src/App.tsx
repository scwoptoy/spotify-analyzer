import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/Auth/LoginButton';
import LogoutButton from './components/Auth/LogoutButton';
import UserProfile from './components/Auth/UserProfile';
import PlaylistGrid from './components/Playlist/PlaylistGrid';
import { Playlist } from './services/spotify';

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface SpotifyUser {
  spotify_id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
}

function App() {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const [spotifyAuth, setSpotifyAuth] = useState<{
    user: SpotifyUser | null;
    tokens: SpotifyTokens | null;
    isAuthenticated: boolean;
  }>({
    user: null,
    tokens: null,
    isAuthenticated: false
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSpotifyLogin = async () => {
    try {
      setAuthLoading(true);
      
      // Get authorization URL from backend
      const response = await fetch('http://localhost:8000/api/auth/login');
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to Spotify authorization
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error starting Spotify login:', error);
      setAuthLoading(false);
    }
  };

  const handleSpotifyLogout = () => {
    setSpotifyAuth({
      user: null,
      tokens: null,
      isAuthenticated: false
    });
    localStorage.removeItem('spotify_auth');
  };

  // Check for OAuth callback on component mount
useEffect(() => {
  console.log('🔍 useEffect triggered');
  console.log('🔍 Current spotifyAuth state:', spotifyAuth);
  
  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('🔍 URL params:', { code: !!code, state: !!state });
    
    if (code && state && !spotifyAuth.isAuthenticated) {
      console.log('🔍 Processing OAuth callback...');
      try {
        setAuthLoading(true);
        
        // Exchange code for tokens
        const response = await fetch(`http://localhost:8000/api/auth/callback?code=${code}&state=${state}`);
        const data = await response.json();
        
        if (data.tokens && data.user) {
          const authData = {
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true
          };
          
          setSpotifyAuth(authData);
          localStorage.setItem('spotify_auth', JSON.stringify(authData));
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
      } finally {
        setAuthLoading(false);
      }
    }
  };
  

  // Check for saved auth in localStorage
  console.log('🔍 Checking localStorage...');
  const savedAuth = localStorage.getItem('spotify_auth');
  console.log('🔍 SavedAuth from localStorage:', savedAuth);
  
  if (savedAuth && !spotifyAuth.isAuthenticated) {
    console.log('🔍 Found saved auth, parsing...');
    try {
      const parsedAuth = JSON.parse(savedAuth);
      console.log('🔍 Parsed auth:', parsedAuth);
      console.log('🔍 Setting spotify auth state...');
      setSpotifyAuth(parsedAuth);
    } catch (error) {
      console.error('🔍 Error parsing saved auth:', error);
      localStorage.removeItem('spotify_auth');
    }
  } else {
    console.log('🔍 No saved auth or already authenticated');
  }

  handleOAuthCallback();
}, []); // Empty dependency array - only run once on mount

  // Debug useEffect to monitor auth state changes
  useEffect(() => {
    console.log('🚀 Auth state changed:', spotifyAuth);
    console.log('🚀 Is authenticated:', spotifyAuth.isAuthenticated);
    console.log('🚀 User:', spotifyAuth.user?.display_name);
  }, [spotifyAuth]);

  const handlePlaylistSelect = (playlist: Playlist) => {
    console.log('Selected playlist:', playlist);
    setSelectedPlaylist(playlist);
    setShowPlaylistView(true);
  };

  const handlePlaylistAnalyze = (playlist: Playlist) => {
    console.log('Analyzing playlist:', playlist);
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setShowPlaylistView(false);
    setSelectedPlaylist(null);
  };

  if (authLoading) {
  console.log('🖥️ Showing loading screen because:', { authLoading });
  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {authLoading ? 'Connecting to Spotify...' : 'Loading...'}
          </div>
          <div className="text-gray-400 text-sm mt-2">
            {authLoading ? 'Please complete authorization in the new window' : 'Initializing app'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
  // ADD THIS DEBUG LOGGING RIGHT BEFORE THE RETURN STATEMENT:
  console.log('🖥️ App render - Auth state:', {
    isLoading,
    authLoading, 
    spotifyAuthIsAuthenticated: spotifyAuth.isAuthenticated,
    spotifyUser: spotifyAuth.user?.display_name,
    error: !!error
  });

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
              {spotifyAuth.isAuthenticated && spotifyAuth.user && (
                <div className="flex items-center space-x-3">
                  <img
                    src={spotifyAuth.user.images[0]?.url || '/default-avatar.png'}
                    alt={spotifyAuth.user.display_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white font-medium">
                    {spotifyAuth.user.display_name}
                  </span>
                </div>
              )}
              
              {spotifyAuth.isAuthenticated ? (
                <button
                  onClick={handleSpotifyLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={handleSpotifyLogin}
                  disabled={authLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>🎵</span>
                  <span>{authLoading ? 'Connecting...' : 'Login with Spotify'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!spotifyAuth.isAuthenticated ? (
		console.log('🖥️ Showing welcome screen - not authenticated'),
          /* Welcome Screen */
          <div className="text-center py-20">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Discover Your Musical Taste
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect your Spotify account to analyze your playlists with AI-powered insights. 
              Get personalized recommendations and understand your unique musical preferences.
            </p>
            
            <div className="mb-12">
              <button
                onClick={handleSpotifyLogin}
                disabled={authLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors duration-200 flex items-center space-x-3 mx-auto"
              >
                <span>🎵</span>
                <span>{authLoading ? 'Connecting to Spotify...' : 'Connect Spotify Account'}</span>
              </button>
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
          </div>
        ) : (
          /* Authenticated User Content */
          <div>
            {!showPlaylistView ? (
              /* Playlist Grid View */
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {spotifyAuth.user?.display_name}!
                  </h1>
                  <p className="text-gray-400">
                    Ready to analyze your Spotify playlists and discover new music?
                  </p>
                </div>
                
                <PlaylistGrid
                  onPlaylistSelect={handlePlaylistSelect}
                  onPlaylistAnalyze={handlePlaylistAnalyze}
                  accessToken={spotifyAuth.tokens?.access_token}
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
                  <h3 className="text-xl font-semibold mb-2">Playlist Analysis Coming Soon</h3>
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