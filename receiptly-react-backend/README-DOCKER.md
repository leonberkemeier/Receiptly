# Receiptly Backend - Docker Deployment

This guide explains how to deploy the Receiptly backend using Docker and Docker Compose.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

## Quick Start

1. **Clone and navigate to the backend directory:**
   ```bash
   cd /path/to/receiptly-react-backend
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.docker .env
   # Edit .env and update the values (especially passwords and secret keys)
   ```

3. **Start the services:**
   ```bash
   # Start database and backend
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   # Wait for services to be healthy, then push the database schema
   docker-compose exec backend prisma db push
   ```

5. **Configure Caddy (if not already done):**
   ```bash
   # Copy the example Caddyfile
   cp Caddyfile.example /etc/caddy/Caddyfile
   # Edit for your domain and requirements
   sudo systemctl reload caddy
   ```

## Environment Configuration

### Required Environment Variables

Copy `.env.docker` to `.env` and configure:

```bash
# Database
POSTGRES_PASSWORD=your-secure-database-password

# Authentication
SECRET_KEY=your-cryptographically-secure-secret-key

# CORS (add your frontend domains)
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Generate Secure Secret Key

```bash
openssl rand -hex 32
```

## Service Architecture

The Docker Compose setup includes:

- **PostgreSQL Database** (`postgres:17`)
  - Port: 5432
  - Health checks enabled
  - Persistent data storage

- **FastAPI Backend** (`backend`)
  - Port: 8000
  - Health checks enabled
  - Automatic restart on failure
  - Waits for database to be ready

- **External Caddy Reverse Proxy** *[External Service]*
  - Proxies to backend on port 8000
  - Automatic HTTPS with Let's Encrypt
  - Rate limiting and security headers
  - CORS handling

## Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# View service status
docker-compose ps
```

### Database Operations

```bash
# Push Prisma schema to database
docker-compose exec backend prisma db push

# Generate Prisma client (if needed)
docker-compose exec backend prisma generate

# Access PostgreSQL directly
docker-compose exec postgres psql -U receiptly -d receiptly

# Backup database
docker-compose exec postgres pg_dump -U receiptly receiptly > backup.sql

# Restore database
docker-compose exec -T postgres psql -U receiptly -d receiptly < backup.sql
```

### Development Mode

For development with hot reload:

1. Uncomment the volume mounts in `docker-compose.yml`:
   ```yaml
   volumes:
     - .:/app
     - /app/venv
   ```

2. Set `DEBUG=true` in `.env`

3. Restart the backend service:
   ```bash
   docker-compose restart backend
   ```

## Health Checks

The services include health checks:

- **Backend**: `GET /health`
- **Database**: `pg_isready`

Check health status:
```bash
docker-compose ps
```

## Networking

Services communicate via a custom bridge network (`receiptly_network`):

- `backend` → `postgres:5432`
- External `caddy` → `backend:8000` (via host network)

## Security Considerations

### Production Deployment

1. **Change default passwords:**
   - Set strong `POSTGRES_PASSWORD`
   - Generate secure `SECRET_KEY`

2. **Configure CORS properly:**
   - Set specific domains in `CORS_ORIGINS`
   - Avoid wildcards (`*`) in production

3. **Use HTTPS:**
   - Configure SSL certificates in nginx
   - Redirect HTTP to HTTPS

4. **Network security:**
   - Use Docker secrets for sensitive data
   - Consider using a reverse proxy
   - Implement firewall rules

5. **Container security:**
   - Keep base images updated
   - Use non-root user (already configured)
   - Scan for vulnerabilities

### Rate Limiting

Configure rate limiting in your Caddyfile:
- Example: 100 requests per minute per IP
- See `Caddyfile.example` for configuration

## Monitoring

### Application Logs

```bash
# Backend application logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Caddy logs (external service)
sudo journalctl -fu caddy
```

### Health Monitoring

```bash
# Check if services are healthy (direct)
curl http://localhost:8000/health

# Through Caddy proxy (depends on your Caddyfile configuration)
curl http://your-domain.com/health
```

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   ```bash
   # Check if database is ready
   docker-compose logs postgres
   
   # Verify connection
   docker-compose exec backend python -c "import asyncio; from app.core.database import db; asyncio.run(db.connect())"
   ```

2. **Backend won't start:**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Rebuild the image
   docker-compose build backend --no-cache
   ```

3. **Permission denied errors:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Port already in use:**
   ```bash
   # Change ports in .env file
   BACKEND_PORT=8001
   POSTGRES_PORT=5433
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up Docker system
docker system prune -a
```

## API Documentation

Once running, access the API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Frontend Integration

Update your frontend `.env` to point to the containerized backend:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000
# or with nginx
REACT_APP_API_BASE_URL=http://localhost
```