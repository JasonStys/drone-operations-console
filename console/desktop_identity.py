"""Jason Stys: bounded, exact frozen source/version identity before private service startup. Lines: docs/SOURCE_MAP.md."""

import json
import os
import platform
import re
import stat
from pathlib import Path

from console import __version__

PRODUCT = "drone-operations-console"
FIELDS = {"schema_version", "name", "version", "source_commit", "source_dirty", "python_version"}


def supported_python(version: str) -> bool:
    """Freeze only final3.14 security-patched runtimes, with the reviewed3.14.10 minimum."""
    match = re.fullmatch(r"3\.14\.([0-9]+)", version)
    return match is not None and int(match[1]) >= 10


def read_identity(path: Path) -> dict:
    """Read one bounded regular descriptor and refuse stale/dirty/incoherent frozen identities."""
    descriptor = os.open(
        path, os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NONBLOCK", 0)
    )
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or not 0 < info.st_size <= 4096:
            raise ValueError("Expected bounded regular desktop identity")
        raw = stream.read(min(info.st_size + 1, 4097))
    if len(raw) != info.st_size:
        raise ValueError("Desktop identity changed while reading")
    value = json.loads(raw)
    if (
        not isinstance(value, dict)
        or set(value) != FIELDS
        or type(value.get("schema_version")) is not int
        or value["schema_version"] != 1
        or value.get("name") != PRODUCT
        or value.get("version") != __version__
        or value.get("source_dirty") is not False
        or not isinstance(value.get("source_commit"), str)
        or not re.fullmatch(r"[a-f0-9]{40}", value["source_commit"])
        or not isinstance(value.get("python_version"), str)
        or not supported_python(value["python_version"])
        or value["python_version"] != platform.python_version()
    ):
        raise ValueError("Desktop source/runtime identity mismatch")
    return value
