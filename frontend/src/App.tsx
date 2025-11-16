import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Dashboard from './components/Dashboard/Dashboard';
import Settings from './components/Settings/Settings';
import { useActivityStore } from './store/activityStore';
import { Settings as SettingsIcon, Database, Home } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [socket, setSocket] = useState<Socket | null>(null);
  const { addActivity, setConnected, setDatabaseConfig } = useActivityStore();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('sql_activity', (activity) => {
      addActivity(activity);
    });

    loadDatabaseConfig();

    return () => newSocket.close();
  }, []);

  const loadDatabaseConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/config/database');
      const data = await response.json();

      if (data.success && data.config) {
        setDatabaseConfig(data.config);
        setCurrentView('dashboard');
      } else {
        setCurrentView('settings');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setCurrentView('settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">SQL AI Dashboard</h1>
                <p className="text-xs text-gray-500">Real-time monitoring with AI insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  currentView === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>{currentView === 'dashboard' ? <Dashboard /> : <Settings />}</main>
    </div>
  );
}

export default App;
