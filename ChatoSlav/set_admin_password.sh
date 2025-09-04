#!/bin/bash

echo "🔑 Set Admin Password"
echo "===================="

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container..."
    cd /app
    python set_admin_password.py
else
    echo "Running on host system..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "❌ .env file not found!"
        echo "Make sure you're in the project directory"
        exit 1
    fi
    
    # Load environment variables
    export $(grep -v '^#' .env | xargs)
    
    # Run inside backend container
    echo "🐳 Running inside backend container..."
    docker-compose exec backend python /app/set_admin_password.py
fi