# Receiptly Docker Deployment Instructions

## Prerequisites on the webserver
- Ubuntu/Debian server with sudo access
- Caddy web server installed and running
- Docker and Docker Compose installed
- Domain DNS pointing to your server (receiptly.leonberkemeier.de)

## Files to transfer to webserver
- `receiptly-deployment.tar.gz` - Contains the built React app and backend code
- `Caddyfile` - Caddy web server configuration
- `.env.production` - Production environment variables template

## Deployment Steps

### 1. Transfer files to webserver
```bash
# Copy files to your webserver (replace YOUR_SERVER with your server address)
scp receiptly-deployment.tar.gz Caddyfile receiptly-react-backend/.env.production user@YOUR_SERVER:~/
```

### 2. Extract and setup application files
```bash
# On the webserver
sudo mkdir -p /opt/receiptly
sudo mkdir -p /var/www/receiptly.leonberkemeier.de
sudo mkdir -p /var/log/caddy

# Extract the deployment package
tar -xzf receiptly-deployment.tar.gz

# Move backend to /opt/receiptly
sudo mv receiptly-react-backend /opt/receiptly/
sudo chown -R $USER:docker /opt/receiptly

# Move frontend build to web directory
sudo mv receiptly-react-frontend/build/* /var/www/receiptly.leonberkemeier.de/
sudo chown -R www-data:www-data /var/www/receiptly.leonberkemeier.de
```

### 3. Configure environment variables
```bash
# Copy and edit the production environment file
cp .env.production /opt/receiptly/receiptly-react-backend/.env
cd /opt/receiptly/receiptly-react-backend

# Edit the .env file with your actual values
nano .env

# IMPORTANT: Change these values in the .env file:
# - POSTGRES_PASSWORD: Set a strong database password
# - SECRET_KEY: Set a long, random secret key for JWT authentication
# - Verify CORS_ORIGINS includes your domain
```

### 4. Build and start Docker containers
```bash
cd /opt/receiptly/receiptly-react-backend

# Build and start the containers in detached mode
docker compose up -d --build

# Check that containers are running
docker compose ps

# View logs to ensure everything started correctly
docker compose logs -f
```

### 5. Initialize the database (if needed)
```bash
# If you need to run database migrations or initialization
docker compose exec backend python -c "
import asyncio
from prisma import Prisma

async def setup_db():
    db = Prisma()
    await db.connect()
    print('Database connected successfully')
    await db.disconnect()

asyncio.run(setup_db())
"

# Or run any other database setup commands
# docker compose exec backend prisma db push
```

### 6. Configure Caddy
```bash
# Backup existing Caddyfile if it exists
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Add the receiptly configuration to Caddyfile
sudo tee -a /etc/caddy/Caddyfile < ~/Caddyfile

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### 7. Verify deployment
```bash
# Check Docker containers
docker compose ps
docker compose logs backend
docker compose logs postgres

# Check Caddy
sudo systemctl status caddy

# Test the application
curl https://receiptly.leonberkemeier.de
curl https://receiptly.leonberkemeier.de/api/health

# Test backend directly (should work from server)
curl http://localhost:8000/health
```

## Docker Management Commands

### View logs
```bash
cd /opt/receiptly/receiptly-react-backend

# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs postgres
```

### Restart services
```bash
cd /opt/receiptly/receiptly-react-backend

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart postgres

# Stop all services
docker compose down

# Start services
docker compose up -d
```

### Update the application
```bash
cd /opt/receiptly/receiptly-react-backend

# Pull latest changes and rebuild
docker compose down
docker compose up -d --build

# Or rebuild specific service
docker compose build backend
docker compose up -d backend
```

## Post-deployment tasks

### SSL Certificate
Caddy will automatically obtain and manage SSL certificates from Let's Encrypt for your domain.

### Firewall
Make sure your firewall allows HTTP (80) and HTTPS (443) traffic:
```bash
sudo ufw allow 80
sudo ufw allow 443
```

### Monitoring
```bash
# Monitor Docker containers
docker stats

# View container health
docker compose ps

# Check Docker logs
docker compose logs -f --tail=100
```

### Backup
Set up regular backups of your PostgreSQL database:
```bash
# Create a backup script
cat > /opt/receiptly/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/receiptly/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
docker compose exec -T postgres pg_dump -U receiptly receiptly > "$BACKUP_DIR/receiptly_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "receiptly_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/receiptly/backup.sh

# Add to crontab for daily backups at 2 AM
echo "0 2 * * * /opt/receiptly/backup.sh" | crontab -
```

## Troubleshooting

### Common issues:
1. **Container won't start**: Check logs with `docker compose logs service_name`
2. **Database connection issues**: Ensure containers are on the same network
3. **Permission errors**: Check file ownership and Docker group membership
4. **Port conflicts**: Make sure ports 8000 and 5432 are available
5. **CORS errors**: Verify CORS_ORIGINS in .env file includes your domain

### Useful commands:
```bash
# Check container status and resource usage
docker compose ps
docker stats

# Execute commands in running containers
docker compose exec backend bash
docker compose exec postgres psql -U receiptly -d receiptly

# View detailed container information
docker compose logs backend --tail=50
docker inspect receiptly_backend

# Clean up (remove stopped containers, unused images)
docker system prune
```

### Environment Variables Reference
```bash
# In /opt/receiptly/receiptly-react-backend/.env
POSTGRES_PASSWORD=your-secure-password
POSTGRES_PORT=5432
BACKEND_PORT=8000
DEBUG=false
CORS_ORIGINS=https://receiptly.leonberkemeier.de
SECRET_KEY=your-long-random-secret-key
```

## Security Notes
- Always change default passwords and secret keys
- Keep Docker and system packages updated
- Monitor logs for unusual activity
- Consider setting up fail2ban for additional protection
- Use strong passwords for database and authentication