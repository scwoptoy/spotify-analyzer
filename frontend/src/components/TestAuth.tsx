import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi, authApi } from '../services/api';

const TestAuth: React.FC = () => {
  const { isAuthenticated } = useAuth0();
  const { makeAuthenticatedRequest } = useApi();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProtectedEndpoint = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const data = await makeAuthenticatedRequest(authApi.getUserProfile());
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch protected data' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Test Authentication</h3>
      <button
        onClick={testProtectedEndpoint}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded"
      >
        {loading ? 'Testing...' : 'Test Protected Endpoint'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-700 rounded">
          <pre className="text-sm text-green-400">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestAuth;