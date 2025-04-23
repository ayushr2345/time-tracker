#!/bin/bash

# Path to the backup you want to restore
# Change this to your specific folder if needed
RESTORE_FOLDER="./mongo-backups/backup_latest"

# Copy backup files to the mongo container
docker cp "$RESTORE_FOLDER"/backup mongo:/data/backup

# Run the restore inside the container
docker exec mongo mongorestore /data/backup

echo "✅ Restore completed from: $RESTORE_FOLDER"
