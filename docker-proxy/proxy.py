#!/usr/bin/env python3
"""
docker-socket-proxy: rewrites Docker API version in requests below the minimum
supported by Docker Desktop v29+ (MinAPIVersion=1.40).

Traefik v3.2.x uses docker/docker v27.1.1 which hardcodes API version 1.24
for initial handshake. Docker Desktop v29.5+ rejects calls with version < 1.40.
This proxy sits between Traefik and the Docker socket and upgrades old version
paths (e.g. /v1.24/...) to the minimum accepted version (1.40).
"""
import socket
import threading
import os
import re
import sys

REAL_SOCK = os.environ.get("DOCKER_SOCK", "/var/run/docker.sock")
PROXY_SOCK = os.environ.get("PROXY_SOCK", "/var/run/docker-proxy.sock")
MIN_VERSION = os.environ.get("MIN_API_VERSION", "1.40")

if os.path.exists(PROXY_SOCK):
    os.unlink(PROXY_SOCK)


def rewrite_version_in_bytes(data: bytes) -> bytes:
    """Rewrite /v1.XX/ API version paths where XX < MIN_VERSION to MIN_VERSION."""
    try:
        text = data.decode("latin-1")
        min_minor = int(MIN_VERSION.split(".")[1])

        def replace_ver(m):
            ver = m.group(1)
            try:
                minor = int(ver.split(".")[1])
                if minor < min_minor:
                    return m.group(0).replace(f"/v{ver}/", f"/v{MIN_VERSION}/")
            except (ValueError, IndexError):
                pass
            return m.group(0)

        rewritten = re.sub(r"/v(\d+\.\d+)/", replace_ver, text)
        if rewritten != text:
            return rewritten.encode("latin-1")
    except Exception:
        pass
    return data


class Relay(threading.Thread):
    def __init__(self, src, dst, rewrite=False):
        super().__init__(daemon=True)
        self.src = src
        self.dst = dst
        self.rewrite = rewrite

    def run(self):
        try:
            while True:
                data = self.src.recv(65536)
                if not data:
                    break
                if self.rewrite:
                    data = rewrite_version_in_bytes(data)
                self.dst.sendall(data)
        except Exception:
            pass
        finally:
            for s in (self.src, self.dst):
                try:
                    s.close()
                except Exception:
                    pass


def handle_connection(client: socket.socket) -> None:
    backend = None
    try:
        backend = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        backend.connect(REAL_SOCK)
        # Rewrite client->docker direction; pass docker->client unchanged.
        t1 = Relay(client, backend, rewrite=True)
        t2 = Relay(backend, client, rewrite=False)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
    except Exception as exc:
        sys.stderr.write(f"connection error: {exc}\n")
        sys.stderr.flush()
    finally:
        for s in filter(None, [client, backend]):
            try:
                s.close()
            except Exception:
                pass


def main() -> None:
    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(PROXY_SOCK)
    os.chmod(PROXY_SOCK, 0o777)
    server.listen(64)
    sys.stderr.write(
        f"docker-socket-proxy: listening on {PROXY_SOCK}, "
        f"forwarding to {REAL_SOCK}, min API version {MIN_VERSION}\n"
    )
    sys.stderr.flush()
    try:
        while True:
            client, _ = server.accept()
            threading.Thread(target=handle_connection, args=(client,), daemon=True).start()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        try:
            os.unlink(PROXY_SOCK)
        except Exception:
            pass


if __name__ == "__main__":
    main()
