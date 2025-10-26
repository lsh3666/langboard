#!/bin/bash

source /scripts/.env

BACKUP_DIR="/backup"
TAR_NAME=${PG_DB}"*.tar.gz"
DELDAY=7

record_log() {
    NOW=$(date "+%F %T")
    echo "[$NOW] $1"
}

mkdir -p $BACKUP_DIR

FILENAME=${PG_DB}"_$(date +%Y%m%d_%H%M)"
FILE_PATH_PREFIX="$BACKUP_DIR/$FILENAME"

record_log "Starting backup for \"$PG_DB\" database..."
OUTPUT=$(PGPASSWORD=${PG_PASS} pg_dump --no-sync -h ${PG_MASTER_HOST} -U ${PG_USER} -p ${PG_MASTER_PORT} -T public.alembic_version -a -b -v -f $FILE_PATH_PREFIX.dump ${PG_DB} 2>&1)
record_log "$OUTPUT"

record_log "Compressing backup file..."
tar -czvf $FILE_PATH_PREFIX.tar.gz -C $BACKUP_DIR $FILENAME.dump > /dev/null

record_log "Deleting dump file..."
rm $FILE_PATH_PREFIX.dump

record_log "Deleting backup files older than $DELDAY days..."
find $BACKUP_DIR -name "${TAR_NAME}" -mtime +$DELDAY -delete

record_log "${FILE_PATH_PREFIX}.tar.gz created successfully."
record_log "Backup process completed successfully."