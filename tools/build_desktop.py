"""Jason Stys: reproducible frozen Windows service build. Functions/variables: docs/SOURCE_MAP.md."""

import json
import shutil
import subprocess
import sys
from importlib.metadata import distribution
from pathlib import Path


def main():
    """Bundle the real replay/API service; do not package runtime accounts or MAVSDK/PX4."""
    from tools.desktop_contract import configuration, digest, source_metadata, ui_inventory

    root = Path(__file__).resolve().parents[1]
    if sys.platform != "win32":
        raise ValueError("This installer contract currently supports Windows only")
    metadata = source_metadata(root, configuration(root))
    ui = ui_inventory(root / "dist")
    generated = root / ".runtime/desktop-metadata"
    generated.mkdir(parents=True, exist_ok=True)
    identity = generated / "RELEASE.json"
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
            "release",
            "--workpath",
            "build/desktop",
            "--specpath",
            "build",
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
            "tools/desktop_entry.py",
        ],
        cwd=root,
        check=True,
        timeout=600,
    )
    if source_metadata(root, configuration(root)) != metadata or ui_inventory(root / "dist") != ui:
        raise ValueError("Source/UI identity changed during freezing")
    bundle = root / "release/drone-console-service"
    if digest(bundle / "_internal/python314.dll") != digest(
        Path(sys.base_prefix) / "python314.dll"
    ):
        raise ValueError("Frozen Python DLL does not match the actual patched build SDK")
    outer = {
        **metadata,
        "service_sha256": digest(bundle / "drone-console-service.exe"),
        "python_dll_sha256": digest(bundle / "_internal/python314.dll"),
        "ui_files": ui,
    }
    (bundle / "RELEASE.json").write_text(json.dumps(outer, indent=2), encoding="utf-8")
    # Retain verbatim upstream Python/PyInstaller notices alongside authored MIT terms.
    shutil.copyfile(Path(sys.base_prefix) / "LICENSE.txt", bundle / "PYTHON_LICENSE.txt")
    installer = distribution("pyinstaller")
    notices = [
        installer.locate_file(item)
        for item in installer.files or []
        if str(item).endswith("licenses/COPYING.txt")
    ]
    if len(notices) != 1:
        raise ValueError("Exact PyInstaller runtime notice missing")
    shutil.copyfile(notices[0], bundle / "PYINSTALLER_LICENSE.txt")
    shutil.copyfile(root / "LICENSE", bundle / "AUTHORED_LICENSE.txt")


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    main()
