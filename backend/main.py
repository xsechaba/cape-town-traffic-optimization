"""
FastAPI Backend for Traffic Optimization Engine
Provides route optimization, traffic predictions, and real-time data APIs
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncpg
import redis.asyncio as redis
import numpy as np
from pydantic import BaseModel
from kafka import KafkaConsumer
import networkx as nx

from config.settings import settings
try:
    from route_optimization.graph_algorithms import TrafficGraph
    from route_optimization.prediction_engine import TrafficPredictor
    from api.websocket_manager import WebSocketManager
except ImportError:
    # Fallback classes for demo
    class TrafficGraph:
        def __init__(self):
            pass
        async def load_road_network(self, db_pool):
            pass
    
    class TrafficPredictor:
        def __init__(self):
            pass
    
    class WebSocketManager:
        def __init__(self):
            self.connections = []
        async def connect(self, websocket):
            self.connections.append(websocket)
        def disconnect(self, websocket):
            if websocket in self.connections:
                self.connections.remove(websocket)
        async def subscribe_to_route(self, websocket, route_id):
            pass

# Import South African data generator
from api.south_african_data import (
    generate_realistic_traffic_data,
    generate_route_with_traffic,
    get_popular_destinations,
    generate_weather_data,
    generate_traffic_incidents,
    CAPE_TOWN_ROUTES
)

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Traffic Optimization Engine API",
    description="Real-time traffic optimization with route planning and predictions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
db_pool = None
redis_client = None
websocket_manager = WebSocketManager()
traffic_graph = TrafficGraph()
traffic_predictor = TrafficPredictor()


# Pydantic models
class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    preferences: Optional[Dict] = {"optimize_for": "time", "avoid_tolls": False}


class RouteResponse(BaseModel):
    route_id: str
    total_distance: float  # meters
    estimated_time: float  # seconds
    geometry: Dict  # GeoJSON LineString
    traffic_conditions: Dict
    alternative_routes: List[Dict]


class TrafficCondition(BaseModel):
    road_segment_id: str
    current_speed: float
    congestion_level: float
    prediction: Optional[Dict] = None


class PredictionRequest(BaseModel):
    road_segment_ids: List[str]
    prediction_horizon: int = 240  # minutes


# Database connection
async def get_database():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(settings.DATABASE_URL)
    return db_pool


# Redis connection
async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL)
    return redis_client


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize connections and background tasks"""
    logger.info("Starting Traffic Optimization Engine API")
    
    # Initialize database connection
    await get_database()
    
    # Initialize Redis connection
    await get_redis()
    
    # Load initial road network
    await traffic_graph.load_road_network(db_pool)
    
    # Start background tasks
    asyncio.create_task(consume_kafka_data())
    asyncio.create_task(update_traffic_predictions())
    
    logger.info("API startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections"""
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()
    logger.info("API shutdown complete")


# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe_route":
                # Subscribe to route updates
                route_id = message.get("route_id")
                await websocket_manager.subscribe_to_route(websocket, route_id)
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected" if db_pool else "disconnected",
            "redis": "connected" if redis_client else "disconnected"
        }
    }


# Traffic data endpoints
@app.get("/api/traffic/current")
async def get_current_traffic(
    bbox: Optional[str] = None,
    road_segments: Optional[str] = None
):
    """Get current traffic conditions for Cape Town"""
    try:
        # Use South African realistic data for demo
        traffic_data = generate_realistic_traffic_data(hours_back=1)
        
        # Filter by specific segments if requested
        if road_segments:
            segment_ids = road_segments.split(",")
            traffic_data = [td for td in traffic_data if td["road_segment_id"] in segment_ids]
        
        # Get latest data point for each segment
        latest_data = {}
        for item in traffic_data:
            segment_id = item["road_segment_id"]
            if segment_id not in latest_data or item["timestamp"] > latest_data[segment_id]["timestamp"]:
                latest_data[segment_id] = item
        
        return {
            "status": "success",
            "city": "Cape Town",
            "timestamp": datetime.now().isoformat(),
            "traffic_data": list(latest_data.values()),
            "total_segments": len(latest_data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching traffic data: {e}")
        # Return sample data for demo
        return {
            "status": "success", 
            "city": "Cape Town",
            "timestamp": datetime.now().isoformat(),
            "traffic_data": generate_realistic_traffic_data(hours_back=1)[:15],  # Limit for demo
            "total_segments": 15
        }


# Additional traffic endpoints for demo
@app.get("/api/traffic/incidents")
async def get_traffic_incidents():
    """Get current traffic incidents in Cape Town"""
    try:
        incidents = generate_traffic_incidents()
        return {
            "status": "success",
            "city": "Cape Town",
            "incidents": incidents,
            "total_incidents": len(incidents),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching incidents: {e}")
        return {"status": "error", "incidents": [], "total_incidents": 0}

@app.get("/api/weather/current")
async def get_current_weather():
    """Get current weather data for Cape Town"""
    try:
        weather = generate_weather_data()
        return {
            "status": "success",
            "weather": weather,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        return {"status": "error", "weather": None}

@app.get("/api/destinations/popular")
async def get_popular_destinations():
    """Get popular destinations in Cape Town"""
    try:
        destinations = get_popular_destinations()
        return {
            "status": "success",
            "destinations": destinations,
            "total": len(destinations),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching destinations: {e}")
        return {"status": "error", "destinations": []}

@app.get("/api/routes/popular")
async def get_popular_routes():
    """Get popular predefined routes in Cape Town"""
    try:
        routes = []
        for route_template in CAPE_TOWN_ROUTES:
            route_data = generate_route_with_traffic(route_template["name"])
            routes.append(route_data)
        
        return {
            "status": "success",
            "routes": routes,
            "total": len(routes),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching popular routes: {e}")
        return {"status": "error", "routes": []}

# Route optimization endpoints  
@app.post("/api/routes/optimize", response_model=RouteResponse)
async def optimize_route(request: RouteRequest):
    """Calculate optimized route between origin and destination"""
    try:
        logger.info(f"Route request: {request.origin_lat},{request.origin_lng} -> {request.destination_lat},{request.destination_lng}")
        
        # For demo: Find closest predefined route or generate a custom one
        route_data = None
        
        # Check if this matches any of our predefined popular routes
        for route_template in CAPE_TOWN_ROUTES:
            start = route_template["start"]
            end = route_template["end"]
            
            # Simple distance check (within ~1km)
            if (abs(request.origin_lat - start["lat"]) < 0.01 and 
                abs(request.origin_lng - start["lng"]) < 0.01 and
                abs(request.destination_lat - end["lat"]) < 0.01 and 
                abs(request.destination_lng - end["lng"]) < 0.01):
                route_data = generate_route_with_traffic(route_template["name"])
                break
        
        # If no predefined route matches, create a custom route
        if not route_data:
            # Create a simple direct route for demo
            distance_km = ((request.destination_lat - request.origin_lat) ** 2 + 
                          (request.destination_lng - request.origin_lng) ** 2) ** 0.5 * 111  # Rough km conversion
            
            # Estimate time based on current traffic conditions
            current_hour = datetime.now().hour
            if (7 <= current_hour <= 9) or (17 <= current_hour <= 19):
                speed_kmh = 25  # Rush hour
            elif (10 <= current_hour <= 16):
                speed_kmh = 40  # Day time
            else:
                speed_kmh = 50  # Off peak
            
            estimated_time_minutes = (distance_km / speed_kmh) * 60
            
            route_data = {
                "route_id": f"custom_route_{int(datetime.now().timestamp())}",
                "total_distance": distance_km * 1000,  # Convert to meters
                "estimated_time": estimated_time_minutes * 60,  # Convert to seconds
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [request.origin_lng, request.origin_lat],
                        [request.destination_lng, request.destination_lat]
                    ]
                },
                "traffic_conditions": {"status": "moderate", "incidents": 0},
                "alternative_routes": []
            }
        
        return RouteResponse(
            route_id=route_data["route_id"],
            total_distance=route_data["total_distance"],
            estimated_time=route_data["estimated_time"],
            geometry=route_data["geometry"],
            traffic_conditions=route_data.get("traffic_conditions", {"status": "unknown"}),
            alternative_routes=route_data.get("alternative_routes", [])
        )
        
    except Exception as e:
        logger.error(f"Error optimizing route: {e}")
        # Return a fallback route for demo
        return RouteResponse(
            route_id=f"fallback_route_{int(datetime.now().timestamp())}",
            total_distance=10000,  # 10km
            estimated_time=1200,   # 20 minutes
            geometry={
                "type": "LineString",
                "coordinates": [
                    [request.origin_lng, request.origin_lat],
                    [request.destination_lng, request.destination_lat]
                ]
            },
            traffic_conditions={"status": "unknown"},
            alternative_routes=[]
        )


@app.get("/api/routes/{route_id}/updates")
async def get_route_updates(route_id: str):
    """Get real-time updates for a specific route"""
    try:
        # Get cached route
        redis_conn = await get_redis()
        route_data = await redis_conn.get(f"route_updates:{route_id}")
        
        if not route_data:
            raise HTTPException(status_code=404, detail="Route not found")
        
        return json.loads(route_data)
        
    except Exception as e:
        logger.error(f"Error getting route updates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get route updates")


# Prediction endpoints
@app.post("/api/predictions/traffic")
async def predict_traffic(request: PredictionRequest):
    """Predict traffic conditions for specified road segments"""
    try:
        predictions = await traffic_predictor.predict_traffic_conditions(
            road_segment_ids=request.road_segment_ids,
            prediction_horizon=request.prediction_horizon
        )
        
        return {
            "predictions": predictions,
            "prediction_timestamp": datetime.utcnow().isoformat(),
            "horizon_minutes": request.prediction_horizon
        }
        
    except Exception as e:
        logger.error(f"Error predicting traffic: {e}")
        raise HTTPException(status_code=500, detail="Failed to predict traffic")


@app.get("/api/predictions/congestion")
async def predict_congestion(hours_ahead: int = 2):
    """Predict city-wide congestion patterns"""
    try:
        db = await get_database()
        
        # Get all active road segments
        query = """
            SELECT DISTINCT road_segment_id 
            FROM traffic_flow 
            WHERE timestamp >= NOW() - INTERVAL '1 hour'
        """
        rows = await db.fetch(query)
        segment_ids = [row["road_segment_id"] for row in rows]
        
        # Generate predictions for all segments
        predictions = await traffic_predictor.predict_traffic_conditions(
            road_segment_ids=segment_ids,
            prediction_horizon=hours_ahead * 60
        )
        
        return {
            "congestion_predictions": predictions,
            "prediction_timestamp": datetime.utcnow().isoformat(),
            "hours_ahead": hours_ahead
        }
        
    except Exception as e:
        logger.error(f"Error predicting congestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to predict congestion")


# Analytics endpoints
@app.get("/api/analytics/traffic_patterns")
async def get_traffic_patterns(days: int = 7):
    """Get historical traffic patterns and analytics"""
    try:
        db = await get_database()
        
        query = """
            SELECT 
                road_segment_id,
                EXTRACT(hour FROM timestamp) as hour,
                EXTRACT(dow FROM timestamp) as day_of_week,
                AVG(flow_speed) as avg_speed,
                AVG(congestion_level) as avg_congestion
            FROM traffic_flow 
            WHERE timestamp >= NOW() - INTERVAL '%s days'
            GROUP BY road_segment_id, EXTRACT(hour FROM timestamp), EXTRACT(dow FROM timestamp)
            ORDER BY road_segment_id, day_of_week, hour
        """ % days
        
        rows = await db.fetch(query)
        
        patterns = {}
        for row in rows:
            segment_id = row["road_segment_id"]
            if segment_id not in patterns:
                patterns[segment_id] = []
            
            patterns[segment_id].append({
                "hour": int(row["hour"]),
                "day_of_week": int(row["day_of_week"]),
                "avg_speed": float(row["avg_speed"]) if row["avg_speed"] else 0,
                "avg_congestion": float(row["avg_congestion"]) if row["avg_congestion"] else 0
            })
        
        return {"traffic_patterns": patterns, "analysis_period_days": days}
        
    except Exception as e:
        logger.error(f"Error getting traffic patterns: {e}")
        raise HTTPException(status_code=500, detail="Failed to get traffic patterns")


# Utility functions
async def get_route_traffic_conditions(segment_ids: List[str]) -> Dict:
    """Get current traffic conditions for route segments"""
    try:
        db = await get_database()
        
        query = """
            SELECT road_segment_id, AVG(flow_speed) as avg_speed,
                   AVG(congestion_level) as avg_congestion
            FROM traffic_flow 
            WHERE road_segment_id = ANY($1)
                AND timestamp >= NOW() - INTERVAL '10 minutes'
            GROUP BY road_segment_id
        """
        
        rows = await db.fetch(query, segment_ids)
        
        conditions = {}
        for row in rows:
            conditions[row["road_segment_id"]] = {
                "avg_speed": float(row["avg_speed"]) if row["avg_speed"] else 0,
                "congestion_level": float(row["avg_congestion"]) if row["avg_congestion"] else 0
            }
        
        return conditions
        
    except Exception as e:
        logger.error(f"Error getting route traffic conditions: {e}")
        return {}


# Background tasks
async def consume_kafka_data():
    """Background task to consume Kafka data and update real-time information"""
    logger.info("Starting Kafka consumer for real-time updates")
    
    try:
        consumer = KafkaConsumer(
            settings.KAFKA_TOPICS['traffic_data'],
            settings.KAFKA_TOPICS['weather_data'],
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS.split(','),
            auto_offset_reset='latest',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        for message in consumer:
            try:
                data = message.value
                
                if message.topic == settings.KAFKA_TOPICS['traffic_data']:
                    # Update traffic graph with new data
                    await traffic_graph.update_traffic_data(data)
                    
                    # Broadcast to WebSocket clients
                    await websocket_manager.broadcast_traffic_update(data)
                
                elif message.topic == settings.KAFKA_TOPICS['weather_data']:
                    # Update weather data for predictions
                    await traffic_predictor.update_weather_data(data)
                
            except Exception as e:
                logger.error(f"Error processing Kafka message: {e}")
                
    except Exception as e:
        logger.error(f"Error in Kafka consumer: {e}")


async def update_traffic_predictions():
    """Background task to update traffic predictions periodically"""
    logger.info("Starting traffic predictions updater")
    
    while True:
        try:
            await asyncio.sleep(settings.MODEL_UPDATE_INTERVAL)
            
            # Update ML models with latest data
            await traffic_predictor.retrain_models()
            
            logger.info("Traffic prediction models updated")
            
        except Exception as e:
            logger.error(f"Error updating predictions: {e}")
            await asyncio.sleep(60)


# Serve static files for demo
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve demo homepage"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Traffic Optimization Engine</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 20px; border-radius: 10px; }
            .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .api-link { color: #667eea; text-decoration: none; font-weight: bold; }
            .api-link:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚗 Traffic Optimization Engine</h1>
            <p>Real-time traffic optimization with route planning and predictions</p>
        </div>
        
        <div class="section">
            <h2>🛠️ API Documentation</h2>
            <p><a href="/docs" class="api-link">Interactive API Docs (Swagger)</a></p>
            <p><a href="/redoc" class="api-link">ReDoc Documentation</a></p>
        </div>
        
        <div class="section">
            <h2>🗺️ Key Features</h2>
            <ul>
                <li><strong>Route Optimization:</strong> POST /api/routes/optimize</li>
                <li><strong>Real-time Traffic:</strong> GET /api/traffic/current</li>
                <li><strong>Traffic Predictions:</strong> POST /api/predictions/traffic</li>
                <li><strong>Analytics:</strong> GET /api/analytics/traffic_patterns</li>
                <li><strong>WebSocket Updates:</strong> ws://localhost:8000/ws</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>📊 Monitoring</h2>
            <p><a href="http://localhost:8080" class="api-link">Kafka UI</a> - Stream monitoring</p>
            <p><a href="http://localhost:3001" class="api-link">Grafana</a> - Metrics dashboard</p>
            <p><a href="http://localhost:9090" class="api-link">Prometheus</a> - Metrics collection</p>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 