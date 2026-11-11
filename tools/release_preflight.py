"""Jason Stys: trusted-main, exact-green, new-draft-only Windows delivery. Lines: docs/SOURCE_MAP.md.

No publish, overwrite, clobber, delete, retry or failed-check bypass is provided.
"""

import argparse
import json
import os
import shutil
import subprocess
from collections import Counter
from pathlib import Path

from tools.desktop_contract import configuration, digest, source_metadata

REPOSITORY = "JasonStys/drone-operations-console"
ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
    "CodeQL",
    "analyze",
    "Core / ubuntu-24.04 / 3.12",
    "Core / ubuntu-24.04 / 3.14",
    "Core / windows-latest / 3.14",
    "Core / macos-latest / 3.14",
    "Real service / three browser engines",
    "Actual Windows package / private account / animation / restart",
    "Native PostgreSQL / concurrent idempotency",
    "Actual PX4 SIH / native MAVSDK / API evidence",
    "Non-root image / real service smoke",
}

if not __debug__:
    raise RuntimeError("Release decisions refuse optimized Python")


def gh(*args):
    """Use the runner's authenticated CLI without a shell; never print credentials or silently retry errors."""
    binary = shutil.which("gh")
    if not binary:
        raise RuntimeError("GitHub CLI missing")
    return subprocess.run([binary, *args], capture_output=True, text=True, timeout=60)


def api(path, *, absent_tag=False):
    """Only a specific absent Git tag may return None; authentication/network/provider errors stay errors."""
    result = gh("api", "-H", "X-GitHub-Api-Version: 2022-11-28", path)
    if result.returncode:
        if (
            absent_tag
            and path.startswith(f"repos/{REPOSITORY}/git/ref/tags/v")
            and "(HTTP 404)" in result.stderr
        ):
            body = json.loads(result.stdout)
            if body.get("message") == "Not Found":
                return None
        raise RuntimeError("GitHub API request failed: " + path)
    return json.loads(result.stdout)


def pages(path, key=None):
    """Require a complete bounded provider list; cap exhaustion is never an absence result."""
    rows = []
    for page in range(1, 4):
        value = api(path + ("&" if "?" in path else "?") + f"per_page=100&page={page}")
        batch = value[key] if key else value
        if not isinstance(batch, list):
            raise ValueError("Unexpected GitHub list")
        rows.extend(batch)
        if len(batch) < 100:
            return rows
    raise ValueError("GitHub list exceeded reviewed complete-page bound")


def check_main(root: Path, version: str) -> dict:
    """Require actual main push workflows AND aggregate CodeQL checks, not scanner-job success alone."""
    if (
        os.environ.get("GITHUB_ACTIONS") != "true"
        or os.environ.get("GITHUB_EVENT_NAME") != "workflow_dispatch"
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
        or os.environ.get("GITHUB_REPOSITORY") != REPOSITORY
        or version != configuration(root)
    ):
        raise ValueError("Only the trusted main manual version can assemble a release")
    metadata = source_metadata(root, version)
    source = metadata["source_commit"]
    if api(f"repos/{REPOSITORY}/commits/main")["sha"] != source:
        raise ValueError("Checkout is no longer current main")
    own_run_id = os.environ.get("GITHUB_RUN_ID", "")
    if not own_run_id.isascii() or not own_run_id.isdecimal() or int(own_run_id) < 1:
        raise ValueError("Actual manual release run identity required")
    own_run = api(f"repos/{REPOSITORY}/actions/runs/{own_run_id}")
    if (
        any(
            own_run.get(field) != value
            for field, value in {
                "id": int(own_run_id),
                "path": ".github/workflows/desktop-release.yml",
                "event": "workflow_dispatch",
                "head_branch": "main",
                "head_sha": source,
                "status": "in_progress",
                "conclusion": None,
            }.items()
        )
        or type(own_run.get("check_suite_id")) is not int
        or own_run["check_suite_id"] < 1
    ):
        raise ValueError("Actual manual release run source/context mismatch")
    runs = pages(f"repos/{REPOSITORY}/actions/runs?head_sha={source}&event=push", "workflow_runs")
    expected = {
        "Validation": ".github/workflows/validate.yml",
        "CodeQL": ".github/workflows/codeql.yml",
    }
    accepted = []
    for name, workflow in expected.items():
        selected = [row for row in runs if row["name"] == name]
        if len(selected) != 1 or any(
            row.get(field) != value
            for row in selected
            for field, value in {
                "path": workflow,
                "event": "push",
                "head_branch": "main",
                "head_sha": source,
                "status": "completed",
                "conclusion": "success",
            }.items()
        ):
            raise ValueError("Missing, ambiguous or unsuccessful main workflow: " + name)
        accepted.append(selected[0]["id"])
    checks = pages(f"repos/{REPOSITORY}/commits/{source}/check-runs?filter=latest", "check_runs")
    own_checks = [
        row for row in checks if row.get("check_suite", {}).get("id") == own_run["check_suite_id"]
    ]
    if len(own_checks) != 1 or any(
        own_checks[0].get(field) != value
        for field, value in {
            "name": "release",
            "head_sha": source,
            "status": "in_progress",
            "conclusion": None,
        }.items()
    ):
        raise ValueError("Exact owned active release check missing or ambiguous")
    # Only this authenticated manual run is currently executing. Required push/aggregate
    # and every unrelated current check remain subject to the original strict policy.
    checks = [row for row in checks if row not in own_checks]
    counts = Counter(row["name"] for row in checks)
    if any(counts[name] != 1 for name in CHECKS):
        raise ValueError("Required validation or aggregate check missing/ambiguous")
    if any(
        row.get("status") != "completed" or row.get("conclusion") != "success"
        for row in checks
        if row["name"] in CHECKS
    ):
        raise ValueError("Required validation or aggregate check has not passed")
    if any(
        row.get("head_sha") != source
        or row.get("status") != "completed"
        or row.get("conclusion") not in {"success", "skipped", "neutral"}
        for row in checks
    ):
        raise ValueError("Additional current-source checks still require review")
    if pages(f"repos/{REPOSITORY}/code-scanning/alerts?state=open&ref=refs%2Fheads%2Fmain"):
        raise ValueError("Open main code-scanning alerts require review")
    return {**metadata, "main_validation_runs": accepted}


def require_absent(version):
    """Existing published/draft releases or tags are immutable inputs, never replacement targets."""
    tag = "v" + version
    if api(f"repos/{REPOSITORY}/git/ref/tags/{tag}", absent_tag=True) is not None:
        raise ValueError("Release tag already exists")
    if any(row.get("tag_name") == tag for row in pages(f"repos/{REPOSITORY}/releases")):
        raise ValueError("Published or draft release already exists")


def main(argv=None):
    """Prepare is read-only; explicit draft mode uploads only the new tested installer and checksum."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "draft"))
    parser.add_argument("--version", required=True)
    args = parser.parse_args(argv)
    before = check_main(ROOT, args.version)
    require_absent(args.version)
    if args.mode == "prepare":
        print(json.dumps(before))
        return
    installer = ROOT / f"release/installers/Drone Operations Console Setup {args.version}.exe"
    value = digest(installer, cap=512 * 1024 * 1024)
    sidecar_folder = ROOT / ".runtime/release-sidecars" / args.version
    sidecar_folder.mkdir(parents=True, exist_ok=False)
    sidecar = sidecar_folder / "SHA256SUMS.txt"
    with sidecar.open("x", encoding="ascii", newline="\n") as stream:
        stream.write(value + "  " + installer.name.replace(" ", ".") + "\n")
    result = gh(
        "release",
        "create",
        "v" + args.version,
        str(installer),
        str(sidecar),
        "--repo",
        REPOSITORY,
        "--draft",
        "--target",
        before["source_commit"],
        "--title",
        "Drone Operations Console " + args.version,
        "--notes-file",
        str(ROOT / "docs/RELEASE_0_3_1.md"),
    )
    if result.returncode:
        raise RuntimeError("New draft assembly failed; previous releases were not changed")
    rows = [
        row
        for row in pages(f"repos/{REPOSITORY}/releases")
        if row.get("tag_name") == "v" + args.version
    ]
    if (
        len(rows) != 1
        or type(rows[0].get("id")) is not int
        or rows[0]["id"] < 1
        or rows[0].get("draft") is not True
        or rows[0].get("prerelease") is not False
        or rows[0].get("target_commitish") != before["source_commit"]
    ):
        raise ValueError("New draft source/state mismatch; manual review required")
    asset_rows = api(f"repos/{REPOSITORY}/releases/{rows[0]['id']}/assets")
    assets = {row["name"]: row for row in asset_rows}
    expected = {installer.name.replace(" ", "."): value, sidecar.name: digest(sidecar)}
    if (
        len(asset_rows) != 2
        or set(assets) != set(expected)
        or any(
            assets[name].get("digest") != "sha256:" + sha or assets[name].get("state") != "uploaded"
            for name, sha in expected.items()
        )
    ):
        raise ValueError("Draft assets did not verify; no publication performed")
    if check_main(ROOT, args.version) != before:
        raise ValueError("Main proof changed while assembling the draft")
    print(
        json.dumps(
            {"draft_id": rows[0]["id"], "source": before, "assets": expected, "published": False}
        )
    )


if __name__ == "__main__":
    main()
