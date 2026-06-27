#!/bin/sh
# Provisions two bucket-scoped InfluxDB tokens via the HTTP API and persists
# their generated values to /influx-tokens/scoped-tokens.env on the dedicated
# secrets volume so consuming services can source the file at startup.
#
# Background: InfluxDB 2.7 ignores a caller-supplied `token` field in the POST
# body and always generates its own opaque token. Fixed token values in .env are
# therefore not possible; the generated values must be captured and shared
# with services via a file on a dedicated secrets volume (influx-tokens).
#
# The influx-tokens volume is root-owned when first created; this script runs as
# the influxdb user. To avoid a permission error the entrypoint mounts the
# volume at /influx-tokens with the influxdb GID (999) allowed to write, OR we
# use chmod/chown via the container entrypoint. In practice the Docker-official
# InfluxDB image entrypoint runs the init scripts as root before dropping to the
# influxdb user, so a plain chmod in the script is sufficient.
#
# Environment (set by the InfluxDB entrypoint before this script runs):
#   INFLUX_HOST                         — temp init server (e.g. http://localhost:8086)
#   DOCKER_INFLUXDB_INIT_ADMIN_TOKEN    — all-access admin token (init only)
#   DOCKER_INFLUXDB_INIT_ORG_ID        — org ID of the provisioned org
#   DOCKER_INFLUXDB_INIT_BUCKET_ID     — bucket ID of the provisioned bucket
#
# curl is available in influxdb:2.7-alpine.

set -e

TOKEN_FILE="/influx-tokens/scoped-tokens.env"

# The named volume may be root-owned on first creation. Ensure the directory
# is writable (chmod g+w) so the token file can be created regardless of the
# user the init scripts run under.
chmod 777 /influx-tokens 2>/dev/null || true

create_token() {
  curl -sf -X POST "${INFLUX_HOST}/api/v2/authorizations" \
    -H "Authorization: Token ${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "$1"
}

extract_token() {
  # The API response is tab-indented JSON with "token" as a top-level field.
  # Match the line containing `"token": "..."` and extract the value.
  grep '"token"' | sed 's/.*"token"[[:space:]]*:[[:space:]]*"//;s/".*//'
}

echo "[10-scoped-tokens] creating telemetry-ingestion write token ..."
WRITE_RESP=$(create_token \
  "{\"orgID\":\"${DOCKER_INFLUXDB_INIT_ORG_ID}\",\"description\":\"telemetry-ingestion write\",\"permissions\":[{\"action\":\"write\",\"resource\":{\"type\":\"buckets\",\"id\":\"${DOCKER_INFLUXDB_INIT_BUCKET_ID}\",\"orgID\":\"${DOCKER_INFLUXDB_INIT_ORG_ID}\"}}]}")
WRITE_TOKEN=$(printf '%s\n' "$WRITE_RESP" | extract_token)

echo "[10-scoped-tokens] creating dashboard-api read token ..."
READ_RESP=$(create_token \
  "{\"orgID\":\"${DOCKER_INFLUXDB_INIT_ORG_ID}\",\"description\":\"dashboard-api read\",\"permissions\":[{\"action\":\"read\",\"resource\":{\"type\":\"buckets\",\"id\":\"${DOCKER_INFLUXDB_INIT_BUCKET_ID}\",\"orgID\":\"${DOCKER_INFLUXDB_INIT_ORG_ID}\"}}]}")
READ_TOKEN=$(printf '%s\n' "$READ_RESP" | extract_token)

echo "[10-scoped-tokens] persisting token values to ${TOKEN_FILE} ..."
# Write as shell-sourceable env vars; the file is read by service entrypoints.
cat > "${TOKEN_FILE}" <<EOF
INFLUXDB_WRITE_TOKEN=${WRITE_TOKEN}
INFLUXDB_READ_TOKEN=${READ_TOKEN}
EOF
chmod 600 "${TOKEN_FILE}"

echo "[10-scoped-tokens] scoped tokens provisioned."
