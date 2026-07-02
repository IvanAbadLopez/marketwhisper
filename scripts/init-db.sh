#!/bin/bash
set -e

# This script runs automatically when the database container starts
# It enables the pgvector extension

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

echo "✓ pgvector extension enabled"
