import React, { useState } from 'react';

// Temporary mock authentication for development
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const mockLogin = () => {
    setIsAuthenticated(true);
  };
  
  const mockLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-400">
            Spotify Playlist Analyzer
          </h1>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="flex items-center space-x-3">
                <img
                  src="https://via.placeholder.com/32"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">Test User</span>
              </div>
            )}
            {!isAuthenticated ? (
              <button
                onClick={mockLogin}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Login with Spotify (Mock)
              </button>  
            ) : (
              <button
                onClick={mockLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {!isAuthenticated ? (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">
              Discover Your Musical Taste
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Analyze your Spotify playlists and get personalized recommendations
            </p>
            <button
              onClick={mockLogin}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Login with Spotify (Mock)
            </button>
            
            <div className="mt-8 text-xs text-gray-500">
              <p>Note: Using mock authentication for development</p>
              <p>Auth0 integration can be added later</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-4">
              Welcome! Ready to analyze your music?
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Next: We'll connect to your Spotify account and load your playlists
            </p>
            
            <div className="mt-8 p-6 bg-gray-800 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">✅ Authentication Working!</h3>
              <p className="text-gray-300">
                Mock authentication successful. Ready to continue with Spotify integration.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;