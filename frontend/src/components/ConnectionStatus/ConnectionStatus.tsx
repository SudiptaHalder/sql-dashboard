import React from 'react';
import { useActivityStore } from '../../store/activityStore';
import { Wifi, WifiOff, Database, AlertCircle } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { connected, databaseConfig } = useActivityStore();

  return (
    <div className="flex items-center space-x-3">
      {/* Database Connection Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
        databaseConfig 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
      }`}>
        {databaseConfig ? (
          <Database className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {databaseConfig ? databaseConfig.database : 'No Database'}
        </span>
      </div>

      {/* WebSocket Connection Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
        connected 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        {connected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;