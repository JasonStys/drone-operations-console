"""Jason Stys: actual bounded frozen identity and patched-runtime negative contracts. Lines: docs/SOURCE_MAP.md."""

import json
import os
from pathlib import Path

import pytest

from console import __version__
from console import desktop_identity as identity
from tools import desktop_contract as contract


def valid(monkeypatch):
    """Use an explicit simulated final runtime; core3.12 jobs must never be mistaken for native3.14 builds."""
    monkeypatch.setattr(identity.platform, "python_version", lambda: "3.14.10")
    return {
        "schema_version": 1,
        "name": identity.PRODUCT,
        "version": __version__,
        "source_commit": "a" * 40,
        "source_dirty": False,
        "python_version": "3.14.10",
    }


@pytest.mark.parametrize(
    "value,accepted",
    [
        ("3.14.9", False),
        ("3.14.10", True),
        ("3.14.11", True),
        ("3.14.10rc1", False),
        ("3.12.16", False),
        ("3.15.0", False),
    ],
)
def test_final_native_security_patch_floor(value, accepted):
    """Older cached/prerelease/other-branch runtimes cannot satisfy the actual native contract."""
    assert identity.supported_python(value) is accepted


@pytest.mark.parametrize(
    "field,value",
    [
        ("schema_version", True),
        ("schema_version", 2),
        ("name", "other"),
        ("version", "0.3.0"),
        ("source_dirty", True),
        ("source_dirty", 0),
        ("source_commit", "unbound"),
        ("source_commit", 2),
        ("python_version", None),
        ("python_version", "3.14.9"),
        ("python_version", "3.14.11"),
    ],
)
def test_each_wrong_source_or_runtime_field_is_rejected(tmp_path, monkeypatch, field, value):
    """Each independent one-field fault breaks a real identity file, never private data."""
    record = valid(monkeypatch)
    path = tmp_path / "RELEASE.json"
    path.write_text(json.dumps(record))
    assert identity.read_identity(path) == record
    record[field] = value
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match="mismatch"):
        identity.read_identity(path)


@pytest.mark.parametrize("raw", [b"", b"x" * 4097, b"null", b"[]", b"{}", b"not-json"])
def test_invalid_actual_identity_bytes_do_not_fall_back(tmp_path, monkeypatch, raw):
    """Missing/invalid/oversized identities are launch errors, never development-mode defaults."""
    valid(monkeypatch)
    path = tmp_path / "RELEASE.json"
    path.write_bytes(raw)
    with pytest.raises(ValueError):
        identity.read_identity(path)
    with pytest.raises((OSError, ValueError)):
        identity.read_identity(tmp_path)
    with pytest.raises(FileNotFoundError):
        identity.read_identity(tmp_path / "missing")


def test_complete_product_version_surfaces_agree():
    """Check actual source surfaces rather than only a fake builder response."""
    assert contract.configuration(Path(__file__).resolve().parents[1]) == __version__ == "0.3.1"


@pytest.mark.parametrize("surface", ["project", "package", "lock", "lock-root", "runtime"])
def test_independent_product_surface_faults_refuse_freezing(tmp_path, surface):
    """A single stale product surface cannot produce a coherently labelled package."""
    (tmp_path / "console").mkdir()
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname="drone-operations-console"\nversion="0.3.1"\n'
    )
    for filename, value in [
        ("package.json", {"name": identity.PRODUCT, "version": "0.3.1"}),
        (
            "package-lock.json",
            {"name": identity.PRODUCT, "version": "0.3.1", "packages": {"": {"version": "0.3.1"}}},
        ),
    ]:
        (tmp_path / filename).write_text(json.dumps(value))
    (tmp_path / "console/__init__.py").write_text('__version__ = "0.3.1"\n')
    assert contract.configuration(tmp_path) == "0.3.1"
    filename = {
        "project": "pyproject.toml",
        "package": "package.json",
        "lock": "package-lock.json",
        "lock-root": "package-lock.json",
        "runtime": "console/__init__.py",
    }[surface]
    path = tmp_path / filename
    if surface == "lock-root":
        value = json.loads(path.read_text())
        value["packages"][""]["version"] = "0.3.0"
        path.write_text(json.dumps(value))
    else:
        path.write_text(path.read_text().replace("0.3.1", "0.3.0", 1))
    with pytest.raises(ValueError):
        contract.configuration(tmp_path)


def test_actual_resource_hashing_and_complete_ui_kind_limits(tmp_path):
    """Independent real bytes and SHA expectation guard missing/oversized/nonregular/extra-depth inputs."""
    root = tmp_path / "ui"
    root.mkdir()
    html = root / "index.html"
    html.write_bytes(b"abc")
    assert contract.ui_inventory(root) == {
        "index.html": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    }
    with pytest.raises(ValueError, match="bounded regular"):
        contract.digest(html, cap=2)
    html.write_bytes(b"")
    with pytest.raises(ValueError):
        contract.digest(html)
    with pytest.raises((OSError, ValueError)):
        contract.digest(root)
    empty = tmp_path / "empty-ui"
    empty.mkdir()
    with pytest.raises(ValueError, match="production UI"):
        contract.ui_inventory(empty)


def test_python_identity_growth_is_a_real_error_and_reader_closes(tmp_path, monkeypatch):
    """Extend through a pre-opened writer descriptor after fstat, retaining the bounded real read."""
    record = valid(monkeypatch)
    path = tmp_path / "identity"
    path.write_text(json.dumps(record))
    writer = os.open(path, os.O_WRONLY | os.O_APPEND, 0o600)
    original = identity.os.fstat
    first = True

    def grow(descriptor):
        nonlocal first
        info = original(descriptor)
        if first:
            first = False
            os.write(writer, b" ")
        return info

    monkeypatch.setattr(identity.os, "fstat", grow)
    try:
        with pytest.raises(ValueError, match="changed"):
            identity.read_identity(path)
    finally:
        os.close(writer)


@pytest.mark.parametrize(
    "source,dirty,ci_sha,patch,level,accepted",
    [
        ("a" * 40, "", None, "3.14.10", "final", True),
        ("a" * 40, "", "a" * 40, "3.14.11", "final", True),
        ("not-a-source", "", None, "3.14.10", "final", False),
        ("a" * 40, "?? unknown.txt", None, "3.14.10", "final", False),
        ("a" * 40, " M console/api.py", None, "3.14.10", "final", False),
        ("a" * 40, "", "b" * 40, "3.14.10", "final", False),
        ("a" * 40, "", None, "3.14.6", "final", False),
        ("a" * 40, "", None, "3.15.0", "final", False),
        ("a" * 40, "", None, "3.14.10", "candidate", False),
    ],
)
def test_build_source_and_security_floor_fail_closed(
    tmp_path, monkeypatch, source, dirty, ci_sha, patch, level, accepted
):
    """Each independent source/CI/runtime fault prevents identity creation, including untracked files."""
    from types import SimpleNamespace

    def git(command, *, cwd, text):
        assert cwd == tmp_path and text is True
        assert command[:3] == ["git", "-c", "safe.directory=" + tmp_path.as_posix()]
        if command[3:] == ["rev-parse", "HEAD"]:
            return source + "\n"
        assert command[3:] == ["status", "--porcelain", "--untracked-files=all"]
        return dirty

    monkeypatch.setattr(contract.subprocess, "check_output", git)
    monkeypatch.setattr(contract.platform, "python_version", lambda: patch)
    monkeypatch.setattr(
        contract, "sys", SimpleNamespace(version_info=SimpleNamespace(releaselevel=level))
    )
    if ci_sha is None:
        monkeypatch.delenv("GITHUB_ACTIONS", raising=False)
        monkeypatch.delenv("GITHUB_SHA", raising=False)
    else:
        monkeypatch.setenv("GITHUB_ACTIONS", "true")
        monkeypatch.setenv("GITHUB_SHA", ci_sha)
    if accepted:
        assert contract.source_metadata(tmp_path, "0.3.1") == {
            "schema_version": 1,
            "name": identity.PRODUCT,
            "version": "0.3.1",
            "source_commit": source,
            "source_dirty": False,
            "python_version": patch,
        }
    else:
        with pytest.raises(ValueError):
            contract.source_metadata(tmp_path, "0.3.1")
