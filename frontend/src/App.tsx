// Spotify Playlist Analyzer - Main App Component
import React, { useEffect, useState } from 'react';
import './App.css';

interface ApiStatus {
  api_version: string;
  status: string;
  features: {
    authentication: string;
    playlist_analysis: string;
    recommendations: string;
  };
  timestamp: string;
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection to backend
    const checkApiConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApiStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to API');
      } finally {
        setIsLoading(false);
      }
    };

    checkApiConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎵 Spotify Playlist Analyzer
          </h1>
          <p className="text-xl text-green-200">
            AI-powered music taste analysis and playlist generation
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              🚀 Development Environment Status
            </h2>
            
            {isLoading && (
              <div className="text-center text-green-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                Connecting to backend...
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-6">
                <h3 className="text-red-200 font-semibold mb-2">❌ Connection Error</h3>
                <p className="text-red-300">{error}</p>
                <p className="text-red-300 text-sm mt-2">
                  Make sure the backend is running: <code>docker-compose up backend</code>
                </p>
              </div>
            )}

            {apiStatus && (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
                  <h3 className="text-green-200 font-semibold mb-2">✅ Backend Connected</h3>
                  <p className="text-green-300">API Status: {apiStatus.status}</p>
                  <p className="text-green-300 text-sm">Version: {apiStatus.api_version}</p>
                </div>

                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6">
                  <h3 className="text-blue-200 font-semibold mb-4">🛠️ Feature Development Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔐</div>
                      <p className="text-blue-200 font-medium">Authentication</p>
                      <p className="text-sm text-blue-300 capitalize">{apiStatus.features.authentication.replace('_', ' ')}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-blue-200 font-medium">Playlist Analysis</p>
                      <p className="text-sm text-blue-300 capitalize">{apiStatus.features.playlist_analysis.replace('_', ' ')}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-blue-200 font-medium">Recommendations</p>
                      <p className="text-sm text-blue-300 capitalize">{apiStatus.features.recommendations.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              📋 Development Roadmap
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-200">✅ Docker Environment Setup</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-200">🔄 Next: Auth0 + Spotify Authentication</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-gray-300">⏳ Playlist Data Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-gray-300">⏳ Music Analysis Engine</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-gray-300">⏳ Recommendation System</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;