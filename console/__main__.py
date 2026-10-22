"""Jason Stys: loopback launcher and trusted-operator provisioning CLI.

Functions/variables and declaration lines: docs/SOURCE_MAP.md. Passwords use getpass,
not shell arguments or Git files. The default service never opens a real-aircraft link.
"""

import argparse
import getpass
import os
from pathlib import Path

import uvicorn

from console.auth import add_user
from console.store import Store


def main():
    """Parse local administrative intent; launch a single bounded worker at a fixed loopback port."""
    parser = argparse.ArgumentParser(
        description="Simulator-only Drone Operations Console by Jason Stys"
    )
    parser.add_argument("--create-user")
    parser.add_argument("--role", choices=["viewer", "operator", "admin"], default="operator")
    args = parser.parse_args()
    if args.create_user:
        Path(".runtime").mkdir(exist_ok=True)
        store = Store(os.environ.get("OPS_DATABASE_URL", "sqlite:///.runtime/workspace.db"))
        try:
            add_user(
                store,
                args.create_user,
                getpass.getpass("New password (14+ characters): "),
                args.role,
            )
            print("User created. Start the app with python -m console.")
        finally:
            store.close()
    else:
        uvicorn.run(
            "console.api:create_app",
            factory=True,
            host="127.0.0.1",
            port=8840,
            workers=1,
            access_log=False,
        )


if __name__ == "__main__":
    main()
