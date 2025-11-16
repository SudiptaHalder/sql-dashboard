import React from 'react';
import { useActivityStore } from '../../store/activityStore';
import { AlertTriangle, CheckCircle, Info, Database, Shield } from 'lucide-react';

const ActivityStream: React.FC = () => {
  const { activities } = useActivityStore();

  const getEventIcon = (type: string, isAnomaly?: boolean) => {
    if (isAnomaly) return <Shield className="w-4 h-4 text-red-500" />;
    
    switch (type) {
      case 'INSERT': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'UPDATE': return <Info className="w-4 h-4 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: string, isAnomaly?: boolean) => {
    if (isAnomaly) return 'border-red-200 bg-red-50 hover:bg-red-100';
    
    switch (type) {
      case 'INSERT': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'UPDATE': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'DELETE': return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatJSON = (obj: any) => {
    if (!obj) return null;
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`p-4 border-l-4 rounded-lg shadow-sm transition-all duration-200 ${getEventColor(activity.type, activity.aiExplanation?.isAnomaly)}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1">
              {getEventIcon(activity.type, activity.aiExplanation?.isAnomaly)}
              <span className="font-semibold text-sm capitalize">{activity.type.toLowerCase()}</span>
              <span className="text-xs text-gray-500">on</span>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border text-gray-800">
                {activity.table}
              </span>
              {activity.aiExplanation?.isAnomaly && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Anomaly Detected
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {/* AI Explanation */}
          {activity.aiExplanation && (
            <div className="mt-3 p-3 bg-white rounded border text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">AI Analysis</span>
                <span className="text-xs text-gray-500">
                  Confidence: {(activity.aiExplanation.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{activity.aiExplanation.explanation}</p>
            </div>
          )}
          
          {/* Data Diff */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activity.before && (
              <div>
                <div className="font-semibold text-red-600 mb-1 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Before
                </div>
                <pre className="bg-white p-2 rounded border overflow-x-auto text-xs font-mono">
                  {formatJSON(activity.before)}
                </pre>
              </div>
            )}
            {activity.after && (
              <div>
                <div className="font-semibold text-green-600 mb-1 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  After
                </div>
                <pre className="bg-white p-2 rounded border overflow-x-auto text-xs font-mono">
                  {formatJSON(activity.after)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Empty State */}
      {activities.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No activity detected</p>
          <p className="text-sm text-gray-500 mt-1">
            Database changes will appear here in real-time
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityStream;