# Hydroponic Monitoring System Simulator

A multi-zone hydroponic monitoring platform that automates nutrient allocation from a single shared central tank, arbitrating between zones by **priority** and **criticality**. Unlike a plain IoT dashboard, it makes real **resource-arbitration decisions** over a contested resource — which is why it is built as independent Docker-Compose microservices.

## Architecture

`sensor-simulator → MQTT → telemetry-ingestion → Redis(list) → zone-evaluator → Redis(list) → resource-arbitration → MQTT → actuator-gateway`, with `dashboard-api` broadcasting live updates to the SvelteKit `frontend-web` over WebSocket, all behind a Traefik + Authelia gateway. Observability via Prometheus + Grafana (node-exporter + cAdvisor).

| Layer | Services |
|---|---|
| Custom | telemetry-ingestion, zone-evaluator, zone-config, resource-arbitration, actuator-gateway, dashboard-api, frontend-web, sensor-simulator (×3 zones) |
| Gateway | traefik, authelia |
| Data | postgres, redis, influxdb, mosquitto |
| Monitoring | node-exporter (host), cadvisor + docker-stats-exporter (containers), docker-socket-proxy, prometheus, grafana |

## Security

- **Per-service least-privilege identity** — each service authenticates to each store with its own credential: Postgres roles, InfluxDB scoped read/write tokens, Redis ACL users, Mosquitto per-topic ACL. No shared superuser; Redis `default` and MQTT anonymous are off.
- **Non-root containers** — every custom service image runs as a non-root user.
- **Gateway-only exposure** — only Traefik is reachable from outside; backends sit on an `internal` network. Page and WebSocket routes are gated by Authelia (forward-auth); Grafana trusts Authelia's `Remote-User` (auth-proxy, anonymous off). Authelia stores sessions in Postgres; its operator user is rendered from `.env`.
- **No raw Docker socket in containers** — per-container metrics come from the Docker Engine API via a read-only `docker-socket-proxy` (only `GET /containers` and `/version`; writes blocked), so no container holds the root-equivalent `docker.sock`.
- **Secrets via `.env`** — no credentials are committed; `.env.example` is the template.

## Prerequisites

- Docker + Docker Compose.
- `*.localhost` resolves to loopback (default on Linux/Chrome). The demo uses `hydroponic.localhost`, `auth.hydroponic.localhost`, `grafana.hydroponic.localhost`. If your resolver doesn't auto-resolve `*.localhost`, add them to `/etc/hosts` → `127.0.0.1`.

## Run

```bash
cp .env.example .env          # fill in the secrets (per-service DB/Redis/MQTT credentials, Authelia operator + secrets, Influx admin token, Grafana admin password)
docker compose up -d --build  # ~20 services; wait until all are healthy
docker compose ps
```

## Access

| What | URL | Notes |
|---|---|---|
| Dashboard | https://hydroponic.localhost | self-signed cert (accept the warning); public landing → log in via Authelia → gated `/dashboard` |
| Auth portal | https://auth.hydroponic.localhost | operator credentials from `.env` (`AUTHELIA_OPERATOR_USERNAME` / `AUTHELIA_OPERATOR_PASSWORD`) |
| Grafana | https://grafana.hydroponic.localhost | behind Authelia (auth-proxy, no separate login); **Monitoring** folder → *Overview*, *Host · Node Exporter Full*, *Containers* dashboards |

## Demo (PRD §11 scenarios)

| # | Scenario | How |
|---|---|---|
| 1–2 | Auth gate / login | public landing at `/`; opening `/dashboard` unauthenticated → redirected to Authelia → log in |
| 3 | Normal condition | all zones live on the dashboard; tank gauge full |
| 4 | Single-zone low EC | `./scripts/demo-trigger-zone-a.sh` |
| 5–7 | Multi-zone conflict + refill | `./scripts/demo-trigger-konflik.sh` (prints the refill command for #7) |
| 8 | Horizontal scaling | `./scripts/demo-scale-worker.sh 3` → see replicas in Grafana |
| 9 | Fault tolerance | `docker kill hydroponic-zone-evaluator-2` (one replica) → system keeps running |

## Project layout

`services/` (per-service code) · `traefik/`, `authelia/`, `mosquitto/`, `postgres/init/`, `prometheus/`, `grafana/` (infra config) · `scripts/` (demo shortcuts) · one root `docker-compose.yml`.
