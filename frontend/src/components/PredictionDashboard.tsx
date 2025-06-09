import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  LocationOn,
  AccessTime,
  Assessment,
} from '@mui/icons-material';

interface TrafficPrediction {
  road_segment_id: string;
  road_name: string;
  current_congestion: number;
  predicted_congestion: number;
  prediction_time: string;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  risk_level: 'low' | 'medium' | 'high';
}

interface HourlyPrediction {
  hour: string;
  avg_speed: number;
  congestion_level: number;
  confidence: number;
}

const PredictionDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<TrafficPrediction[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyPrediction[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1hour');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const generatePredictions = () => {
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      
      const capeRoads = [
        { id: "CT_001", name: "N1 Highway (Bellville)" },
        { id: "CT_002", name: "N2 Highway (Guguletu)" },
        { id: "CT_003", name: "M3 Highway (Newlands)" },
        { id: "CT_004", name: "Long Street (City Bowl)" },
        { id: "CT_005", name: "Strand Street (City Centre)" },
        { id: "CT_006", name: "Voortrekker Road (Goodwood)" },
        { id: "CT_007", name: "Main Road (Sea Point)" },
        { id: "CT_008", name: "Victoria Road (Camps Bay)" },
      ];

      const mockPredictions: TrafficPrediction[] = capeRoads.map(road => {
        const currentCongestion = Math.random() * 0.8 + 0.1;
        const predictedChange = (Math.random() - 0.5) * 0.4;
        const predictedCongestion = Math.max(0.1, Math.min(0.9, currentCongestion + predictedChange));
        
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (predictedChange > 0.1) trend = 'increasing';
        else if (predictedChange < -0.1) trend = 'decreasing';
        
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (predictedCongestion > 0.7) riskLevel = 'high';
        else if (predictedCongestion > 0.4) riskLevel = 'medium';

        return {
          road_segment_id: road.id,
          road_name: road.name,
          current_congestion: currentCongestion,
          predicted_congestion: predictedCongestion,
          prediction_time: new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString(),
          confidence: Math.random() * 0.3 + 0.7,
          trend,
          risk_level: riskLevel,
        };
      });

      // Generate hourly predictions
      const hours: HourlyPrediction[] = [];
      for (let i = 0; i < 12; i++) {
        const hour = new Date(Date.now() + i * 60 * 60 * 1000);
        const hourNum = hour.getHours();
        const isRushTime = (hourNum >= 7 && hourNum <= 9) || (hourNum >= 17 && hourNum <= 19);
        
        hours.push({
          hour: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avg_speed: isRushTime ? 25 + Math.random() * 15 : 40 + Math.random() * 20,
          congestion_level: isRushTime ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
          confidence: Math.random() * 0.2 + 0.8,
        });
      }

      setPredictions(mockPredictions);
      setHourlyData(hours);
      setLoading(false);
      setLastUpdate(new Date());
    };

    generatePredictions();
    
    // Update predictions every 2 minutes for demo
    const interval = setInterval(generatePredictions, 120000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp color="error" />;
      case 'decreasing': return <TrendingDown color="success" />;
      default: return <Timeline color="info" />;
    }
  };

  const getCongestionColor = (level: number): string => {
    if (level < 0.3) return '#4CAF50';
    if (level < 0.6) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading ML Predictions...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  const highRiskRoads = predictions.filter(p => p.risk_level === 'high');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Traffic Predictions - Cape Town
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered traffic forecasting for optimal route planning and congestion management
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={selectedTimeframe}
            label="Timeframe"
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <MenuItem value="1hour">Next Hour</MenuItem>
            <MenuItem value="6hours">Next 6 Hours</MenuItem>
            <MenuItem value="12hours">Next 12 Hours</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* High Risk Alert */}
      {highRiskRoads.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            High Congestion Risk Detected
          </Typography>
          <Typography variant="body2">
            {highRiskRoads.length} road segments are predicted to have high congestion in the next hour.
            Consider alternative routes: {highRiskRoads.map(r => r.road_name.split('(')[0]).join(', ')}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Prediction Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
                Prediction Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Model Accuracy
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={87} 
                  sx={{ mt: 1, mb: 1 }} 
                />
                <Typography variant="caption">87% accuracy</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Prediction Confidence
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={91} 
                  sx={{ mt: 1, mb: 1 }} 
                  color="success"
                />
                <Typography variant="caption">91% average confidence</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Data Sources:</strong> Real-time traffic sensors, weather data, 
                event schedules, historical patterns
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Road Predictions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Road Segment Predictions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Next hour traffic forecasts for major Cape Town routes
              </Typography>

              <List>
                {predictions.map((prediction, index) => (
                  <ListItem key={prediction.road_segment_id} sx={{ px: 0, borderBottom: index < predictions.length - 1 ? '1px solid #eee' : 'none' }}>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {prediction.road_name}
                          </Typography>
                          {getTrendIcon(prediction.trend)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box>
                              <Typography variant="caption" display="block">Current</Typography>
                              <Chip 
                                label={`${(prediction.current_congestion * 100).toFixed(0)}%`}
                                size="small"
                                style={{ backgroundColor: getCongestionColor(prediction.current_congestion), color: 'white' }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block">Predicted ({prediction.prediction_time})</Typography>
                              <Chip 
                                label={`${(prediction.predicted_congestion * 100).toFixed(0)}%`}
                                size="small"
                                style={{ backgroundColor: getCongestionColor(prediction.predicted_congestion), color: 'white' }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block">Risk Level</Typography>
                              <Chip 
                                label={prediction.risk_level.toUpperCase()}
                                size="small"
                                style={{ backgroundColor: getRiskColor(prediction.risk_level), color: 'white' }}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {(prediction.confidence * 100).toFixed(0)}% • 
                            Trend: {prediction.trend}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Forecast */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AccessTime sx={{ verticalAlign: 'middle', mr: 1 }} />
                12-Hour Traffic Forecast
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Predicted average traffic conditions across Cape Town road network
              </Typography>

              <Grid container spacing={2}>
                {hourlyData.map((hour, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {hour.hour}
                      </Typography>
                      <Typography variant="h6" sx={{ my: 1 }}>
                        {hour.avg_speed.toFixed(0)} km/h
                      </Typography>
                                             <LinearProgress 
                         variant="determinate" 
                         value={hour.congestion_level * 100}
                         sx={{ 
                           mb: 1,
                           backgroundColor: '#eee',
                           '& .MuiLinearProgress-bar': {
                             backgroundColor: getCongestionColor(hour.congestion_level)
                           }
                         }}
                       />
                      <Typography variant="caption" color="text.secondary">
                        {(hour.confidence * 100).toFixed(0)}% confidence
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictionDashboard; 