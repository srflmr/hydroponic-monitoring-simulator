#!/usr/bin/env bash
# Demo #5/#6/#7 — multi-zone contention: limited tank, 3 zones go low together; arbitration serves by score,
# queues/rejects the rest with reasons; then a manual refill reprocesses the queue.
set -euo pipefail
cd "$(dirname "$0")/.."

LIMIT="${1:-10}"   # litres; ~2 allocations so the 3rd zone contends
echo "→ Setting tank to ${LIMIT} L (limited — forces contention)…"
docker compose exec -T postgres psql -U postgres -d hydroponic -c "UPDATE tank_status SET current_volume=${LIMIT} WHERE id=1;" >/dev/null
docker compose exec -T redis redis-cli SET tank:current_volume "${LIMIT}" >/dev/null

trigger() {  # zone, ec value
  docker compose exec -T "sensor-simulator-$1" python -c "import json,urllib.request as u; r=u.Request('http://localhost:3006/simulate', data=json.dumps({'param':'ec','value':$2,'duration_seconds':20}).encode(), headers={'Content-Type':'application/json'}, method='POST'); print('$1 ->', u.urlopen(r, timeout=5).read().decode())"
}
echo "→ Forcing EC low on all three zones in rapid succession…"
trigger zone-a 1.1   # ec_min 1.5
trigger zone-b 0.5   # ec_min 0.8
trigger zone-c 1.0   # ec_min 1.2

echo "✓ Watch the arbitration feed / https://hydroponic.localhost/logs — decisions show WHICH zone is served first and WHY (score), with later ones 'queued' or 'rejected' + a tank-low alert."
echo "→ To demo #7 (manual refill reprocessing the queue), run:"
echo "   docker compose exec -T resource-arbitration python -c \"import urllib.request as u; r=u.Request('http://localhost:3004/tank/refill', data=b'{}', headers={'Content-Type':'application/json'}, method='POST'); print(u.urlopen(r).read().decode())\""
