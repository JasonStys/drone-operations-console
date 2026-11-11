"""Jason Stys: coherent exact-source Windows desktop build identity and bounded resources. Lines: docs/SOURCE_MAP.md."""

import ast
import hashlib
import json
import os
import platform
import re
import stat
import subprocess
import sys
import tomllib
from pathlib import Path

from console.desktop_identity import PRODUCT, supported_python


def configuration(root: Path) -> str:
    """Every product/runtime/npm surface must agree before a service is frozen."""
    project = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    package = json.loads((root / "package.json").read_text(encoding="utf-8"))
    lock = json.loads((root / "package-lock.json").read_text(encoding="utf-8"))
    version = project["version"]
    declarations = ast.parse((root / "console/__init__.py").read_text(encoding="utf-8"))
    runtime = [
        ast.literal_eval(node.value)
        for node in declarations.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "__version__" for target in node.targets
        )
    ]
    if (
        not isinstance(version, str)
        or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version)
        or not project["name"] == package["name"] == lock["name"] == PRODUCT
        or not version == package["version"] == lock["version"] == lock["packages"][""]["version"]
        or runtime != [version]
    ):
        raise ValueError("Desktop product/version surfaces disagree")
    if package.get("build", {}).get("extraResources") != [
        {"from": "dist", "to": "runtime/${version}/ui"},
        {"from": "release/drone-console-service", "to": "runtime/${version}/service"},
    ]:
        raise ValueError("Desktop resource destinations must use the exact version macro")
    return version


def source_metadata(root: Path, version: str) -> dict:
    """Allow clean candidates; hosted checkout SHA must match, and releases separately require green main."""
    command = ["git", "-c", "safe.directory=" + root.as_posix()]
    source = subprocess.check_output([*command, "rev-parse", "HEAD"], cwd=root, text=True).strip()
    dirty = subprocess.check_output(
        [*command, "status", "--porcelain", "--untracked-files=all"], cwd=root, text=True
    )
    if not re.fullmatch(r"[a-f0-9]{40}", source) or dirty:
        raise ValueError("A clean exact source checkout is required")
    if os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("GITHUB_SHA") != source:
        raise ValueError("CI checkout source identity mismatch")
    if sys.version_info.releaselevel != "final" or not supported_python(platform.python_version()):
        raise ValueError("Desktop build requires final Python3.14.10 or a later3.14 security patch")
    return {
        "schema_version": 1,
        "name": PRODUCT,
        "version": version,
        "source_commit": source,
        "source_dirty": False,
        "python_version": platform.python_version(),
    }


def digest(path: Path, *, cap: int = 64 * 1024 * 1024) -> str:
    """Hash the actual opened regular file with a fixed total budget and growth/truncation checks."""
    descriptor = os.open(
        path, os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NONBLOCK", 0)
    )
    value = hashlib.sha256()
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or not 0 < info.st_size <= cap:
            raise ValueError("Expected a bounded regular desktop resource")
        size = 0
        while block := stream.read(min(65536, cap + 1 - size)):
            size += len(block)
            if size > cap:
                raise ValueError("Desktop resource grew beyond its budget")
            value.update(block)
    if size != info.st_size:
        raise ValueError("Desktop resource changed while hashing")
    return value.hexdigest()


def ui_inventory(root: Path) -> dict:
    """Record the complete small compiled UI, rejecting links/foreign path forms rather than silently skipping."""
    entries = {}
    pending = [(root, 0)]
    visited = 0
    while pending:
        directory, depth = pending.pop()
        if directory.is_symlink() or directory.is_junction() or depth > 8:
            raise ValueError("UI resources must be bounded real directories")
        for path in directory.iterdir():
            visited += 1
            if visited > 256 or path.is_symlink() or path.is_junction():
                raise ValueError("UI resources must not be aliases or exceed their count")
            if path.is_dir():
                pending.append((path, depth + 1))
                continue
            relative = path.relative_to(root).as_posix()
            if len(entries) >= 128 or not re.fullmatch(r"[A-Za-z0-9_./-]+", relative):
                raise ValueError("Unexpected UI resource inventory")
            entries[relative] = digest(path, cap=4 * 1024 * 1024)
    if "index.html" not in entries:
        raise ValueError("Build the complete production UI first")
    return entries
