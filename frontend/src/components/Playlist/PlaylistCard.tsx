/**
 * PlaylistCard Component
 * Displays individual playlist information in a card format
 */
import React from 'react';
import { Playlist } from '../../services/spotify';

interface PlaylistCardProps {
  playlist: Playlist;
  onSelect: (playlist: Playlist) => void;
  onAnalyze: (playlist: Playlist) => void;
  isLoading?: boolean;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  playlist, 
  onSelect, 
  onAnalyze, 
  isLoading = false 
}) => {
  // Get playlist image or use default
  const getPlaylistImage = () => {
    if (playlist.images && playlist.images.length > 0) {
      return playlist.images[0].url;
    }
    return 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image';
  };

  // Get status color
  const getStatusColor = () => {
    switch (playlist.analysis_status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Format track count
  const formatTrackCount = (count: number) => {
    return `${count} track${count !== 1 ? 's' : ''}`;
  };

  return (
    <div className={`
      bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 
      hover:shadow-xl hover:scale-105 cursor-pointer border border-gray-700 hover:border-green-500
      ${isLoading ? 'opacity-50 pointer-events-none' : ''}
    `}>
      {/* Playlist Image */}
      <div className="relative aspect-square">
        <img
          src={getPlaylistImage()}
          alt={playlist.name}
          className="w-full h-full object-cover"
        />
        
        {/* Analysis Status Badge */}
        <div className="absolute top-2 right-2">
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium bg-gray-900 bg-opacity-80
            ${getStatusColor()}
          `}>
            {playlist.analysis_status === 'completed' && '✓ Analyzed'}
            {playlist.analysis_status === 'in_progress' && '⏳ Analyzing'}
            {playlist.analysis_status === 'failed' && '❌ Failed'}
            {playlist.analysis_status === 'pending' && '⏸️ Pending'}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        )}
      </div>

      {/* Playlist Info */}
      <div className="p-4">
        {/* Playlist Name */}
        <h3 className="text-lg font-semibold text-white mb-1 truncate" title={playlist.name}>
          {playlist.name}
        </h3>

        {/* Owner */}
        <p className="text-sm text-gray-400 mb-2">
          by {playlist.owner.display_name || playlist.owner.id}
        </p>

        {/* Description */}
        {playlist.description && (
          <p className="text-sm text-gray-300 mb-3">
            {playlist.description.length > 100 ? 
              `${playlist.description.substring(0, 100)}...` : 
              playlist.description
            }
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <span>{formatTrackCount(playlist.track_count)}</span>
          <div className="flex items-center space-x-2">
            {playlist.public ? (
              <span className="text-green-400">👁️ Public</span>
            ) : (
              <span className="text-yellow-400">🔒 Private</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(playlist);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            {playlist.tracks_fetched ? 'View Tracks' : 'Load Tracks'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(playlist);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            disabled={isLoading || playlist.track_count === 0}
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;