"""Jason Stys: prepare exact hosted-only PX4 build tools without mutable APT setup.

Functions, parameters and variables: docs/SOURCE_MAP.md. This never starts a vehicle;
the unchanged real PX4 build and authenticated MAVSDK acceptance remain mandatory.
"""

import hashlib
import os
import platform
import shutil
import stat
import subprocess
import tarfile
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

import httpx

ROOT = Path(__file__).resolve().parents[1]
EIGEN_SOURCE = "3147391d946bb4b6c68edd901f2add6ac1f31f8c"
DOWNLOADS = {
    "cmake.tar.gz": (
        "https://github.com/Kitware/CMake/releases/download/v3.31.12/cmake-3.31.12-linux-x86_64.tar.gz",
        55_005_786,
        "0dc2e9a6860f06bf10bd8fadc03e35d9eeb4df46e33763a7e480e987758f385c",
    ),
    "ninja.zip": (
        "https://github.com/ninja-build/ninja/releases/download/v1.13.2/ninja-linux.zip",
        134_040,
        "5749cbc4e668273514150a80e387a957f933c6ed3f5f11e03fb30955e2bbead6",
    ),
}


def download(root: Path, name: str) -> Path:
    """Stream only fixed vendor assets, enforcing provider size/digest before extraction."""
    url, size, expected = DOWNLOADS[name]
    target = root / name
    digest = hashlib.sha256()
    count = 0
    with (
        httpx.stream("GET", url, follow_redirects=True, timeout=30, trust_env=False) as response,
        target.open("xb") as output,
    ):
        response.raise_for_status()
        for chunk in response.iter_bytes(65_536):
            count += len(chunk)
            if count > size:
                raise ValueError("Vendor tool exceeds its pinned byte count")
            digest.update(chunk)
            output.write(chunk)
    if count != size or digest.hexdigest() != expected:
        raise ValueError("Vendor tool size or provider SHA256 differs")
    return target


def extract_cmake(archive: Path, destination: Path) -> Path:
    """Apply actual entry/expanded budgets and the standard data filter in a fresh owned tree."""
    if destination.exists():
        raise ValueError("Build-tool extraction must be new")
    with tarfile.open(archive, "r:gz") as package:
        entries = package.getmembers()
        names = [entry.name for entry in entries]
        if (
            not entries
            or len(entries) > 32_768
            or len(names) != len(set(names))
            or sum(entry.size for entry in entries) > 512 * 1024 * 1024
        ):
            raise ValueError("Vendor archive member/expanded budget is invalid")
        for entry in entries:
            parts = PurePosixPath(entry.name)
            if (
                parts.is_absolute()
                or ".." in parts.parts
                or "\\" in entry.name
                or entry.size > 64 * 1024 * 1024
                or not (entry.isfile() or entry.isdir() or entry.issym() or entry.islnk())
            ):
                raise ValueError("Unsupported vendor archive member")
            tarfile.data_filter(entry, destination)
        destination.mkdir()
        package.extractall(destination, members=entries, filter="data")
    binary = destination / "cmake-3.31.12-linux-x86_64/bin/cmake"
    if not binary.is_file():
        raise ValueError("The fixed CMake executable is absent")
    return binary


def extract_ninja(archive: Path, destination: Path) -> Path:
    """Extract only the exact bounded regular Ninja executable without ZIP path traversal."""
    if destination.exists():
        raise ValueError("Ninja extraction must be new")
    with ZipFile(archive) as package:
        entries = package.infolist()
        if len(entries) != 1 or entries[0].filename != "ninja":
            raise ValueError("Unexpected Ninja payload inventory")
        item = entries[0]
        if (
            item.file_size > 2 * 1024 * 1024
            or item.flag_bits & 1
            or stat.S_ISLNK(item.external_attr >> 16)
        ):
            raise ValueError("Unsupported Ninja executable")
        with package.open(item) as source:
            raw = source.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024 or len(raw) != item.file_size:
            raise ValueError("Ninja exceeded its actual byte budget")
    destination.mkdir()
    binary = destination / "ninja"
    with binary.open("xb") as output:
        output.write(raw)
    binary.chmod(0o755)
    return binary


def checked(args: list[str], *, text: str | None = None, timeout: int = 30) -> str:
    """Run a fixed trusted tool with finite completion; nonzero status is never ignored."""
    return subprocess.run(
        args, input=text, text=True, capture_output=True, check=True, timeout=timeout
    ).stdout.strip()


def main() -> None:
    """Prove actual host tools/header behavior, then expose only job-local build-tool paths."""
    if (
        os.environ.get("GITHUB_ACTIONS") != "true"
        or os.environ.get("RUNNER_OS") != "Linux"
        or platform.machine() != "x86_64"
        or 'VERSION_ID="24.04"' not in Path("/etc/os-release").read_text()
    ):
        raise RuntimeError("This setup is only for the declared disposable Ubuntu 24.04 CI host")
    root = ROOT / ".runtime/px4-build-tools"
    if root.exists():
        raise ValueError("Preserve pre-existing tool staging; choose a fresh CI job")
    eigen = ROOT / ".runtime/eigen"
    if (
        checked(
            ["git", "-c", "safe.directory=" + str(eigen), "-C", str(eigen), "rev-parse", "HEAD"]
        )
        != EIGEN_SOURCE
    ):
        raise ValueError(
            "Eigen source differs from the independently verified upstream 3.4.0 commit"
        )
    compiler, make, bc = [shutil.which(name) for name in ("g++", "make", "bc")]
    if not compiler or not make or not bc:
        raise RuntimeError("A real hosted GNU compiler/make/bc is required; none is substituted")
    checked([compiler, "--version"])
    checked([make, "--version"])
    if checked([bc], text="2*3\n") != "6":
        raise RuntimeError("Actual bc arithmetic failed")
    root.mkdir()
    cmake = extract_cmake(download(root, "cmake.tar.gz"), root / "cmake")
    ninja = extract_ninja(download(root, "ninja.zip"), root / "ninja")
    if (
        checked([str(cmake), "--version"]).splitlines()[0] != "cmake version 3.31.12"
        or checked([str(ninja), "--version"]) != "1.13.2"
    ):
        raise ValueError("Actual tool version differs from the fixed release")
    prefix = root / "prefix"
    checked(
        [
            str(cmake),
            "-S",
            str(eigen),
            "-B",
            str(root / "eigen-build"),
            "-DBUILD_TESTING=OFF",
            "-DEIGEN_BUILD_PKGCONFIG=OFF",
            "-DCMAKE_INSTALL_PREFIX=" + str(prefix),
        ],
        timeout=90,
    )
    checked([str(cmake), "--install", str(root / "eigen-build")], timeout=90)
    probe = root / "eigen_probe.cpp"
    probe.write_text(
        "#include <Eigen/Core>\nint main(){ Eigen::Vector2i v(2,3); return v.dot(v)==13 ? 0 : 1; }\n"
    )
    executable = root / "eigen_probe"
    checked(
        [
            compiler,
            "-std=c++17",
            "-I" + str(prefix / "include/eigen3"),
            str(probe),
            "-o",
            str(executable),
        ]
    )
    checked([str(executable)])
    # These are CI-provided command files, never arbitrary account/store paths.
    with Path(os.environ["GITHUB_PATH"]).open("a") as output:
        output.write(str(cmake.parent) + "\n" + str(ninja.parent) + "\n")
    with Path(os.environ["GITHUB_ENV"]).open("a") as output:
        output.write(
            "CMAKE_PREFIX_PATH="
            + str(prefix)
            + "\nCPLUS_INCLUDE_PATH="
            + str(prefix / "include/eigen3")
            + "\n"
        )
    print(
        "Exact CMake 3.31.12/Ninja 1.13.2 + original GNU tools + real Eigen 3.4.0 compiled dot-product passed; original PX4 build/acceptance remain required."
    )


if __name__ == "__main__":
    main()
