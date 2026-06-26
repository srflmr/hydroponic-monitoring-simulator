# Hydroponic Monitoring System Simulator

A multi-zone hydroponic monitoring platform that automates nutrient allocation from a single shared central tank, arbitrating between zones by **priority** and **criticality**. Unlike a plain IoT dashboard, it makes real **resource-arbitration decisions** over a contested resource — which is why it is built as independent Docker-Compose microservices.

## Architecture

`sensor-simulator → MQTT → telemetry-ingestion → Redis(list) → zone-evaluator → Redis(list) → resource-arbitration → MQTT → actuator-gateway`, with `dashboard-api` broadcasting live updates to the SvelteKit `frontend-web` over WebSocket, all behind a Traefik + Authelia gateway. Observability via Prometheus + Grafana (node-exporter + cAdvisor).

| Layer | Services |
|---|---|
| Custom | telemetry-ingestion, zone-evaluator, zone-config, resource-arbitration, actuator-gateway, dashboard-api, frontend-web, sensor-simulator (×3 zones) |
| Gateway | traefik, authelia |
| Data | postgres, redis, influxdb, mosquitto |
| Monitoring | node-exporter, cadvisor, prometheus, grafana |

## Prerequisites

- Docker + Docker Compose.
- `*.localhost` resolves to loopback (default on Linux/Chrome). The demo uses `hydroponic.localhost`, `auth.hydroponic.localhost`, `grafana.hydroponic.localhost`. If your resolver doesn't auto-resolve `*.localhost`, add them to `/etc/hosts` → `127.0.0.1`.

## Run

```bash
cp .env.example .env          # fill in the secrets (Authelia secrets, Influx token, Grafana admin password)
docker compose up -d --build  # ~20 services; wait until all are healthy
docker compose ps
```

## Access

| What | URL | Notes |
|---|---|---|
| Dashboard | https://hydroponic.localhost | self-signed cert (accept the warning); login via Authelia |
| Auth portal | https://auth.hydroponic.localhost | operator `operator` / `operator-demo-2026` |
| Grafana | https://grafana.hydroponic.localhost | behind Authelia; **Infra Overview** dashboard |

## Demo (PRD §11 scenarios)

| # | Scenario | How |
|---|---|---|
| 1–2 | Auth gate / login | open the dashboard unauthenticated → redirected to Authelia → log in |
| 3 | Normal condition | all zones live on the dashboard; tank gauge full |
| 4 | Single-zone low EC | `./scripts/demo-trigger-zone-a.sh` |
| 5–7 | Multi-zone conflict + refill | `./scripts/demo-trigger-konflik.sh` (prints the refill command for #7) |
| 8 | Horizontal scaling | `./scripts/demo-scale-worker.sh 3` → see replicas in Grafana |
| 9 | Fault tolerance | `docker kill hydroponic-zone-evaluator-2` (one replica) → system keeps running |

## Project layout

`services/` (per-service code) · `traefik/`, `authelia/`, `mosquitto/`, `postgres/init/`, `prometheus/`, `grafana/` (infra config) · `scripts/` (demo shortcuts) · one root `docker-compose.yml`.

## Academic context

Built for **IMT01504602 — Microservices Development**. The repository is a course assignment; per project convention the academic status is noted here in the README rather than in the project name.
