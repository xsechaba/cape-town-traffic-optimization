import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Schedule,
  Route,
  Traffic,
  Speed
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Destination {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface RouteResult {
  route_id: string;
  name?: string;
  total_distance: number;
  estimated_time: number;
  normal_time?: number;
  traffic_delay?: number;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  start_location?: { name: string; lat: number; lng: number };
  end_location?: { name: string; lat: number; lng: number };
  traffic_conditions?: any;
}

const RoutePlanner: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<RouteResult[]>([]);
  const [origin, setOrigin] = useState<Destination | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fix Leaflet marker icons
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Fetch popular destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        // Try multiple endpoints for better connectivity
        const endpoints = [
          'http://localhost:8000/api/destinations/popular',
          '/api/destinations/popular',
          'http://traffic-api:8000/api/destinations/popular'
        ];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success' && data.destinations) {
                console.log('Successfully fetched destinations from:', endpoint);
                setDestinations(data.destinations);
                return;
              }
            }
          } catch (err) {
            console.log('Failed to fetch destinations from:', endpoint);
            continue;
          }
        }
        
        // Fallback to Cape Town destinations
        console.log('Using fallback Cape Town destinations');
        setDestinations([
          { name: "V&A Waterfront", lat: -33.9017, lng: 18.4211, type: "shopping" },
          { name: "Table Mountain", lat: -33.9628, lng: 18.4098, type: "attraction" },
          { name: "Cape Town International Airport", lat: -33.9685, lng: 18.6017, type: "transport" },
          { name: "University of Cape Town", lat: -33.9570, lng: 18.4709, type: "education" },
          { name: "Cape Town CBD", lat: -33.9249, lng: 18.4241, type: "business" },
          { name: "Camps Bay Beach", lat: -33.9508, lng: 18.3776, type: "recreation" },
          { name: "Kirstenbosch Gardens", lat: -33.9881, lng: 18.4326, type: "attraction" },
          { name: "Stellenbosch Wine Route", lat: -33.9321, lng: 18.8602, type: "tourism" }
        ]);
      } catch (error) {
        console.error('Error fetching destinations:', error);
        // Fallback data - same as above
        setDestinations([
          { name: "V&A Waterfront", lat: -33.9017, lng: 18.4211, type: "shopping" },
          { name: "Table Mountain", lat: -33.9628, lng: 18.4098, type: "attraction" },
          { name: "Cape Town International Airport", lat: -33.9685, lng: 18.6017, type: "transport" },
          { name: "University of Cape Town", lat: -33.9570, lng: 18.4709, type: "education" },
          { name: "Cape Town CBD", lat: -33.9249, lng: 18.4241, type: "business" },
          { name: "Camps Bay Beach", lat: -33.9508, lng: 18.3776, type: "recreation" },
          { name: "Kirstenbosch Gardens", lat: -33.9881, lng: 18.4326, type: "attraction" },
          { name: "Stellenbosch Wine Route", lat: -33.9321, lng: 18.8602, type: "tourism" }
        ]);
      }
    };

    const fetchPopularRoutes = async () => {
      try {
        // Try multiple endpoints for better connectivity
        const endpoints = [
          'http://localhost:8000/api/routes/popular',
          '/api/routes/popular',
          'http://traffic-api:8000/api/routes/popular'
        ];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success' && data.routes) {
                console.log('Successfully fetched popular routes from:', endpoint);
                setPopularRoutes(data.routes);
                return;
              }
            }
          } catch (err) {
            console.log('Failed to fetch popular routes from:', endpoint);
            continue;
          }
        }
        
        console.log('All popular routes endpoints failed');
      } catch (error) {
        console.error('Error fetching popular routes:', error);
      }
    };

    fetchDestinations();
    fetchPopularRoutes();
  }, []);

  const planRoute = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try multiple endpoints for route optimization
      const endpoints = [
        'http://localhost:8000/api/routes/optimize',
        '/api/routes/optimize',
        'http://traffic-api:8000/api/routes/optimize'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              origin_lat: origin.lat,
              origin_lng: origin.lng,
              destination_lat: destination.lat,
              destination_lng: destination.lng,
              preferences: {
                optimize_for: "time",
                avoid_tolls: false
              }
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Successfully optimized route from:', endpoint);
            setRouteResult(data);
            return;
          }
        } catch (err) {
          console.log('Failed to optimize route from:', endpoint);
          continue;
        }
      }
      
      // If all endpoints fail, create a mock response
      setError('Route optimization service temporarily unavailable');
    } catch (error) {
      console.error('Error planning route:', error);
      setError('Failed to plan route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectPopularRoute = (route: RouteResult) => {
    setRouteResult(route);
    if (route.start_location && route.end_location) {
      setOrigin({
        name: route.start_location.name,
        lat: route.start_location.lat,
        lng: route.start_location.lng,
        type: 'selected'
      });
      setDestination({
        name: route.end_location.name,
        lat: route.end_location.lat,
        lng: route.end_location.lng,
        type: 'selected'
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getTrafficColor = (condition?: string): string => {
    switch (condition) {
      case 'light': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'heavy': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Route Planner - Cape Town
      </Typography>

      <Grid container spacing={3}>
        {/* Route Planning Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Your Route
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Autocomplete
                  options={destinations}
                  getOptionLabel={(option) => option.name}
                  value={origin}
                  onChange={(_, newValue) => setOrigin(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.type}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

                <Autocomplete
                  options={destinations}
                  getOptionLabel={(option) => option.name}
                  value={destination}
                  onChange={(_, newValue) => setDestination(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.type}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={planRoute}
                  disabled={loading || !origin || !destination}
                  startIcon={loading ? <CircularProgress size={20} /> : <DirectionsCar />}
                >
                  {loading ? 'Planning Route...' : 'Get Directions'}
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Route Result */}
              {routeResult && (
                <Paper sx={{ p: 0, backgroundColor: 'grey.50' }}>
                  {/* Route Map */}
                  <Box 
                    sx={{ 
                      height: '400px', 
                      width: '100%', 
                      position: 'relative',
                      '& .leaflet-container': {
                        height: '100% !important',
                        width: '100% !important'
                      }
                    }}
                  >
                    <MapContainer
                      center={[
                        ((origin?.lat || -33.9249) + (destination?.lat || -33.9249)) / 2,
                        ((origin?.lng || 18.4241) + (destination?.lng || 18.4241)) / 2
                      ]}
                      zoom={12}
                      style={{ height: '400px', width: '100%' }}
                      scrollWheelZoom={true}
                      key={`${origin?.name}-${destination?.name}`}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Origin Marker */}
                      {origin && (
                        <Marker position={[origin.lat, origin.lng]}>
                          <Popup>
                            <strong>From:</strong> {origin.name}
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Destination Marker */}
                      {destination && (
                        <Marker position={[destination.lat, destination.lng]}>
                          <Popup>
                            <strong>To:</strong> {destination.name}
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Route Line */}
                      {routeResult.geometry && routeResult.geometry.coordinates && (
                        <Polyline
                          positions={routeResult.geometry.coordinates.map(coord => [coord[1], coord[0]])}
                          color="#2196f3"
                          weight={4}
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                  </Box>
                  
                  {/* Route Details */}
                  <Box sx={{ p: 2, backgroundColor: 'white' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                      Route Details
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Route sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium" sx={{ color: 'text.secondary' }}>
                              Distance
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              {formatDistance(routeResult.total_distance)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium" sx={{ color: 'text.secondary' }}>
                              Estimated Time
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              {formatTime(routeResult.estimated_time)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {routeResult.traffic_conditions && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={`Traffic: ${
                            typeof routeResult.traffic_conditions === 'object' 
                              ? (routeResult.traffic_conditions as any).status || 'moderate'
                              : routeResult.traffic_conditions
                          }`}
                          color={
                            ((typeof routeResult.traffic_conditions === 'object' 
                              ? (routeResult.traffic_conditions as any).status 
                              : routeResult.traffic_conditions) === 'light') ? 'success' : 
                            ((typeof routeResult.traffic_conditions === 'object' 
                              ? (routeResult.traffic_conditions as any).status 
                              : routeResult.traffic_conditions) === 'moderate') ? 'warning' : 'error'
                          }
                          size="small"
                          icon={<Traffic />}
                        />
                      </Box>
                    )}

                    {routeResult.traffic_delay && routeResult.traffic_delay > 0 && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'error.main' }}>
                        +{formatTime(routeResult.traffic_delay)} due to traffic
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Routes Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Routes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a popular route to see current traffic conditions
              </Typography>

              <List>
                {popularRoutes.map((route, index) => (
                  <ListItem
                    key={route.route_id}
                    button
                    onClick={() => selectPopularRoute(route)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemIcon>
                      <DirectionsCar />
                    </ListItemIcon>
                    <ListItemText
                      primary={route.name || `Route ${index + 1}`}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatDistance(route.total_distance)} • {formatTime(route.estimated_time)}
                          </Typography>
                          {route.traffic_conditions && (
                            <Chip
                              label={route.traffic_conditions}
                              size="small"
                              sx={{
                                backgroundColor: getTrafficColor(route.traffic_conditions),
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20,
                                mt: 0.5
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {popularRoutes.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Loading popular routes...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoutePlanner; 