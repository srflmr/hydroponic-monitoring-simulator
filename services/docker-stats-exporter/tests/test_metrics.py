"""Unit tests for the pure parsing/rendering logic (no Docker daemon needed)."""

from src.metrics import ContainerSample, parse_sample, render


def _stats(total_usage, usage, limit, rx, tx):
    return {
        "cpu_stats": {"cpu_usage": {"total_usage": total_usage}},
        "memory_stats": {"usage": usage, "limit": limit},
        "networks": {"eth0": {"rx_bytes": rx, "tx_bytes": tx}},
    }


def test_parse_sample_basic():
    container = {"Id": "94b99b5dd7aeb68b0b30", "Names": ["/hydroponic-telemetry-ingestion-1"]}
    sample = parse_sample(container, _stats(6_429_345_000, 34_873_344, 8_220_446_720, 100, 200))
    assert sample == ContainerSample(
        name="hydroponic-telemetry-ingestion-1",
        cid="94b99b5dd7ae",
        cpu_seconds=6.429345,
        mem_bytes=34_873_344,
        mem_limit_bytes=8_220_446_720,
        rx_bytes=100,
        tx_bytes=200,
    )


def test_parse_sample_sums_multiple_interfaces():
    container = {"Id": "abc123def456", "Names": ["/x"]}
    stats = _stats(1_000_000_000, 1, 2, 10, 20)
    stats["networks"]["eth1"] = {"rx_bytes": 5, "tx_bytes": 7}
    sample = parse_sample(container, stats)
    assert sample.rx_bytes == 15
    assert sample.tx_bytes == 27


def test_parse_sample_missing_fields_returns_none():
    # A container that exited mid-scrape returns an empty/partial stats body.
    assert parse_sample({"Id": "x", "Names": ["/x"]}, {}) is None
    assert parse_sample({"Id": "x", "Names": ["/x"]}, {"cpu_stats": {}}) is None


def test_parse_sample_no_networks_defaults_zero():
    sample = parse_sample(
        {"Id": "abc123def456789", "Names": ["/y"]},
        {"cpu_stats": {"cpu_usage": {"total_usage": 2_000_000_000}}, "memory_stats": {"usage": 5, "limit": 9}},
    )
    assert sample.rx_bytes == 0 and sample.tx_bytes == 0
    assert sample.cpu_seconds == 2.0


def test_render_contains_help_type_and_values():
    sample = ContainerSample("hydroponic-redis-1", "deadbeef0001", 1.5, 1024, 2048, 10, 20)
    out = render([sample])
    assert "# TYPE container_cpu_usage_seconds_total counter" in out
    assert "# TYPE container_memory_usage_bytes gauge" in out
    assert 'container_cpu_usage_seconds_total{name="hydroponic-redis-1",id="deadbeef0001"} 1.5' in out
    assert 'container_memory_usage_bytes{name="hydroponic-redis-1",id="deadbeef0001"} 1024' in out
    assert 'container_last_seen{name="hydroponic-redis-1",id="deadbeef0001"} 1' in out


def test_render_escapes_label_values():
    out = render([ContainerSample('a"b\\c', "id1", 0.0, 0, 0, 0, 0)])
    assert 'name="a\\"b\\\\c"' in out


def test_render_empty_is_valid():
    out = render([])
    assert "# TYPE container_cpu_usage_seconds_total counter" in out
    assert out.endswith("\n")
