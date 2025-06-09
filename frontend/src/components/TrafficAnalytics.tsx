import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Traffic,
  Schedule,
  Speed,
  Assessment,
  LocationOn
} from '@mui/icons-material';

interface TrafficInsight {
  metric: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface RoadPerformance {
  road_name: string;
  average_speed: number;
  congestion_level: number;
  incidents_count: number;
  efficiency_score: number;
}

const TrafficAnalytics: React.FC = () => {
  const [insights, setInsights] = useState<TrafficInsight[]>([]);
  const [roadPerformance, setRoadPerformance] = useState<RoadPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock analytics data for Cape Town
    const generateInsights = () => {
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      
      const mockInsights: TrafficInsight[] = [
        {
          metric: "Average Speed",
          value: isRushHour ? "32 km/h" : "45 km/h",
          change: isRushHour ? -15 : +8,
          trend: isRushHour ? 'down' : 'up',
          description: "City-wide average traffic speed"
        },
        {
          metric: "Congestion Level", 
          value: isRushHour ? "High" : "Moderate",
          change: isRushHour ? +25 : -10,
          trend: isRushHour ? 'up' : 'down',
          description: "Overall traffic congestion across Cape Town"
        },
        {
          metric: "Active Incidents",
          value: Math.floor(Math.random() * 5 + 2).toString(),
          change: Math.floor(Math.random() * 10 - 5),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          description: "Current traffic incidents reported"
        },
        {
          metric: "Travel Time Index",
          value: isRushHour ? "1.8" : "1.2",
          change: isRushHour ? +35 : -15,
          trend: isRushHour ? 'up' : 'down',
          description: "Compared to free-flow conditions"
        }
      ];

      const mockRoadPerformance: RoadPerformance[] = [
        {
          road_name: "N1 Highway (Bellville)",
          average_speed: isRushHour ? 45 : 80,
          congestion_level: isRushHour ? 0.8 : 0.3,
          incidents_count: Math.floor(Math.random() * 3),
          efficiency_score: isRushHour ? 60 : 85
        },
        {
          road_name: "N2 Highway (Guguletu)",
          average_speed: isRushHour ? 40 : 75,
          congestion_level: isRushHour ? 0.7 : 0.4,
          incidents_count: Math.floor(Math.random() * 2),
          efficiency_score: isRushHour ? 65 : 80
        },
        {
          road_name: "M3 Highway (Newlands)",
          average_speed: isRushHour ? 35 : 65,
          congestion_level: isRushHour ? 0.9 : 0.2,
          incidents_count: Math.floor(Math.random() * 4),
          efficiency_score: isRushHour ? 45 : 90
        },
        {
          road_name: "Long Street (City Bowl)",
          average_speed: isRushHour ? 25 : 40,
          congestion_level: isRushHour ? 0.6 : 0.3,
          incidents_count: Math.floor(Math.random() * 2),
          efficiency_score: isRushHour ? 70 : 85
        },
        {
          road_name: "Victoria Road (Camps Bay)",
          average_speed: isRushHour ? 30 : 50,
          congestion_level: isRushHour ? 0.5 : 0.2,
          incidents_count: Math.floor(Math.random() * 1),
          efficiency_score: isRushHour ? 75 : 92
        }
      ];

      setInsights(mockInsights);
      setRoadPerformance(mockRoadPerformance);
      setLoading(false);
    };

    generateInsights();
    
    // Update data every 30 seconds for demo
    const interval = setInterval(generateInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEfficiencyColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getCongestionColor = (level: number): string => {
    if (level < 0.3) return '#4CAF50';
    if (level < 0.6) return '#FF9800';
    return '#F44336';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="error" />;
      case 'down': return <TrendingDown color="success" />;
      default: return <Assessment color="info" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading Analytics...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Traffic Analytics - Cape Town
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Real-time insights and performance metrics for Cape Town's road network
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {insights.map((insight, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      {insight.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {insight.metric}
                    </Typography>
                  </Box>
                  {getTrendIcon(insight.trend)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    label={`${insight.change > 0 ? '+' : ''}${insight.change}%`}
                    size="small"
                    color={insight.change > 0 ? 'error' : 'success'}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs last hour
                  </Typography>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {insight.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Road Performance */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Road Performance Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current performance metrics for major Cape Town routes
              </Typography>

              <List>
                {roadPerformance.map((road, index) => (
                  <React.Fragment key={road.road_name}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText
                        primary={road.road_name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption" display="block">
                                  Speed: {road.average_speed} km/h
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ mr: 1 }}>
                                    Congestion:
                                  </Typography>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 8,
                                      backgroundColor: getCongestionColor(road.congestion_level),
                                      borderRadius: 1
                                    }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption">
                                  Incidents: {road.incidents_count}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ mr: 1 }}>
                                    Efficiency:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: getEfficiencyColor(road.efficiency_score),
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {road.efficiency_score}%
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < roadPerformance.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Traffic Insights */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Traffic Insights
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Peak hours: 7-9 AM and 5-7 PM show highest congestion
                </Typography>
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Conditions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date().getHours() >= 7 && new Date().getHours() <= 9
                    ? "Morning rush hour - expect delays on highways"
                    : new Date().getHours() >= 17 && new Date().getHours() <= 19
                    ? "Evening rush hour - heavy traffic expected"
                    : "Normal traffic conditions"
                  }
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Schedule fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Alternative Routes"
                      secondary="Consider M3 to avoid N1 congestion"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Warning fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Weather Impact"
                      secondary="Cape winds may affect highway traffic"
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrafficAnalytics; 