#!/usr/bin/env bash
# Demo #8 — horizontal scaling: run N zone-evaluator replicas; they share the Redis telemetry queue (BRPOP),
# spreading load. Visible per-container in Grafana (cAdvisor).
set -euo pipefail
cd "$(dirname "$0")/.."

N="${1:-3}"
echo "→ Scaling zone-evaluator to ${N} replicas…"
docker compose up -d --scale zone-evaluator="${N}" zone-evaluator
echo "→ Replicas:"
docker compose ps zone-evaluator
echo "✓ Open https://grafana.hydroponic.localhost → 'Infra Overview' → 'Per-container CPU' now shows ${N} zone-evaluator replicas sharing the evaluation load."
echo "→ To scale back: docker compose up -d --scale zone-evaluator=1 zone-evaluator"
