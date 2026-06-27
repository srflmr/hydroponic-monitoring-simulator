import os

os.environ.setdefault("MQTT_BROKER_URL", "mqtt://localhost:1883")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("POSTGRES_URL", "postgresql://t:t@localhost:5432/t")
os.environ.setdefault("ZONE_CONFIG_URL", "http://localhost:3003")
os.environ["ARBITRATION_AUTOSTART"] = "0"

from src import main  # noqa: E402


def test_main_imports_without_autostart():
    assert hasattr(main, "app")
    assert hasattr(main, "serve")
    assert main._pending == {}
    assert not main._connected.is_set()
