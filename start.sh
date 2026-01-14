#!/bin/bash

echo "🚀 Starting Driver App..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker first."
    echo ""
    echo "Alternative: Run services manually"
    echo "1. Start MongoDB: mongod"
    echo "2. Backend: cd backend && python run.py"
    echo "3. Frontend: cd frontend && npm run dev"
    exit 1
fi

# Start Docker Compose
echo "📦 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""


