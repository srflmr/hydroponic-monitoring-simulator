#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v authelia_pw="$AUTHELIA_STORAGE_POSTGRES_PASSWORD" <<'SQL'
CREATE ROLE authelia LOGIN PASSWORD :'authelia_pw';
SQL
# CREATE DATABASE cannot run inside the heredoc transaction with other stmts; run separately:
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE DATABASE authelia OWNER authelia;"
