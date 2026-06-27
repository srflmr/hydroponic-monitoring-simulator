"""Pure helpers: parse Docker Engine stats into samples and render Prometheus text.

Kept free of I/O so the parsing/formatting logic is unit-testable without a
Docker daemon. Network access lives in main.py.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ContainerSample:
    name: str
    cid: str  # short container id (12 chars)
    cpu_seconds: float
    mem_bytes: int
    mem_limit_bytes: int
    rx_bytes: int
    tx_bytes: int


def parse_sample(container: dict, stats: dict) -> ContainerSample | None:
    """Build a ContainerSample from a /containers/json entry + its /stats body.

    Returns None when required fields are missing (e.g. a container that exited
    mid-scrape), so the caller can skip it without aborting the whole scrape.
    """
    try:
        names = container.get("Names") or []
        name = names[0].lstrip("/") if names else container.get("Id", "")[:12]
        cid = container.get("Id", "")[:12]

        cpu_ns = stats["cpu_stats"]["cpu_usage"]["total_usage"]
        mem = stats.get("memory_stats", {})
        nets = stats.get("networks") or {}
        rx = sum(int(n.get("rx_bytes", 0)) for n in nets.values())
        tx = sum(int(n.get("tx_bytes", 0)) for n in nets.values())

        return ContainerSample(
            name=name,
            cid=cid,
            cpu_seconds=cpu_ns / 1e9,
            mem_bytes=int(mem.get("usage", 0)),
            mem_limit_bytes=int(mem.get("limit", 0)),
            rx_bytes=rx,
            tx_bytes=tx,
        )
    except (KeyError, TypeError, ValueError):
        return None


def _escape(value: str) -> str:
    """Escape a Prometheus label value (backslash, double-quote, newline)."""
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


# (metric name, help text, type, sample attribute)
_FAMILIES = [
    ("container_cpu_usage_seconds_total", "Cumulative CPU time consumed, in seconds.", "counter", "cpu_seconds"),
    ("container_memory_usage_bytes", "Current memory usage, in bytes.", "gauge", "mem_bytes"),
    ("container_spec_memory_limit_bytes", "Memory limit, in bytes (host memory when unlimited).", "gauge", "mem_limit_bytes"),
    ("container_network_receive_bytes_total", "Cumulative bytes received over the network.", "counter", "rx_bytes"),
    ("container_network_transmit_bytes_total", "Cumulative bytes transmitted over the network.", "counter", "tx_bytes"),
]


def render(samples: list[ContainerSample]) -> str:
    """Render samples into Prometheus text exposition format.

    Metric names intentionally mirror cAdvisor's so the same Grafana dashboard
    works whether series come from this exporter (Docker Desktop) or cAdvisor
    (native Linux host). Series are distinguished by the Prometheus job label.
    """
    lines: list[str] = []
    for metric, help_text, mtype, attr in _FAMILIES:
        lines.append(f"# HELP {metric} {help_text}")
        lines.append(f"# TYPE {metric} {mtype}")
        for s in samples:
            labels = f'name="{_escape(s.name)}",id="{_escape(s.cid)}"'
            lines.append(f"{metric}{{{labels}}} {getattr(s, attr)}")

    lines.append("# HELP container_last_seen Unix-style marker (1) for a container observed this scrape.")
    lines.append("# TYPE container_last_seen gauge")
    for s in samples:
        labels = f'name="{_escape(s.name)}",id="{_escape(s.cid)}"'
        lines.append(f"container_last_seen{{{labels}}} 1")

    return "\n".join(lines) + "\n"
