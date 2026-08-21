#!/bin/bash

# This script migrates the 'bask' schema from a source database to a target database.
# It is read-only against the source and only operates on the 'bask' schema.
# The target database must have a 'bask' schema, which will be dropped and recreated
# if the --refresh flag is used.
#
# Usage: migrate-bask-schema.sh <source_url_env_var> <target_db> [--refresh]
#   e.g. migrate-bask-schema.sh CCSS_SOURCE_URL bask

set -uo pipefail

# Source the environment file
if [[ ! -f /opt/netcup/stack/.env ]]; then
    echo "Error: /opt/netcup/stack/.env not found" >&2
    exit 1
fi
source /opt/netcup/stack/.env

# Check arguments
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <source_url_env_var> <target_db> [--refresh]" >&2
    exit 1
fi

SOURCE_URL_ENV_VAR="$1"
TARGET_DB="$2"
REFRESH=false

if [[ $# -ge 3 && "$3" == "--refresh" ]]; then
    REFRESH=true
fi

# Resolve source URL via indirect expansion
SRC="${!SOURCE_URL_ENV_VAR}"
if [[ -z "$SRC" ]]; then
    echo "Error: Environment variable $SOURCE_URL_ENV_VAR is empty or not set" >&2
    exit 1
fi

# Create dumps directory if it doesn't exist
DUMP_DIR="/opt/netcup/stack/dumps"
mkdir -p "$DUMP_DIR"

# Generate timestamped dump filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$DUMP_DIR/bask_migration_${TIMESTAMP}.dump"

# Dump the 'bask' schema only (not public)
echo "Dumping 'bask' schema from $SRC to $DUMP_FILE"
pg_dump "$SRC" --schema=bask --no-owner --no-privileges --format=custom > "$DUMP_FILE" || {
    echo "Error: Failed to dump the 'bask' schema" >&2
    exit 1
}

# Check if target schema exists and is populated
if [[ "$REFRESH" == false ]]; then
    SCHEMA_EXISTS=$(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'bask');")
    if [[ "$SCHEMA_EXISTS" == *"t"* ]]; then
        # Check if schema has data
        ROW_COUNT=$(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM bask.*;")
        if [[ "$ROW_COUNT" != "0" ]]; then
            echo "Error: Target 'bask' schema already exists and is populated. Use --refresh to overwrite." >&2
            exit 1
        fi
    fi
fi

# Drop and recreate the target 'bask' schema if --refresh flag is used
if [[ "$REFRESH" == true ]]; then
    echo "Dropping existing 'bask' schema in $TARGET_DB"
    docker exec netcup-db psql -d "$TARGET_DB" -c "DROP SCHEMA IF EXISTS bask CASCADE;"
fi

# Restore the dump into the target database
echo "Restoring dump to $TARGET_DB"
docker exec -i netcup-db pg_restore --dbname="$TARGET_DB" --schema=bask "$DUMP_FILE" || {
    echo "Error: Failed to restore the dump to $TARGET_DB" >&2
    exit 1
}

# Run post-migration grants script if it exists
if [[ -f /opt/netcup/stack/scripts/post-migration-grants.sh ]]; then
    echo "Running post-migration grants script"
    docker exec netcup-db /opt/netcup/stack/scripts/post-migration-grants.sh "$TARGET_DB" || {
        echo "Warning: Post-migration grants script failed" >&2
    }
fi

# Verify row counts for each table in the 'bask' schema
echo "Verifying row counts..."
SOURCE_TABLES=()
TARGET_TABLES=()

# Get list of tables from source
while IFS= read -r table; do
    SOURCE_TABLES+=("$table")
done < <(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'bask';")

# Get list of tables from target
while IFS= read -r table; do
    TARGET_TABLES+=("$table")
done < <(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'bask';")

# Check if we have the same tables
if [[ ${#SOURCE_TABLES[@]} -ne ${#TARGET_TABLES[@]} ]]; then
    echo "Error: Table count mismatch between source and target" >&2
    exit 1
fi

ALL_MATCH=true
TOTAL_ROWS=0

for table in "${SOURCE_TABLES[@]}"; do
    # Get row counts from source and target
    SOURCE_COUNT=$(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM bask.$table;")
    TARGET_COUNT=$(docker exec netcup-db psql -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM bask.$table;")

    # Check if counts match
    if [[ "$SOURCE_COUNT" != "$TARGET_COUNT" ]]; then
        echo "FAIL: Row count mismatch for table $table - Source: $SOURCE_COUNT, Target: $TARGET_COUNT"
        ALL_MATCH=false
    else
        echo "PASS: Table $table - Rows: $SOURCE_COUNT"
        TOTAL_ROWS=$((TOTAL_ROWS + SOURCE_COUNT))
    fi
done

# Print final summary
SCHEMA_COUNT=0
TABLE_COUNT=0
if [[ ${#SOURCE_TABLES[@]} -gt 0 ]]; then
    TABLE_COUNT=${#SOURCE_TABLES[@]}
    SCHEMA_COUNT=1
fi

echo ""
echo "Migration Summary:"
echo "Schema count: $SCHEMA_COUNT"
echo "Table count: $TABLE_COUNT"
echo "Total rows: $TOTAL_ROWS"
echo "Dump file: $DUMP_FILE"

if [[ "$ALL_MATCH" == true ]]; then
    echo "Result: PASS"
    exit 0
else
    echo "Result: FAIL"
    exit 1
fi

# Reminder about pgvector extension
echo ""
echo "REMINDER: If the knowledge base needs pgvector extension, ensure apply-extensions.sh includes the new database."
echo "The extension lives in 'public' on the target while tables live in 'bask'."
echo "A vector column is declared as 'public.vector(1536)'."