# Receiptly Deployment Instructions (Docker)

## Prerequisites on the webserver
- Ubuntu/Debian server with sudo access
- Caddy web server installed
- Docker and Docker Compose installed
- Domain DNS pointing to your server

## Files to transfer to webserver
- `receiptly-deployment.tar.gz` - Contains the built React app and backend code
- `Caddyfile` - Caddy web server configuration
- `.env.production` - Production environment variables template

## Deployment Steps

### 1. Transfer files to webserver
```bash
# Copy files to your webserver (replace YOUR_SERVER with your server address)
scp receiptly-deployment.tar.gz Caddyfile receiptly-backend.service user@YOUR_SERVER:~/
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
sudo chown -R www-data:www-data /opt/receiptly

# Move frontend build to web directory
sudo mv receiptly-react-frontend/build/* /var/www/receiptly.leonberkemeier.de/
sudo chown -R www-data:www-data /var/www/receiptly.leonberkemeier.de
```

### 3. Setup Python backend environment
```bash
# Create virtual environment
sudo -u www-data python3 -m venv /opt/receiptly/venv

# Install dependencies
sudo -u www-data /opt/receiptly/venv/bin/pip install -r /opt/receiptly/receiptly-react-backend/requirements.txt
```

### 4. Configure environment variables
```bash
# Create .env file for backend (modify values as needed)
sudo -u www-data tee /opt/receiptly/receiptly-react-backend/.env << EOF
# Database Configuration
DATABASE_URL="postgresql://receiptly_user:your_password@localhost:5432/receiptly?schema=public"

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# CORS Configuration
CORS_ORIGINS="https://receiptly.leonberkemeier.de"

# Authentication
SECRET_KEY="your-super-secret-key-change-this-in-production-make-it-long-and-random"
EOF
```

### 5. Setup PostgreSQL database
```bash
# Create database and user (adjust credentials as needed)
sudo -u postgres psql << EOF
CREATE DATABASE receiptly;
CREATE USER receiptly_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE receiptly TO receiptly_user;
ALTER USER receiptly_user CREATEDB;
\q
EOF

# Run database migrations (if using Prisma)
cd /opt/receiptly/receiptly-react-backend
sudo -u www-data /opt/receiptly/venv/bin/python -c "
import asyncio
from prisma import Prisma

async def setup_db():
    db = Prisma()
    await db.connect()
    print('Database connected successfully')
    await db.disconnect()

asyncio.run(setup_db())
"
```

### 6. Setup systemd service
```bash
# Install the service file
sudo cp receiptly-backend.service /etc/systemd/system/

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable receiptly-backend
sudo systemctl start receiptly-backend

# Check service status
sudo systemctl status receiptly-backend
```

### 7. Configure Caddy
```bash
# Backup existing Caddyfile if it exists
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Add the receiptly configuration to Caddyfile
sudo tee -a /etc/caddy/Caddyfile < Caddyfile

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### 8. Verify deployment
```bash
# Check backend service
sudo systemctl status receiptly-backend
sudo journalctl -u receiptly-backend -f

# Check Caddy
sudo systemctl status caddy
sudo journalctl -u caddy -f

# Test the application
curl https://receiptly.leonberkemeier.de
curl https://receiptly.leonberkemeier.de/api/health
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
Set up log rotation and monitoring for your application:
```bash
# View backend logs
sudo journalctl -u receiptly-backend -f

# View Caddy logs
sudo journalctl -u caddy -f
sudo tail -f /var/log/caddy/receiptly.log
```

### Updates
To update the application:
1. Build new version locally with `npm run build`
2. Create new deployment package
3. Transfer to server
4. Update files in `/var/www/receiptly.leonberkemeier.de` and `/opt/receiptly`
5. Restart services: `sudo systemctl restart receiptly-backend`

## Troubleshooting

### Common issues:
1. **Database connection issues**: Check DATABASE_URL in .env file
2. **Permission errors**: Ensure www-data owns all application files
3. **Port conflicts**: Make sure port 8000 is available for the backend
4. **CORS errors**: Verify CORS_ORIGINS includes your domain
5. **SSL issues**: Check domain DNS points to your server

### Useful commands:
```bash
# Check backend logs
sudo journalctl -u receiptly-backend --since "1 hour ago"

# Restart services
sudo systemctl restart receiptly-backend
sudo systemctl reload caddy

# Test backend directly
curl http://localhost:8000/health
```