"""Jason Stys: reproducible frozen Windows service build. Functions/variables: docs/SOURCE_MAP.md."""

import subprocess
import sys
from pathlib import Path


def main():
    """Bundle the real replay/API service; do not package runtime accounts or MAVSDK/PX4."""
    root = Path(__file__).resolve().parents[1]
    subprocess.run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--noconfirm",
            "--onedir",
            "--noupx",
            "--name",
            "drone-console-service",
            "--distpath",
            "release",
            "--workpath",
            "build/desktop",
            "--specpath",
            "build",
            "--paths",
            str(root),
            "--hidden-import",
            "sqlalchemy.dialects.sqlite",
            "--hidden-import",
            "uvicorn.logging",
            "--hidden-import",
            "uvicorn.loops.auto",
            "--hidden-import",
            "uvicorn.protocols.http.auto",
            "--hidden-import",
            "uvicorn.lifespan.on",
            "tools/desktop_entry.py",
        ],
        cwd=root,
        check=True,
    )


if __name__ == "__main__":
    main()
