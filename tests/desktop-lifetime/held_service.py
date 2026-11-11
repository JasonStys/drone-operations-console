"""Jason Stys: QA-only actual Uvicorn held-work fixture; never part of the shipped service.

Functions and variables: docs/SOURCE_MAP.md. Explicit owned file gates release real
work after Uvicorn stops accepting requests. Only synthetic test paths
are used; no PX4, user accounts, downloaded code or installed profile is opened.
"""

import asyncio
import json
import os
import time
from pathlib import Path

import console.desktop as desktop


def main():
    """Wrap the real service factory; explicit release, response and finally are separate oracles."""
    nonce = os.environ["OPS_LAUNCH_NONCE"]
    original = desktop.create_app
    held = Path(os.environ["OPS_PROBE_HELD"])
    released = Path(os.environ["OPS_PROBE_RELEASE"])
    received = Path(os.environ["OPS_PROBE_RECEIVED"])

    def instrumented_app(**kwargs):
        """Keep the product factory, launch token middleware, runtime identity and SQL lifecycle."""
        app = original(**kwargs)

        async def hold():
            """Remain active until the test explicitly opens its owned release gate."""
            with held.open("x", encoding="utf-8") as stream:
                stream.write(str(os.getpid()))
            while not released.exists():
                await asyncio.sleep(0.02)
            return {"completed": True}

        app.add_api_route("/__owned_qa_hold", hold, methods=["GET"])
        route = app.router.routes.pop()
        app.router.routes.insert(0, route)
        Path(os.environ["OPS_PROBE_READY"]).write_text(
            json.dumps(
                {
                    "pid": os.getpid(),
                    "nonce": nonce,
                }
            ),
            encoding="utf-8",
        )
        return app

    desktop.create_app = instrumented_app
    try:
        desktop.main()
    finally:
        # The renderer must receive the actual response before this QA-only post-drain
        # gate allows the owner to destroy it. No delay stands in for acknowledgment.
        if held.exists():
            while not received.exists():
                time.sleep(0.02)
        Path(os.environ["OPS_PROBE_EXITED"]).write_text(str(os.getpid()), encoding="utf-8")


if __name__ == "__main__":
    main()
