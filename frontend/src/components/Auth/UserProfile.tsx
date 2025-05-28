import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <img
        src={user.picture}
        alt={user.name}
        className="w-8 h-8 rounded-full"
      />
      <span className="text-sm font-medium">{user.name}</span>
    </div>
  );
};

export default UserProfile;