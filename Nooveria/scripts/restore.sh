#!/bin/bash
# Database restore script

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la ./backups/*.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace all current data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Stopping services..."
docker-compose down

echo "Starting database..."
docker-compose up -d postgres redis
sleep 10

echo "Restoring database..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres orthodoxgpt
else
    docker-compose exec -T postgres psql -U postgres orthodoxgpt < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    echo "Starting all services..."
    docker-compose up -d
else
    echo "❌ Restore failed"
    exit 1
fi