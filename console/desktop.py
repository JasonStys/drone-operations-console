"""Jason Stys: owned loopback-only packaged replay service with pipe-bound shutdown.

Functions/variables and physical source locations: docs/SOURCE_MAP.md. No PX4 process,
credential default, external interface or shell command is enabled by this entry point.
"""

import argparse
import os
import sys
import threading
from pathlib import Path

import uvicorn

from console.api import create_app


def main():
    """Bind the launcher's selected local port; EOF requests graceful service/SQL cleanup."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--ui", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535 or not args.ui.is_dir():
        raise ValueError("Invalid desktop launch configuration")
    if len(os.environ.get("OPS_LAUNCH_TOKEN", "")) != 64:
        raise ValueError("Owned desktop launch token required")
    args.data.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.environ["OPS_ADAPTER"] = "replay"
    os.environ["OPS_ORIGIN"] = f"http://127.0.0.1:{args.port}"
    os.environ["OPS_DATABASE_URL"] = f"sqlite:///{(args.data / 'workspace.db').as_posix()}"
    os.environ["OPS_UI_DIR"] = str(args.ui)
    os.environ["OPS_DESKTOP_BOOTSTRAP"] = "1"
    os.environ.pop("OPS_READ_ONLY", None)
    server = uvicorn.Server(
        uvicorn.Config(
            create_app(),
            host="127.0.0.1",
            port=args.port,
            access_log=False,
            limit_concurrency=32,
            log_level="warning",
        )
    )

    def watch_parent():
        """The desktop owns stdin; closing or crashing the launcher closes the pipe."""
        sys.stdin.buffer.read()
        server.should_exit = True

    threading.Thread(target=watch_parent, daemon=True).start()
    server.run()


if __name__ == "__main__":
    main()
