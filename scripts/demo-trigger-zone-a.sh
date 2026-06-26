#!/usr/bin/env bash
# Demo #4 — single-zone low EC: zone-a requests nutrient, gets fulfilled, tank drops, log entry appears.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Resetting tank to full (200 L)…"
docker compose exec -T postgres psql -U postgres -d hydroponic -c "UPDATE tank_status SET current_volume=200.0 WHERE id=1;" >/dev/null
docker compose exec -T redis redis-cli SET tank:current_volume 200.0 >/dev/null

echo "→ Forcing zone-a EC low (1.1, below ec_min 1.5) for 20s…"
docker compose exec -T sensor-simulator-zone-a python -c "import json,urllib.request as u; r=u.Request('http://localhost:3006/simulate', data=json.dumps({'param':'ec','value':1.1,'duration_seconds':20}).encode(), headers={'Content-Type':'application/json'}, method='POST'); print(u.urlopen(r, timeout=5).read().decode())"

echo "✓ Watch https://hydroponic.localhost — Zone A goes critical, draws nutrient (tank drops), and a 'fulfilled' entry appears in the arbitration log (/logs)."
