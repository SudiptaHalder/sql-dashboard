import React, { useState, useEffect } from 'react';
import DatabaseExplorer from '../DatabaseExplorer/DatabaseExplorer';
import TableMonitor from '../TableMonitor/TableMonitor';
import ConnectionStatus from '../ConnectionStatus/ConnectionStatus';
import { Database, Table, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'monitor'>('explorer');

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              SQL Database Dashboard
            </h1>
            <p className="text-gray-600">
              Explore and monitor your MySQL database in real-time
            </p>
          </div>
          <ConnectionStatus />
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'explorer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Database Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'monitor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Table Monitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'explorer' ? <DatabaseExplorer /> : <TableMonitor />}
      </div>
    </div>
  );
};

export default Dashboard;