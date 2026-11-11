"""Jason Stys: freeze a separate QA service with exact product owner/UI bytes. Lines: docs/SOURCE_MAP.md.

The fixture is never copied into release/installers or the product service folder.
It proves the real owner/Uvicorn composition; it is not an NSIS install test.
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from tools.desktop_contract import configuration, digest, source_metadata, ui_inventory


def main(argv=None):
    """Use an absent owned output, clean source and mandatory product metadata; never overwrite evidence."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(".runtime/lifetime-fixture"))
    args = parser.parse_args(argv)
    root = Path(__file__).resolve().parents[1]
    metadata = source_metadata(root, configuration(root))
    ui = ui_inventory(root / "dist")
    output = args.output.absolute()
    if sys.platform != "win32" or output.exists() or output.is_symlink():
        raise ValueError("Use Windows and an absent QA output; preserve previous attempts")
    output.mkdir(parents=True)
    app = output / "app"
    (app / "desktop").mkdir(parents=True)
    owners = ("main.cjs", "owned-lifetime.cjs", "resources.cjs", "private-directory.cjs")
    for name in owners:
        shutil.copyfile(root / "desktop" / name, app / "desktop" / name)
    shutil.copytree(root / "dist", app / "dist")
    (app / "package.json").write_text(
        json.dumps(
            {"name": metadata["name"], "version": metadata["version"], "main": "desktop/main.cjs"}
        ),
        encoding="utf-8",
    )
    identity = output / "RELEASE.json"
    identity.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
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
            str(app / "release"),
            "--workpath",
            str(output / "build"),
            "--specpath",
            str(output),
            "--paths",
            str(root),
            "--add-data",
            str(identity) + ":console",
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
            str(root / "tests/desktop-lifetime/held_service.py"),
        ],
        cwd=root,
        check=True,
        timeout=600,
    )
    if source_metadata(root, metadata["version"]) != metadata or ui_inventory(root / "dist") != ui:
        raise ValueError("QA build source/UI changed during freezing")
    service = app / "release/drone-console-service"
    (service / "RELEASE.json").write_text(
        json.dumps(
            {
                **metadata,
                "service_sha256": digest(service / "drone-console-service.exe"),
                "python_dll_sha256": digest(service / "_internal/python314.dll"),
                "ui_files": ui,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (output / "source.json").write_text(
        json.dumps(
            {
                "source": metadata,
                "scope": "Separate QA held-route service; exact product owner/UI, real Uvicorn. Not an installer transaction.",
                "owner_sha256": {name: digest(app / "desktop" / name) for name in owners},
            },
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
