import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Box, Paper, Typography, Button, Switch, FormControlLabel } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface TrafficData {
  road_segment_id: string;
  latitude: number;
  longitude: number;
  flow_speed: number;
  congestion_level: number;
  timestamp: string;
}

interface RouteData {
  route_id: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  total_distance: number;
  estimated_time: number;
}

// Cape Town default bounds and center
const DEFAULT_CENTER: [number, number] = [-33.9249, 18.4241];  // Cape Town City Centre
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [-34.0928, 18.2844],  // Southwest
  [-33.8567, 18.6230]   // Northeast
];

const TrafficMap: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Fetch traffic data
  const fetchTrafficData = useCallback(async () => {
    try {
      // Try multiple endpoints to ensure connectivity
      const endpoints = [
        'http://localhost:8000/api/traffic/current',
        '/api/traffic/current',
        'http://traffic-api:8000/api/traffic/current'
      ];
      
      let response;
      let data;
      
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint);
          if (response.ok) {
            data = await response.json();
            console.log('Successfully fetched data from:', endpoint);
            if (data.traffic_data && data.traffic_data.length > 0) {
              setTrafficData(data.traffic_data);
              return;
            }
          }
        } catch (err) {
          console.log('Failed to fetch from:', endpoint, err);
          continue;
        }
      }
      
      // If all API calls fail, use mock Cape Town data
      console.log('All API endpoints failed, using mock Cape Town data');
      setTrafficData(generateMockTrafficData());
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      // Use mock data for demo with Cape Town locations
      setTrafficData(generateMockTrafficData());
    }
  }, []);

  // Generate mock traffic data for Cape Town demo
  const generateMockTrafficData = (): TrafficData[] => {
    const mockData: TrafficData[] = [];
    const capeTownSegments = [
      { id: 'CT_001', lat: -33.8992, lng: 18.6292, name: 'N1 Highway (Bellville)' },
      { id: 'CT_002', lat: -33.9769, lng: 18.5845, name: 'N2 Highway (Guguletu)' },
      { id: 'CT_003', lat: -33.9731, lng: 18.4632, name: 'M3 Highway (Newlands)' },
      { id: 'CT_004', lat: -33.9249, lng: 18.4241, name: 'Long Street (City Bowl)' },
      { id: 'CT_005', lat: -33.9205, lng: 18.4235, name: 'Strand Street (City Centre)' },
      { id: 'CT_006', lat: -33.8927, lng: 18.5408, name: 'Voortrekker Road (Goodwood)' },
      { id: 'CT_007', lat: -33.9149, lng: 18.3796, name: 'Main Road (Sea Point)' },
      { id: 'CT_008', lat: -33.9508, lng: 18.3776, name: 'Victoria Road (Camps Bay)' },
      { id: 'CT_009', lat: -33.9317, lng: 18.4145, name: 'Kloof Street (Gardens)' },
      { id: 'CT_010', lat: -33.9570, lng: 18.4709, name: 'Rondebosch Main Road' },
    ];

    capeTownSegments.forEach((segment, index) => {
      // Simulate different traffic conditions based on time of day
      const currentHour = new Date().getHours();
      let congestionLevel = 0.3; // Base congestion
      
      // Rush hour adjustments
      if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
        congestionLevel = Math.random() * 0.5 + 0.4; // 0.4 - 0.9
      } else if (currentHour >= 10 && currentHour <= 16) {
        congestionLevel = Math.random() * 0.4 + 0.2; // 0.2 - 0.6
      } else {
        congestionLevel = Math.random() * 0.3 + 0.1; // 0.1 - 0.4
      }

      const baseSpeed = segment.name.includes('Highway') ? 80 : 50;
      const currentSpeed = baseSpeed * (1 - congestionLevel);

      mockData.push({
        road_segment_id: segment.id,
        latitude: segment.lat + (Math.random() - 0.5) * 0.002,
        longitude: segment.lng + (Math.random() - 0.5) * 0.002,
        flow_speed: Math.round(currentSpeed),
        congestion_level: Math.round(congestionLevel * 100) / 100,
        timestamp: new Date().toISOString()
      });
    });

    return mockData;
  };

  // Get traffic color based on congestion level
  const getTrafficColor = (congestionLevel: number): string => {
    if (congestionLevel < 0.3) return '#4CAF50'; // Green - light traffic
    if (congestionLevel < 0.6) return '#FF9800'; // Orange - moderate traffic
    return '#F44336'; // Red - heavy traffic
  };

  // Create custom traffic marker
  const createTrafficMarker = (trafficPoint: TrafficData) => {
    const color = getTrafficColor(trafficPoint.congestion_level);
    return new L.DivIcon({
      className: 'custom-traffic-marker',
      html: `<div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Map click handler and center controller
  const MapEvents = () => {
    const map = useMapEvents({
      click: (e) => {
        console.log('Map clicked at:', e.latlng);
        // Could be used for route planning
      }
    });

    // Force map to center on Cape Town when traffic data loads
    useEffect(() => {
      if (trafficData.length > 0 && map) {
        map.setView(mapCenter, 12);
      }
    }, [trafficData, mapCenter, map]);

    return null;
  };

  useEffect(() => {
    fetchTrafficData();
    setLoading(false);

    // Set up real-time updates
    const interval = setInterval(fetchTrafficData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchTrafficData]);

  // Update map center when traffic data loads
  useEffect(() => {
    if (trafficData.length > 0) {
      // Calculate center from Cape Town traffic data
      const latSum = trafficData.reduce((sum, point) => sum + point.latitude, 0);
      const lngSum = trafficData.reduce((sum, point) => sum + point.longitude, 0);
      const centerLat = latSum / trafficData.length;
      const centerLng = lngSum / trafficData.length;
      
      // Ensure it's within Cape Town bounds
      if (centerLat >= -34.1 && centerLat <= -33.8 && centerLng >= 18.2 && centerLng <= 18.7) {
        setMapCenter([centerLat, centerLng]);
      } else {
        // Fallback to Cape Town city center
        setMapCenter(DEFAULT_CENTER);
      }
    }
  }, [trafficData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading Cape Town traffic data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* Map Controls */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          p: 2,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Map Controls
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
              color="primary"
            />
          }
          label="Show Traffic"
        />
        <br />
        <FormControlLabel
          control={
            <Switch
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              color="primary"
            />
          }
          label="Show Routes"
        />
        <br />
        <Button
          variant="outlined"
          size="small"
          onClick={fetchTrafficData}
          sx={{ mt: 1, color: 'white', borderColor: 'white' }}
        >
          Refresh Data
        </Button>
      </Paper>

      {/* Traffic Legend */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white'
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Traffic Conditions
        </Typography>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              mr: 1
            }}
          />
          <Typography variant="caption">Light Traffic (&lt; 30%)</Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#FF9800',
              mr: 1
            }}
          />
          <Typography variant="caption">Moderate Traffic (30-60%)</Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#F44336',
              mr: 1
            }}
          />
          <Typography variant="caption">Heavy Traffic (&gt; 60%)</Typography>
        </Box>
      </Paper>

      {/* Main Map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        maxBounds={DEFAULT_BOUNDS}
        maxBoundsViscosity={1.0}
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents />

        {/* Traffic Data Markers */}
        {showTraffic && trafficData.map((point, index) => (
          <Marker
            key={`traffic-${point.road_segment_id}-${index}`}
            position={[point.latitude, point.longitude]}
            icon={createTrafficMarker(point)}
          >
            <Popup>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Road Segment: {point.road_segment_id}
                </Typography>
                <Typography variant="body2">
                  Speed: {point.flow_speed} km/h
                </Typography>
                <Typography variant="body2">
                  Congestion: {Math.round(point.congestion_level * 100)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Updated: {new Date(point.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Route Polylines */}
        {showRoutes && routes.map((route, index) => (
          <Polyline
            key={`route-${route.route_id}-${index}`}
            positions={route.geometry.coordinates.map(coord => [coord[1], coord[0]])}
            color="#667eea"
            weight={4}
            opacity={0.8}
          >
            <Popup>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Route: {route.route_id}
                </Typography>
                <Typography variant="body2">
                  Distance: {(route.total_distance / 1000).toFixed(1)} km
                </Typography>
                <Typography variant="body2">
                  Estimated Time: {Math.round(route.estimated_time / 60)} minutes
                </Typography>
              </Box>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {/* Data Summary */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          minWidth: 200
        }}
      >
        <Typography variant="h6" gutterBottom>
          Live Traffic Data
        </Typography>
        <Typography variant="body2">
          Data Points: {trafficData.length}
        </Typography>
        <Typography variant="body2">
          Active Routes: {routes.length}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Last Updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default TrafficMap; 