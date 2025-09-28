# Receiptly FastAPI Backend

A FastAPI backend for the Receiptly receipt management application with PostgreSQL and Prisma.

## Features

- FastAPI with automatic API documentation
- PostgreSQL database with Prisma ORM
- CRUD operations for receipts and items
- Docker containerization
- CORS support for frontend integration
- Pydantic data validation

## Prerequisites

- Python 3.9+
- PostgreSQL
- Docker (optional)

## Quick Start

### 1. Automated Setup (Recommended)

```bash
# Run the setup script (this will create venv, install deps, start DB)
./setup.sh

# Start the server
./start.sh
```

### 2. Manual Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL
docker-compose up -d postgres

# Generate Prisma client
prisma generate

# Run the server
python main.py
```

### 3. Environment Configuration

The `.env` file is already configured for local development. If you need to modify settings:

```env
DATABASE_URL="postgresql://receiptly:12345678@localhost:5432/receiptly"
DEBUG=True
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

The API will be available at:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Testing

After starting the server, you can test the API:

```bash
# Run the test script (make sure server is running first)
source venv/bin/activate
python test_api.py
```

Or test manually with curl:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test creating a receipt
curl -X POST "http://localhost:8000/api/receipts/" \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2024-01-15",
       "time": "14:30",
       "total": "25.99",
       "items": [
         {"name": "Coffee", "price": "4.99", "quantity": "1"}
       ]
     }'
```

## Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t receiptly-backend .

# Run the container
docker run -p 8000:8000 --env-file .env receiptly-backend
```

Or use docker-compose (after adding backend service to docker-compose.yml):

```bash
docker-compose up
```

## API Endpoints

### Receipts

- `GET /api/receipts/` - Get all receipts
- `GET /api/receipts/{id}` - Get a specific receipt
- `POST /api/receipts/` - Create a new receipt
- `PUT /api/receipts/{id}` - Update a receipt
- `DELETE /api/receipts/{id}` - Delete a receipt

### Items

- `GET /api/items/` - Get all items
- `GET /api/items/{id}` - Get a specific item
- `POST /api/items/` - Create a new item
- `PUT /api/items/{id}` - Update an item
- `DELETE /api/items/{id}` - Delete an item

### Health

- `GET /` - Root endpoint
- `GET /health` - Health check

## Development

### Database Schema Updates

After modifying the Prisma schema:

```bash
prisma db push
```

Or create and apply migrations:

```bash
prisma migrate dev
```

### Code Formatting

```bash
black .
isort .
```

## Project Structure

```
receiptly-react-backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── receipts.py    # Receipt endpoints
│   │       └── items.py       # Item endpoints
│   ├── core/
│   │   ├── config.py          # Application settings
│   │   └── database.py        # Database connection
│   └── schemas/
│       ├── receipts.py        # Receipt Pydantic models
│       └── items.py           # Item Pydantic models
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
└── .env                       # Environment variables
```