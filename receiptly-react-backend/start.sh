#!/bin/bash

# Receiptly FastAPI Backend Startup Script

echo "🚀 Starting Receiptly FastAPI Backend..."

# Change to the script directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Check if PostgreSQL is running
echo "🐘 Checking PostgreSQL database..."
docker-compose up -d postgres
sleep 2

# Start the FastAPI server with proper environment
echo "🌟 Starting FastAPI server..."
echo "📖 API Documentation will be available at: http://localhost:8000/docs"
echo "🏠 Main API will be available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Use the environment wrapper to avoid conflicts with global .env files
./run-with-local-env.sh python main.py
