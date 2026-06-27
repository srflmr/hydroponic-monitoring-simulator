"""Docker-API per-container metrics exporter.

Reads container stats from the Docker Engine API *through a read-only
docker-socket-proxy* (never the raw socket) and exposes them in Prometheus
format. Exists because cAdvisor cannot enumerate containers on Docker
Desktop / WSL2; on a native Linux host cAdvisor covers this instead.
"""

from __future__ import annotations

import asyncio
import os

import httpx
from fastapi import FastAPI, Response

from .metrics import ContainerSample, parse_sample, render

# docker-socket-proxy speaks plain HTTP over TCP. Accept a DOCKER_HOST-style
# tcp:// value and normalise it to an http:// base URL.
_RAW_HOST = os.environ.get("DOCKER_HOST", "tcp://docker-socket-proxy:2375")
DOCKER_BASE_URL = _RAW_HOST.replace("tcp://", "http://", 1)
SCRAPE_TIMEOUT = float(os.environ.get("SCRAPE_TIMEOUT_SECONDS", "10"))

app = FastAPI(title="docker-stats-exporter")


async def _fetch_stats(client: httpx.AsyncClient, cid: str) -> dict | None:
    try:
        resp = await client.get(f"/containers/{cid}/stats", params={"stream": "false"})
        resp.raise_for_status()
        return resp.json()
    except (httpx.HTTPError, ValueError):
        return None


async def collect_samples() -> list[ContainerSample]:
    async with httpx.AsyncClient(base_url=DOCKER_BASE_URL, timeout=SCRAPE_TIMEOUT) as client:
        listing = await client.get("/containers/json")
        listing.raise_for_status()
        containers = listing.json()

        stats = await asyncio.gather(*(_fetch_stats(client, c["Id"]) for c in containers))

    samples: list[ContainerSample] = []
    for container, stat in zip(containers, stats):
        if stat is None:
            continue
        sample = parse_sample(container, stat)
        if sample is not None:
            samples.append(sample)
    return samples


@app.get("/metrics")
async def metrics() -> Response:
    samples = await collect_samples()
    return Response(content=render(samples), media_type="text/plain; version=0.0.4")


@app.get("/health")
async def health() -> Response:
    """200 only when the proxy (hence the Docker API) is reachable."""
    try:
        async with httpx.AsyncClient(base_url=DOCKER_BASE_URL, timeout=5.0) as client:
            resp = await client.get("/version")
            resp.raise_for_status()
        return Response(content='{"status":"ok"}', media_type="application/json")
    except httpx.HTTPError:
        return Response(content='{"status":"unavailable"}', status_code=503, media_type="application/json")
