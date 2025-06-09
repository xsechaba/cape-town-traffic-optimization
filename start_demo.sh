#!/bin/bash

# 🚗 Cape Town Traffic Optimization Engine - Demo Startup Script

echo "🇿🇦 Starting Cape Town Traffic Optimization Engine Demo..."
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down > /dev/null 2>&1

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."

# Function to check if a service is ready
check_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts: Waiting for $service_name..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start"
    return 1
}

# Check frontend
check_service "http://localhost:3000" "Frontend (React)"

# Check backend
check_service "http://localhost:8000/health" "Backend (FastAPI)"

echo ""
echo "🎉 Cape Town Traffic Optimization Engine is ready!"
echo "=================================================="
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 API Docs: http://localhost:8000/docs"
echo "❤️  Health:  http://localhost:8000/health"
echo ""
echo "🎬 Demo Script: See DEMO_SCRIPT.md for presentation guide"
echo ""
echo "To stop the demo:"
echo "   docker-compose down"
echo ""
echo "Happy demoing! 🚗💨" 