import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TrafficData {
  road_segment_id: string;
  latitude: number;
  longitude: number;
  flow_speed: number;
  congestion_level: number;
  timestamp: string;
}

interface TrafficDataContextType {
  trafficData: TrafficData[];
  setTrafficData: (data: TrafficData[]) => void;
  updateTrafficPoint: (point: TrafficData) => void;
}

const TrafficDataContext = createContext<TrafficDataContextType | undefined>(undefined);

export const useTrafficData = () => {
  const context = useContext(TrafficDataContext);
  if (context === undefined) {
    throw new Error('useTrafficData must be used within a TrafficDataProvider');
  }
  return context;
};

interface TrafficDataProviderProps {
  children: ReactNode;
}

export const TrafficDataProvider: React.FC<TrafficDataProviderProps> = ({ children }) => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);

  const updateTrafficPoint = (point: TrafficData) => {
    setTrafficData(prev => {
      const index = prev.findIndex(p => p.road_segment_id === point.road_segment_id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = point;
        return updated;
      } else {
        return [...prev, point];
      }
    });
  };

  return (
    <TrafficDataContext.Provider value={{
      trafficData,
      setTrafficData,
      updateTrafficPoint
    }}>
      {children}
    </TrafficDataContext.Provider>
  );
}; 