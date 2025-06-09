import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Drawer, AppBar, Toolbar, Typography, 
         List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Menu as MenuIcon, Map as MapIcon, Analytics as AnalyticsIcon, 
         Timeline as TimelineIcon, Settings as SettingsIcon,
         Traffic as TrafficIcon } from '@mui/icons-material';

import TrafficMap from './components/TrafficMap.tsx';
import RoutePlanner from './components/RoutePlanner.tsx';
import TrafficAnalytics from './components/TrafficAnalytics.tsx';
import PredictionDashboard from './components/PredictionDashboard.tsx';
import RealTimeData from './components/RealTimeData.tsx';
import { WebSocketProvider } from './contexts/WebSocketContext.tsx';
import { TrafficDataProvider } from './contexts/TrafficDataContext.tsx';
import './App.css';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      },
    },
  },
});

const drawerWidth = 280;

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/',
    label: 'Traffic Map',
    icon: <MapIcon />,
    component: TrafficMap,
  },
  {
    path: '/route-planner',
    label: 'Route Planner',
    icon: <TrafficIcon />,
    component: RoutePlanner,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: <AnalyticsIcon />,
    component: TrafficAnalytics,
  },
  {
    path: '/predictions',
    label: 'Predictions',
    icon: <TimelineIcon />,
    component: PredictionDashboard,
  },
  {
    path: '/real-time',
    label: 'Real-time Data',
    icon: <SettingsIcon />,
    component: RealTimeData,
  },
];

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    // Simulate initial connection
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          🚗 Traffic Engine
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component="a"
            href={item.path}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      {/* Connection Status */}
      <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          padding: 1, 
          borderRadius: 1 
        }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? '#4caf50' : 
                             connectionStatus === 'connecting' ? '#ff9800' : '#f44336',
              marginRight: 1,
            }}
          />
          <Typography variant="caption">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebSocketProvider>
        <TrafficDataProvider>
          <Router>
            <Box sx={{ display: 'flex' }}>
              <AppBar
                position="fixed"
                sx={{
                  width: { sm: `calc(100% - ${drawerWidth}px)` },
                  ml: { sm: `${drawerWidth}px` },
                }}
              >
                <Toolbar>
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Dynamic City Traffic Optimization Engine
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Live Traffic Data & Route Optimization
                  </Typography>
                </Toolbar>
              </AppBar>

              <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="navigation"
              >
                <Drawer
                  variant="temporary"
                  open={mobileOpen}
                  onClose={handleDrawerToggle}
                  ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                  }}
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                  }}
                >
                  {drawer}
                </Drawer>
                <Drawer
                  variant="permanent"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                  }}
                  open
                >
                  {drawer}
                </Drawer>
              </Box>

              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  width: { sm: `calc(100% - ${drawerWidth}px)` },
                  mt: 8,
                  minHeight: 'calc(100vh - 64px)',
                }}
              >
                <Routes>
                  {navigationItems.map((item) => (
                    <Route 
                      key={item.path} 
                      path={item.path} 
                      element={<item.component />} 
                    />
                  ))}
                </Routes>
              </Box>
            </Box>
          </Router>
        </TrafficDataProvider>
      </WebSocketProvider>
    </ThemeProvider>
  );
};

export default App; 