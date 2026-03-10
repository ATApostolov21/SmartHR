#!/bin/bash

# HR Analytics Local Startup Script

echo "🚀 Starting HR Analytics Dashboard (Enterprise Local)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "🔄 Building/Starting containers..."
docker-compose up -d --build

echo "✅ Started successfully!"
echo "👉 Open your browser at: http://localhost:8501"
echo "To stop, run: docker-compose down"
