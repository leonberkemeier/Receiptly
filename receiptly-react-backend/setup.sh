#!/bin/bash

# Receiptly FastAPI Backend Setup Script

echo "🛠️ Setting up Receiptly FastAPI Backend..."

# Change to the script directory
cd "$(dirname "$0")"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Generate Prisma client
echo "🔧 Generating Prisma client..."
prisma generate

# Start PostgreSQL database
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the backend server, run:"
echo "   ./start.sh"
echo ""
echo "🧪 To test the API, run (after starting the server):"
echo "   source venv/bin/activate && python test_api.py"
echo ""
echo "📖 API Documentation will be available at:"
echo "   http://localhost:8000/docs"