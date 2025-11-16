import React, { useState, useEffect } from 'react';
import { useActivityStore } from '../../store/activityStore';
import { Database, Save, TestTube, Shield, Cpu, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const Settings: React.FC = () => {
  const { setDatabaseConfig } = useActivityStore();
  const [config, setConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 3306,
    user: '',
    password: '',
    database: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/config/database');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setDatabaseConfig(data.config);
      }
    } catch (error) {
      setMessage('Failed to load current configuration');
      setMessageType('error');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/config/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Database configuration saved successfully!');
        setMessageType('success');
        setDatabaseConfig(config);
      } else {
        setMessage('Error: ' + data.error);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage('Connection failed: ' + error.message);
      setMessageType('error');
    }

    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage('Testing real MySQL connection...');

    try {
      const response = await fetch('http://localhost:3000/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setMessageType('success');
      } else {
        setMessage(`❌ Connection failed: ${data.error}`);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
      setMessageType('error');
    }

    setLoading(false);
  };

  const handleInputChange = (field: keyof DatabaseConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* settings UI remains identical */}

      {/* If you want I can shorten or beautify this UI, just ask */}
    </div>
  );
};

export default Settings;
