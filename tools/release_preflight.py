"""Jason Stys: trusted-main, exact-green, new-draft-only Windows delivery. Lines: docs/SOURCE_MAP.md.

No publish, overwrite, clobber, delete, retry or failed-check bypass is provided.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
from collections import Counter
from pathlib import Path

from tools.desktop_contract import configuration, digest, source_metadata

REPOSITORY = "JasonStys/drone-operations-console"
ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
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
ANALYSIS_KEY = ".github/workflows/codeql.yml:analyze"
QUERY_PACKS = {"codeql/javascript-queries": "js/", "codeql/python-queries": "py/"}

if not __debug__:
    raise RuntimeError("Release decisions refuse optimized Python")


def gh(*args):
    """Use the runner's authenticated CLI without a shell; never print credentials or silently retry errors."""
    binary = shutil.which("gh")
    if not binary:
        raise RuntimeError("GitHub CLI missing")
    return subprocess.run(
        [binary, *args], capture_output=True, text=True, encoding="utf-8", timeout=60
    )


def api(path, *, absent_tag=False, sarif=False):
    """Only a specific absent Git tag may return None; authentication/network/provider errors stay errors."""
    headers = ["-H", "X-GitHub-Api-Version: 2022-11-28"]
    if sarif:
        headers += ["-H", "Accept: application/sarif+json"]
    result = gh("api", *headers, path)
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


def processed_codeql(source):
    """Bind actual processed main metadata AND both language SARIF rule packs, not a PR-only check name."""
    analyses = pages(
        f"repos/{REPOSITORY}/code-scanning/analyses?tool_name=CodeQL&ref=refs%2Fheads%2Fmain"
    )
    if any(not isinstance(row, dict) for row in analyses):
        raise ValueError("Unexpected CodeQL analysis record")
    selected = [row for row in analyses if row.get("commit_sha") == source]
    if len(selected) != 1:
        raise ValueError("Exact-source main CodeQL analysis missing or ambiguous")
    analysis = selected[0]
    metadata_tool = analysis.get("tool")
    if not isinstance(metadata_tool, dict) or not isinstance(metadata_tool.get("version"), str):
        raise ValueError("Processed CodeQL tool identity is missing")
    if (
        any(
            analysis.get(field) != expected
            for field, expected in {
                "commit_sha": source,
                "ref": "refs/heads/main",
                "analysis_key": ANALYSIS_KEY,
                "category": ANALYSIS_KEY,
                "error": "",
                "warning": "",
            }.items()
        )
        or type(analysis.get("id")) is not int
        or analysis["id"] < 1
        or type(analysis.get("rules_count")) is not int
        or analysis["rules_count"] < 1
        or type(analysis.get("results_count")) is not int
        or analysis["results_count"] != 0
        or metadata_tool.get("name") != "CodeQL"
        or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", metadata_tool["version"])
    ):
        raise ValueError("Processed main CodeQL metadata is incomplete or nonpassing")
    sarif = api(f"repos/{REPOSITORY}/code-scanning/analyses/{analysis['id']}", sarif=True)
    if not isinstance(sarif, dict):
        raise ValueError("Unexpected processed CodeQL SARIF shape")
    runs = sarif.get("runs")
    if sarif.get("version") != "2.1.0" or not isinstance(runs, list) or len(runs) != 1:
        raise ValueError("Unexpected processed CodeQL SARIF shape")
    run = runs[0]
    if not isinstance(run, dict) or not isinstance(run.get("tool"), dict):
        raise ValueError("Processed CodeQL SARIF run/tool missing")
    tool = run.get("tool", {})
    driver = tool.get("driver", {})
    properties = run.get("properties")
    automation = run.get("automationDetails")
    if (
        not isinstance(driver, dict)
        or not isinstance(properties, dict)
        or not isinstance(automation, dict)
        or not isinstance(properties.get("codeqlConfigSummary"), dict)
    ):
        raise ValueError("Processed CodeQL SARIF source/suite identity is incomplete")
    if (
        driver.get("name") != "CodeQL"
        or driver.get("semanticVersion") != analysis["tool"]["version"]
        or driver.get("rules", []) != []
        or run.get("results") != []
        or automation.get("id") != ANALYSIS_KEY + "/"
        or run.get("versionControlProvenance")
        != [
            {
                "branch": "refs/heads/main",
                "repositoryUri": f"https://github.com/{REPOSITORY}",
                "revisionId": source,
            }
        ]
        or properties["codeqlConfigSummary"].get("queries")
        != [{"type": "builtinSuite", "uses": "security-and-quality"}]
    ):
        raise ValueError("Processed CodeQL SARIF source/suite/result identity disagrees")
    extensions = tool.get("extensions")
    if not isinstance(extensions, list):
        raise ValueError("CodeQL language query packs are missing")
    counts = {}
    names = set()
    for extension in extensions:
        if not isinstance(extension, dict):
            raise ValueError("CodeQL query pack identity is invalid")
        name = extension.get("name")
        rules = extension.get("rules", [])
        if not isinstance(name, str) or name in names or not isinstance(rules, list):
            raise ValueError("CodeQL query pack identity is invalid or ambiguous")
        names.add(name)
        if name in QUERY_PACKS:
            if any(not isinstance(rule, dict) for rule in rules):
                raise ValueError("CodeQL rule record is invalid")
            ids = [rule.get("id") for rule in rules]
            if (
                not ids
                or any(
                    not isinstance(rule, str) or not rule.startswith(QUERY_PACKS[name])
                    for rule in ids
                )
                or len(set(ids)) != len(ids)
            ):
                raise ValueError("CodeQL language rules are empty or ambiguous")
            counts[name] = len(ids)
        elif rules:
            raise ValueError("Unexpected CodeQL rule-bearing query pack")
    if set(counts) != set(QUERY_PACKS) or sum(counts.values()) != analysis["rules_count"]:
        raise ValueError("Both actual CodeQL languages and matching rule counts are required")
    return {
        field: analysis[field]
        for field in (
            "id",
            "commit_sha",
            "ref",
            "analysis_key",
            "category",
            "rules_count",
            "results_count",
            "error",
            "warning",
        )
    } | {
        "language_rule_counts": counts,
        "sarif_results_count": 0,
        "tool_version": analysis["tool"]["version"],
    }


def check_main(root: Path, version: str) -> dict:
    """Require actual main push workflows, processed CodeQL/SARIF and every present check to pass."""
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
    # Only this authenticated manual run is currently executing. Required push checks
    # and every unrelated current check remain subject to the original strict policy.
    checks = [row for row in checks if row not in own_checks]
    counts = Counter(row["name"] for row in checks)
    if any(counts[name] != 1 for name in CHECKS):
        raise ValueError("Required validation or scanner check missing/ambiguous")
    if any(
        row.get("status") != "completed" or row.get("conclusion") != "success"
        for row in checks
        if row["name"] in CHECKS
    ):
        raise ValueError("Required validation or scanner check has not passed")
    aggregate = [row for row in checks if row["name"] == "CodeQL"]
    if len(aggregate) > 1 or any(
        row.get("status") != "completed" or row.get("conclusion") != "success" for row in aggregate
    ):
        raise ValueError("Present CodeQL aggregate check failed or is ambiguous")
    if any(
        row.get("head_sha") != source
        or row.get("status") != "completed"
        or row.get("conclusion") not in {"success", "skipped", "neutral"}
        for row in checks
    ):
        raise ValueError("Additional current-source checks still require review")
    if pages(f"repos/{REPOSITORY}/code-scanning/alerts?state=open&ref=refs%2Fheads%2Fmain"):
        raise ValueError("Open main code-scanning alerts require review")
    analysis = processed_codeql(source)
    return {**metadata, "main_validation_runs": accepted, "main_codeql_analysis": analysis}


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
    notes = (ROOT / "docs" / f"RELEASE_{args.version.replace('.', '_')}.md").read_text(
        encoding="utf-8"
    )
    for report in ("native-lifetime-2026-11-11.md", "native-resource-upgrade-2026-11-11.md"):
        notes = notes.replace(
            f"](reports/{report})",
            f"](https://github.com/{REPOSITORY}/blob/{before['source_commit']}/docs/reports/{report})",
        )
    if re.search(r"\]\((?!https://)[^)]+\)", notes):
        raise ValueError("Release notes must retain absolute source-bound Markdown links")
    sidecar_folder = ROOT / ".runtime/release-sidecars" / args.version
    sidecar_folder.mkdir(parents=True, exist_ok=False)
    sidecar = sidecar_folder / "SHA256SUMS.txt"
    with sidecar.open("x", encoding="ascii", newline="\n") as stream:
        stream.write(value + "  " + installer.name.replace(" ", ".") + "\n")
    notes_path = sidecar_folder / "RELEASE-NOTES.md"
    with notes_path.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(notes)
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
        str(notes_path),
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
