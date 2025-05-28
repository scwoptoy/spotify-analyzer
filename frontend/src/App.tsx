import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/Auth/LoginButton';
import LogoutButton from './components/Auth/LogoutButton';
import UserProfile from './components/Auth/UserProfile';

function App() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-400">
            Spotify Playlist Analyzer
          </h1>
          <div className="flex items-center space-x-4">
            {isAuthenticated && <UserProfile />}
            <LoginButton />
            <LogoutButton />
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
            <LoginButton />
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-4">
              Welcome! Ready to analyze your music?
            </h2>
            <p className="text-lg text-gray-300">
              Next: We'll connect to your Spotify account and load your playlists
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;