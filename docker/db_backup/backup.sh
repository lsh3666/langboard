#!/bin/sh

. /scripts/.env

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
if [ -n "${POSTGRES_EXTERNAL_MAIN_URL}" ] || [ -n "${POSTGRES_EXTERNAL_REPLICA_URL}" ]; then
    record_log "External PostgreSQL mode detected. Using PG_EXTERNAL_URL."
    OUTPUT=$(pg_dump --no-sync --clean --column-inserts --if-exists --no-owner -b -v -f "$FILE_PATH_PREFIX.dump" "${PG_EXTERNAL_URL}" 2>&1)
else
    record_log "Internal PostgreSQL mode detected. Using replica host."
    OUTPUT=$(PGPASSWORD="${PG_PASS}" pg_dump --no-sync -h "${PG_MASTER_HOST}" -U "${PG_USER}" -p "${PG_MASTER_PORT}" --clean --column-inserts --if-exists --no-owner -b -v -f "$FILE_PATH_PREFIX.dump" "${PG_DB}" 2>&1)
fi
DUMP_EXIT_CODE=$?
record_log "$OUTPUT"

if [ $DUMP_EXIT_CODE -ne 0 ]; then
    record_log "Backup process failed."
    exit $DUMP_EXIT_CODE
fi

record_log "Compressing backup file..."
tar -czvf "$FILE_PATH_PREFIX.tar.gz" -C "$BACKUP_DIR" "$FILENAME.dump" > /dev/null

record_log "Deleting dump file..."
rm "$FILE_PATH_PREFIX.dump"

if [ -n "${DB_BACKUP_UPLOAD_URL}" ]; then
    record_log "Uploading backup archive to DB_BACKUP_UPLOAD_URL..."
    HEADER_COUNT=0
    set -- --silent --show-error --fail --location --request POST --form "file=@$FILE_PATH_PREFIX.tar.gz"

    if [ -n "${DB_BACKUP_UPLOAD_HEADERS}" ]; then
        REMAINING_HEADERS=${DB_BACKUP_UPLOAD_HEADERS}
        while :; do
            case "$REMAINING_HEADERS" in
                *'|'*)
                    header=${REMAINING_HEADERS%%|*}
                    REMAINING_HEADERS=${REMAINING_HEADERS#*|}
                    ;;
                *)
                    header=$REMAINING_HEADERS
                    REMAINING_HEADERS=
                    ;;
            esac

            header=$(printf '%s' "$header" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
            if [ -n "$header" ]; then
                set -- "$@" --header "$header"
                HEADER_COUNT=$((HEADER_COUNT + 1))
            fi

            [ -n "$REMAINING_HEADERS" ] || break
        done
    fi

    if [ $HEADER_COUNT -gt 0 ]; then
        record_log "Applying $HEADER_COUNT upload header(s) from DB_BACKUP_UPLOAD_HEADERS."
    fi

    UPLOAD_OUTPUT=$(curl "$@" "${DB_BACKUP_UPLOAD_URL}" 2>&1)
    UPLOAD_EXIT_CODE=$?

    if [ $UPLOAD_EXIT_CODE -ne 0 ]; then
        record_log "Backup upload failed."
        record_log "$UPLOAD_OUTPUT"
    else
        record_log "Backup upload completed successfully."
    fi
else
    record_log "DB_BACKUP_UPLOAD_URL is empty. Skipping remote upload."
fi

record_log "Deleting backup files older than $DELDAY days..."
find "$BACKUP_DIR" -name "${TAR_NAME}" -mtime +$DELDAY -delete

record_log "${FILE_PATH_PREFIX}.tar.gz created successfully."
record_log "Backup process completed successfully."
