import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Divider,
  Badge,
} from '@mui/material';
import {
  Circle,
  Speed,
  Warning,
  CheckCircle,
  CloudDownload,
  Timeline,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';

interface LiveTrafficData {
  road_segment_id: string;
  road_name: string;
  current_speed: number;
  congestion_level: number;
  last_update: string;
  status: 'normal' | 'slow' | 'congested';
}

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  last_update: string;
}

interface DataStream {
  name: string;
  messages_per_second: number;
  total_messages: number;
  last_message: string;
  status: 'active' | 'delayed' | 'inactive';
}

const RealTimeData: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveTrafficData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [dataStreams, setDataStreams] = useState<DataStream[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  useEffect(() => {
    const updateLiveData = () => {
      const capeRoads = [
        "N1 Highway (Bellville)",
        "N2 Highway (Guguletu)", 
        "M3 Highway (Newlands)",
        "Long Street (City Bowl)",
        "Strand Street (City Centre)",
        "Voortrekker Road (Goodwood)",
        "Main Road (Sea Point)",
        "Victoria Road (Camps Bay)"
      ];

      const newLiveData: LiveTrafficData[] = capeRoads.map((road, index) => {
        const speed = Math.random() * 50 + 20;
        const congestion = Math.random();
        let status: 'normal' | 'slow' | 'congested' = 'normal';
        
        if (congestion > 0.7) status = 'congested';
        else if (congestion > 0.4) status = 'slow';

        return {
          road_segment_id: `CT_${String(index + 1).padStart(3, '0')}`,
          road_name: road,
          current_speed: speed,
          congestion_level: congestion,
          last_update: new Date().toLocaleTimeString(),
          status,
        };
      });

      const newSystemMetrics: SystemMetric[] = [
        {
          name: "API Response Time",
          value: `${Math.floor(Math.random() * 50 + 20)}ms`,
          status: Math.random() > 0.1 ? 'healthy' : 'warning',
          last_update: new Date().toLocaleTimeString(),
        },
        {
          name: "Database Connections",
          value: `${Math.floor(Math.random() * 20 + 80)}/100`,
          status: 'healthy',
          last_update: new Date().toLocaleTimeString(),
        },
        {
          name: "Kafka Consumer Lag",
          value: `${Math.floor(Math.random() * 100)}ms`,
          status: Math.random() > 0.2 ? 'healthy' : 'warning',
          last_update: new Date().toLocaleTimeString(),
        },
        {
          name: "TimescaleDB Storage",
          value: `${Math.floor(Math.random() * 20 + 60)}% used`,
          status: 'healthy',
          last_update: new Date().toLocaleTimeString(),
        },
        {
          name: "Active WebSocket Connections",
          value: `${Math.floor(Math.random() * 50 + 100)}`,
          status: 'healthy',
          last_update: new Date().toLocaleTimeString(),
        },
      ];

      const newDataStreams: DataStream[] = [
        {
          name: "Traffic Sensor Data",
          messages_per_second: Math.floor(Math.random() * 20 + 30),
          total_messages: Math.floor(Math.random() * 10000 + 50000),
          last_message: new Date().toLocaleTimeString(),
          status: 'active',
        },
        {
          name: "Route Optimization Requests",
          messages_per_second: Math.floor(Math.random() * 5 + 10),
          total_messages: Math.floor(Math.random() * 1000 + 5000),
          last_message: new Date().toLocaleTimeString(),
          status: 'active',
        },
        {
          name: "Weather Data Updates",
          messages_per_second: Math.floor(Math.random() * 3 + 1),
          total_messages: Math.floor(Math.random() * 100 + 500),
          last_message: new Date().toLocaleTimeString(),
          status: 'active',
        },
        {
          name: "Traffic Predictions",
          messages_per_second: Math.floor(Math.random() * 8 + 5),
          total_messages: Math.floor(Math.random() * 2000 + 10000),
          last_message: new Date().toLocaleTimeString(),
          status: Math.random() > 0.1 ? 'active' : 'delayed',
        },
      ];

      setLiveData(newLiveData);
      setSystemMetrics(newSystemMetrics);
      setDataStreams(newDataStreams);
    };

    // Initial load
    updateLiveData();

    // Update every 3 seconds for real-time feel
    const interval = setInterval(updateLiveData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'normal':
      case 'active': return '#4CAF50';
      case 'warning':
      case 'slow':
      case 'delayed': return '#FF9800';
      case 'error':
      case 'congested':
      case 'inactive': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSpeedColor = (speed: number): string => {
    if (speed > 45) return '#4CAF50';
    if (speed > 25) return '#FF9800';
    return '#F44336';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mr: 2 }}>
          Real-Time Monitoring - Cape Town
        </Typography>
        <Badge
          badgeContent=""
          color={connectionStatus === 'connected' ? 'success' : 'error'}
          variant="dot"
          sx={{ mt: -1 }}
        >
          <Chip
            label={connectionStatus.toUpperCase()}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
            size="small"
          />
        </Badge>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Live monitoring of traffic sensors, data streams, and system performance across Cape Town's road network
      </Typography>

      <Grid container spacing={3}>
        {/* Live Traffic Data */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
                Live Traffic Sensors
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Real-time speed and congestion data from Cape Town road segments
              </Typography>

              <List dense>
                {liveData.map((data) => (
                  <ListItem key={data.road_segment_id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Circle sx={{ color: getStatusColor(data.status), fontSize: 12 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {data.road_name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={`${data.current_speed.toFixed(0)} km/h`}
                              size="small"
                              style={{ 
                                backgroundColor: getSpeedColor(data.current_speed), 
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                            <Chip
                              label={data.status.toUpperCase()}
                              size="small"
                              style={{ 
                                backgroundColor: getStatusColor(data.status), 
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={data.congestion_level * 100}
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              backgroundColor: '#eee',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getStatusColor(data.status)
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Congestion: {(data.congestion_level * 100).toFixed(0)}% • Updated: {data.last_update}
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

        {/* System Metrics */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Speed sx={{ verticalAlign: 'middle', mr: 1 }} />
                System Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Real-time monitoring of backend systems and infrastructure
              </Typography>

              <List dense>
                {systemMetrics.map((metric, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {metric.status === 'healthy' ? 
                        <CheckCircle color="success" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {metric.name}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {metric.value}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Status: {metric.status} • Updated: {metric.last_update}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Streams */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
                Data Stream Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Real-time monitoring of Kafka streams and data processing pipelines
              </Typography>

              <Grid container spacing={2}>
                {dataStreams.map((stream, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                          <CloudDownload sx={{ mr: 1 }} />
                          <Chip
                            label={stream.status.toUpperCase()}
                            size="small"
                            style={{ 
                              backgroundColor: getStatusColor(stream.status), 
                              color: 'white'
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {stream.name}
                        </Typography>
                        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                          {stream.messages_per_second}/s
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total: {stream.total_messages.toLocaleString()} messages
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last: {stream.last_message}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Connection Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="body2" color="text.secondary">
              <AccessTime sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
              Real-time updates every 3 seconds • WebSocket connection active • 
              Monitoring {liveData.length} traffic sensors across Cape Town
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeData; 