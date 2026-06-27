#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v zone_config_pw="$ZONE_CONFIG_DB_PASSWORD" \
  -v ra_pw="$RESOURCE_ARBITRATION_DB_PASSWORD" <<'SQL'
CREATE ROLE zone_config_app LOGIN PASSWORD :'zone_config_pw';
CREATE ROLE resource_arbitration_app LOGIN PASSWORD :'ra_pw';

GRANT USAGE ON SCHEMA public TO zone_config_app, resource_arbitration_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE zones TO zone_config_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE arbitration_logs, tank_status TO resource_arbitration_app;
GRANT SELECT ON TABLE zones TO resource_arbitration_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO resource_arbitration_app;
SQL
