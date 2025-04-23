#!/bin/bash

# Create a timestamped backup folder name
BACKUP_FOLDER="./mongo-backups/backup_latest"

# Create the directory if it doesn't exist
mkdir -p "$BACKUP_FOLDER"

# Dump the data inside the mongo container
docker exec mongo mongodump --out /data/backup

# Copy the data from the container to your local folder
docker cp mongo:/data/backup "$BACKUP_FOLDER"

echo "✅ Backup completed and saved to: $BACKUP_FOLDER"
