#!/bin/bash
# Database backup script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/orthodoxgpt_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Creating database backup..."
docker-compose exec -T postgres pg_dump -U postgres orthodoxgpt > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 backups
    ls -t $BACKUP_DIR/*.gz | tail -n +8 | xargs -r rm
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi