import { create } from 'zustand';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface AIExplanation {
  explanation: string;
  isAnomaly: boolean;
  confidence: number;
}

interface Activity {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  before: any;
  after: any;
  timestamp: string;
  aiExplanation?: AIExplanation;
}

interface ActivityState {
  activities: Activity[];
  connected: boolean;
  databaseConfig: DatabaseConfig | null;
  
  // Actions
  addActivity: (activity: Activity) => void;
  setConnected: (connected: boolean) => void;
  setDatabaseConfig: (config: DatabaseConfig | null) => void;
  clearActivities: () => void;
  getStats: () => {
    tableCounts: Record<string, number>;
    typeCounts: Record<string, number>;
  };
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  connected: false,
  databaseConfig: null,
  
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 1000) // Keep last 1000 activities
  })),
  
  setConnected: (connected) => set({ connected }),
  
  setDatabaseConfig: (databaseConfig) => set({ databaseConfig }),
  
  clearActivities: () => set({ activities: [] }),
  
  getStats: () => {
    const { activities } = get();
    const tableCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    
    activities.forEach(activity => {
      tableCounts[activity.table] = (tableCounts[activity.table] || 0) + 1;
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });
    
    return { tableCounts, typeCounts };
  }
}));

export default useActivityStore;