import { useState, useEffect } from 'react';
import { fetchHealth } from './services/api';

function App() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    fetchHealth()
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('Backend unavailable'));
  }, []);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          🌱 Smart Agri Copilot
        </h1>
        <p className="text-gray-600 mb-2">
          AI-powered agriculture assistant
        </p>
        <p className="text-sm text-gray-400">
          Backend status: <span className="font-mono">{status}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
