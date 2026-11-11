"""Jason Stys: QA-only actual Uvicorn held-work fixture; never part of the shipped service.

Functions and variables: docs/SOURCE_MAP.md. A nonce-bound separate control listener
can release work after Uvicorn stops accepting requests. Only synthetic test paths
are used; no PX4, user accounts, downloaded code or installed profile is opened.
"""

import asyncio
import hmac
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import console.desktop as desktop


def main():
    """Wrap the real service factory; explicit release, response and finally are separate oracles."""
    held = threading.Event()
    released = threading.Event()
    nonce = os.environ["OPS_LAUNCH_NONCE"]
    original = desktop.create_app

    class Control(BaseHTTPRequestHandler):
        """Expose only owned fixture state/release under the real launch nonce."""

        def do_GET(self):
            """Refuse foreign capabilities and unknown paths before touching the release gate."""
            if not hmac.compare_digest(self.headers.get("X-Probe-Nonce", ""), nonce):
                self.send_error(403)
                return
            if self.path == "/release":
                released.set()
            elif self.path != "/state":
                self.send_error(404)
                return
            value = json.dumps(
                {"pid": os.getpid(), "held": held.is_set(), "released": released.is_set()}
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(value)))
            self.end_headers()
            self.wfile.write(value)

        def log_message(self, *_args):
            """The fixture emits no authorization headers or HTTP access log."""

    control = ThreadingHTTPServer(("127.0.0.1", 0), Control)
    threading.Thread(target=control.serve_forever, daemon=True).start()

    def instrumented_app(**kwargs):
        """Keep the product factory, launch token middleware, runtime identity and SQL lifecycle."""
        app = original(**kwargs)

        async def hold():
            """Remain active until the independent control listener explicitly releases this task."""
            held.set()
            await asyncio.to_thread(released.wait)
            return {"completed": True}

        app.add_api_route("/__owned_qa_hold", hold, methods=["GET"])
        route = app.router.routes.pop()
        app.router.routes.insert(0, route)
        Path(os.environ["OPS_PROBE_READY"]).write_text(
            json.dumps(
                {
                    "pid": os.getpid(),
                    "control": control.server_address[1],
                    "nonce": nonce,
                    "token": os.environ["OPS_LAUNCH_TOKEN"],
                }
            ),
            encoding="utf-8",
        )
        return app

    desktop.create_app = instrumented_app
    try:
        desktop.main()
    finally:
        control.shutdown()
        control.server_close()
        Path(os.environ["OPS_PROBE_EXITED"]).write_text(str(os.getpid()), encoding="utf-8")


if __name__ == "__main__":
    main()
