#!/bin/bash

echo "🔑 Emergency Admin Access Creator"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Make sure you're in the project directory with .env file"
    exit 1
fi

# Get master key from .env
MASTER_KEY=$(grep DEVELOPER_MASTER_KEY .env | cut -d '=' -f2)

if [ -z "$MASTER_KEY" ]; then
    echo "❌ DEVELOPER_MASTER_KEY not found in .env"
    echo "Run generate_secrets.sh first and add the key to .env"
    exit 1
fi

# Get API URL
API_URL=${1:-"http://localhost:8000"}

echo "🔍 Using API URL: $API_URL"
echo "🔑 Using Master Key: ${MASTER_KEY:0:8}..."

# Test developer access first
echo ""
echo "1️⃣ Testing developer access..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/dev/verify" \
  -H "Content-Type: application/json" \
  -d "{\"master_key\": \"$MASTER_KEY\"}")

if echo "$VERIFY_RESPONSE" | grep -q "verified"; then
    echo "✅ Developer access verified"
else
    echo "❌ Developer access failed: $VERIFY_RESPONSE"
    exit 1
fi

# Create admin access
echo ""
echo "2️⃣ Creating emergency admin access..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/api/dev/emergency-access" \
  -H "Content-Type: application/json" \
  -d "{\"master_key\": \"$MASTER_KEY\", \"action\": \"create_access\"}")

echo "Response: $ADMIN_RESPONSE"

if echo "$ADMIN_RESPONSE" | grep -q "Developer access created"; then
    echo ""
    echo "✅ SUCCESS! Emergency admin access created"
    echo ""
    echo "📧 Admin Email: your-email@example.com (update in code)"
    echo "🔑 Admin Role: Full system access"
    echo "💰 Admin Wallet: Personal wallet with 0 tokens"
    echo ""
    echo "🌐 You can now:"
    echo "   - Login to frontend with your email"
    echo "   - Access admin API endpoints"
    echo "   - View system statistics"
    echo "   - Monitor transactions and users"
    echo ""
    echo "⚠️  Remember to update DEVELOPER_EMAIL in:"
    echo "   backend/app/services/admin_safeguards.py"
    
elif echo "$ADMIN_RESPONSE" | grep -q "already exists"; then
    echo ""
    echo "ℹ️  Admin access already exists"
    echo "📧 Use your developer email to login"
    
else
    echo ""
    echo "❌ Failed to create admin access"
    echo "Response: $ADMIN_RESPONSE"
fi