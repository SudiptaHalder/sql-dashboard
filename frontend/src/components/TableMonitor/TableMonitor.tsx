import React, { useState, useEffect } from 'react';
import { useActivityStore } from '../../store/activityStore';
import { Activity, Eye, EyeOff, Filter, RefreshCw } from 'lucide-react';

const TableMonitor: React.FC = () => {
  const { activities, clearActivities } = useActivityStore();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const loadAvailableTables = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/config/tables');
      const data = await response.json();

      if (data.success) {
        const tableNames = data.tables.map((table: any) => table.table_name);
        setAvailableTables(tableNames);
        setSelectedTables(new Set(tableNames));
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const toggleTableSelection = (tableName: string) => {
    const newSelection = new Set(selectedTables);
    newSelection.has(tableName)
      ? newSelection.delete(tableName)
      : newSelection.add(tableName);
    setSelectedTables(newSelection);
  };

  const filteredActivities = activities.filter((activity) =>
    selectedTables.has(activity.table)
  );

  const getEventColor = (type: string) => {
    switch (type) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatJSON = (obj: any) => {
    if (!obj) return null;
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="h-full flex">
      <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Monitor Tables
            </h2>
            <button onClick={loadAvailableTables} className="p-1 hover:bg-gray-200 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Select tables to monitor</p>
        </div>

        <div className="p-4 border-b">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTables(new Set(availableTables))}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedTables(new Set())}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {availableTables.map((tableName) => (
            <div key={tableName} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
              <button
                onClick={() => toggleTableSelection(tableName)}
                className={`p-1 rounded ${
                  selectedTables.has(tableName)
                    ? 'text-blue-600 bg-blue-100'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {selectedTables.has(tableName) ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <span className="ml-3">{tableName}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {activities.filter((a) => a.table === tableName).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="p-4 border-l-4 rounded-lg shadow-sm bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(activity.type)}`}>
                  {activity.type}
                </span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {activity.table}
                </span>
                {activity.real && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Real Data
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {activity.before && (
                <div>
                  <p className="text-red-600 font-semibold mb-1">Before</p>
                  <pre className="bg-gray-50 p-2 rounded border max-h-40 overflow-auto">
                    {formatJSON(activity.before)}
                  </pre>
                </div>
              )}

              {activity.after && (
                <div>
                  <p className="text-green-600 font-semibold mb-1">After</p>
                  <pre className="bg-gray-50 p-2 rounded border max-h-40 overflow-auto">
                    {formatJSON(activity.after)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableMonitor;
