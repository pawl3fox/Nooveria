#!/bin/bash
set -e

echo "🚀 OrthodoxGPT Server Deployment Script"
echo "======================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Don't run as root. Use a regular user with sudo access."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. Please logout and login again, then re-run this script."
    exit 0
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx and Certbot
echo "🌐 Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with your production settings"
    exit 1
fi

# Check required environment variables
echo "🔍 Checking environment variables..."
required_vars=("OPENAI_API_KEY" "JWT_SECRET" "DEVICE_FINGERPRINT_SECRET" "POSTGRES_PASSWORD")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
done

# Get domain from user
read -p "Enter your domain name (e.g., example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Domain name is required"
    exit 1
fi

# Update nginx config with domain
echo "🔧 Updating nginx configuration..."
sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf

# Update environment variables
echo "📝 Updating environment variables..."
echo "VITE_API_URL=https://$DOMAIN" >> .env
echo "CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> .env

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl
sudo mkdir -p ./ssl

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.server.yml build
docker-compose -f docker-compose.server.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 30

# Initialize database
echo "🗄️ Initializing database..."
docker-compose -f docker-compose.server.yml exec -T backend python init_db.py

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Copy SSL certificates to project
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem

# Restart nginx with SSL
echo "🔄 Restarting services with SSL..."
docker-compose -f docker-compose.server.yml restart nginx

# Test deployment
echo "🧪 Testing deployment..."
sleep 10
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your OrthodoxGPT is now live at:"
    echo "   https://$DOMAIN"
    echo ""
    echo "📊 Admin access:"
    echo "   Run: curl -X POST https://$DOMAIN/api/dev/emergency-access \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -d '{\"master_key\": \"YOUR_MASTER_KEY\", \"action\": \"create_access\"}'"
    echo ""
    echo "📈 Monitor with:"
    echo "   docker-compose -f docker-compose.server.yml logs -f"
else
    echo "❌ Deployment test failed. Check logs:"
    echo "   docker-compose -f docker-compose.server.yml logs"
fi