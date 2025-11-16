import React from 'react';
import { useActivityStore } from '../../store/activityStore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const StatsPanel: React.FC = () => {
  const { getStats, activities } = useActivityStore();
  const { tableCounts, typeCounts } = getStats();

  // Prepare data for charts
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value
  }));

  const tableData = Object.entries(tableCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const totalActivities = activities.length;
  const activeTables = Object.keys(tableCounts).length;
  const anomalyCount = activities.filter(activity => activity.aiExplanation?.isAnomaly).length;

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-xl font-bold text-blue-600">{totalActivities}</div>
          <div className="text-xs text-blue-800 font-medium">Total Events</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-xl font-bold text-green-600">{activeTables}</div>
          <div className="text-xs text-green-800 font-medium">Active Tables</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="text-xl font-bold text-purple-600">{Object.keys(typeCounts).length}</div>
          <div className="text-xs text-purple-800 font-medium">Operation Types</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="text-xl font-bold text-red-600">{anomalyCount}</div>
          <div className="text-xs text-red-800 font-medium">Anomalies</div>
        </div>
      </div>

      {/* Operation Types Chart */}
      <div className="bg-white p-3 rounded-lg border">
        <h3 className="font-semibold text-sm mb-3 text-gray-700">Operation Types</h3>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={40}
              paddingAngle={2}
              dataKey="value"
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          {typeData.map((entry, index) => (
            <div key={entry.name} className="flex items-center text-xs">
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {/* Top Tables Chart */}
      <div className="bg-white p-3 rounded-lg border">
        <h3 className="font-semibold text-sm mb-3 text-gray-700">Most Active Tables</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={tableData}>
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={40} 
              fontSize={10} 
              interval={0}
            />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="#4F46E5" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white p-3 rounded-lg border">
        <h3 className="font-semibold text-sm mb-2 text-gray-700">Recent Activity</h3>
        <div className="space-y-2">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'INSERT' ? 'bg-green-500' :
                  activity.type === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">{activity.table}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activity.type === 'INSERT' ? 'bg-green-100 text-green-800' :
                activity.type === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}>
                {activity.type}
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-4">
              No activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;