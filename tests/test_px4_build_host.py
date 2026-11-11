"""Jason Stys: actual vendor archive budgets and original PX4 workflow cannot fail open.

Functions, parameters and variables: docs/SOURCE_MAP.md. Inert local fixtures exercise
setup boundaries; they do not replace the mandatory actual hosted PX4/MAVSDK journey.
"""

import gzip
import hashlib
import io
import tarfile
from pathlib import Path
from zipfile import ZipFile

import pytest

from tools import px4_build_host as host


def tar_fixture(
    path: Path, name: str, *, kind: bytes = tarfile.REGTYPE, link: str = "", size: int | None = None
) -> Path:
    """Write genuine tiny archive headers independently of the production extraction path."""
    with tarfile.open(path, "w:gz") as archive:
        item = tarfile.TarInfo(name)
        item.type = kind
        item.linkname = link
        item.mode = 0o755
        item.size = len(b"inert vendor fixture") if size is None else size
        archive.addfile(
            item,
            io.BytesIO(b"inert vendor fixture")
            if kind == tarfile.REGTYPE and size is None
            else None,
        )
    return path


def test_real_vendor_tar_roundtrip_and_existing_tree_refusal(tmp_path):
    """Exact known layout is admitted, while an already-owned output remains unchanged."""
    path = tar_fixture(tmp_path / "inert.tgz", "cmake-3.31.12-linux-x86_64/bin/cmake")
    target = tmp_path / "new"
    assert host.extract_cmake(path, target).read_bytes() == b"inert vendor fixture"
    with pytest.raises(ValueError, match="must be new"):
        host.extract_cmake(path, target)


@pytest.mark.parametrize(
    "name,kind,link",
    [
        ("../outside", tarfile.REGTYPE, ""),
        ("/outside", tarfile.REGTYPE, ""),
        ("bad\\outside", tarfile.REGTYPE, ""),
        ("device", tarfile.CHRTYPE, ""),
        ("link", tarfile.SYMTYPE, "../../outside"),
    ],
)
def test_real_tar_unsafe_members_refused_before_target(tmp_path, name, kind, link):
    """Traversal, devices and escaping symlinks cannot become extracted setup inputs."""
    outside = tmp_path / "outside"
    outside.write_bytes(b"preserved")
    archive = tar_fixture(tmp_path / "inert.tgz", name, kind=kind, link=link)
    target = tmp_path / "new"
    with pytest.raises((ValueError, tarfile.FilterError)):
        host.extract_cmake(archive, target)
    assert not target.exists() and outside.read_bytes() == b"preserved"


def test_large_declared_tar_member_refused(tmp_path):
    """A genuine compressed over-budget member is refused; construction is not the failure oracle."""
    archive = tmp_path / "oversized.tgz"
    item = tarfile.TarInfo("oversized")
    item.size = 64 * 1024 * 1024 + 1
    with gzip.open(archive, "wb") as output:
        output.write(item.tobuf())
        remaining = item.size
        block = b"\0" * 65_536
        while remaining:
            count = min(remaining, len(block))
            output.write(block[:count])
            remaining -= count
        output.write(b"\0" * ((-item.size) % 512 + 1024))
    with pytest.raises(ValueError, match="Unsupported vendor archive member"):
        host.extract_cmake(archive, tmp_path / "new")
    assert not (tmp_path / "new").exists()


@pytest.mark.parametrize(
    "expected_size,expected_hash",
    [
        (7, hashlib.sha256(b"fixture").hexdigest()),
        (6, hashlib.sha256(b"fixture").hexdigest()),
        (8, hashlib.sha256(b"fixture").hexdigest()),
        (7, hashlib.sha256(b"different").hexdigest()),
    ],
)
def test_download_enforces_actual_provider_size_and_hash(
    tmp_path, monkeypatch, expected_size, expected_hash
):
    """Independent inert chunks exercise the actual transfer gate; no network result is presumed."""

    class Response:
        """An inert source with ordinary context/stream semantics, never a compiler substitute."""

        def __enter__(self):
            """Retain the synthetic response for the real streaming reader."""
            return self

        def __exit__(self, *_):
            """No external resource is owned by this fixture."""

        def raise_for_status(self):
            """Supply a successful transport so only byte/hash policy decides the outcome."""

        def iter_bytes(self, _):
            """Separate real chunks prevent assuming one read equals a complete download."""
            yield b"fix"
            yield b"ture"

    monkeypatch.setattr(host.httpx, "stream", lambda *args, **kwargs: Response())
    monkeypatch.setattr(
        host,
        "DOWNLOADS",
        {"inert": ("https://github.com/owner/inert", expected_size, expected_hash)},
    )
    if expected_size == 7 and expected_hash == hashlib.sha256(b"fixture").hexdigest():
        assert host.download(tmp_path, "inert").read_bytes() == b"fixture"
    else:
        with pytest.raises(ValueError):
            host.download(tmp_path, "inert")


def test_non_ci_host_is_refused_before_setup(monkeypatch):
    """Ordinary PC invocation cannot run a hosted Linux setup or modify system tools."""
    monkeypatch.delenv("GITHUB_ACTIONS", raising=False)
    with pytest.raises(RuntimeError, match="disposable Ubuntu"):
        host.main()


def test_ninja_actual_zip_inventory_and_no_overwrite(tmp_path):
    """The only permitted member is a bounded fixed executable; existing trees are preserved."""
    archive = tmp_path / "ninja.zip"
    with ZipFile(archive, "w") as package:
        package.writestr("ninja", b"inert executable fixture")
    target = tmp_path / "new"
    assert host.extract_ninja(archive, target).read_bytes() == b"inert executable fixture"
    with pytest.raises(ValueError, match="must be new"):
        host.extract_ninja(archive, target)


@pytest.mark.parametrize("name", ["../ninja", "unexpected/ninja", "/ninja"])
def test_ninja_unknown_or_traversing_member_rejected(tmp_path, name):
    """ZIP member paths do not select a filesystem destination."""
    archive = tmp_path / "ninja.zip"
    with ZipFile(archive, "w") as package:
        package.writestr(name, b"inert")
    with pytest.raises(ValueError):
        host.extract_ninja(archive, tmp_path / "new")


def test_actual_native_workflow_keeps_original_real_source_build_and_acceptance():
    """The setup correction must precede, never replace, actual source compilation and service evidence."""
    workflow = (host.ROOT / ".github/workflows/validate.yml").read_text()
    native = workflow.split("  native:\n", 1)[1].split("\n  container:", 1)[0]
    assert "timeout-minutes: 35" in native and "timeout-minutes: 5" in native
    assert "ref: d6f12ad1c4f70ad3230afd7d86e971421e02fef4" in native
    assert "repository: eigen-mirror/eigen" in native and f"ref: {host.EIGEN_SOURCE}" in native
    assert "python tools/px4_build_host.py" in native
    assert "make -C .runtime/px4 px4_sitl_default -j2" in native
    assert "python tools/native_acceptance.py" in native
    assert "--require-hashes -r requirements-sitl.lock" in native
    assert (
        native.index("px4_build_host.py")
        < native.index("px4_sitl_default")
        < native.index("native_acceptance.py")
    )
    assert not any(
        value in native for value in ("apt-get", "continue-on-error", "|| true", "--privileged")
    )
