"""Jason Stys: isolated loopback browser-test server with explicitly synthetic accounts.

Functions/variables/lines: docs/SOURCE_MAP.md. Uses a new temporary workspace every run;
never points at production data, never starts PX4 and never binds an external interface.
"""

import os
import sys
import tempfile
from pathlib import Path

import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from console.api import create_app  # noqa: E402
from console.auth import add_user  # noqa: E402
from console.store import Store  # noqa: E402


def main():
    """Serve the actual API and production frontend against a disposable browser-test database."""
    Path(".runtime").mkdir(exist_ok=True)
    folder = tempfile.mkdtemp(prefix="browser-", dir=".runtime")
    store = Store(f"sqlite:///{Path(folder) / 'test.db'}")
    for name, role in [("pilot", "operator"), ("reader", "viewer")]:
        add_user(store, name, "synthetic-test-password-42", role)
    os.environ["OPS_ADAPTER"] = "replay"
    uvicorn.run(
        create_app(store=store, origin="http://127.0.0.1:8841"),
        host="127.0.0.1",
        port=8841,
        access_log=False,
        limit_concurrency=32,
    )


if __name__ == "__main__":
    main()
