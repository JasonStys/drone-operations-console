"""Jason Stys: source-green/aggregate/main/draft-only failure-sensitive delivery contracts. Lines: docs/SOURCE_MAP.md."""

import copy
import hashlib
import json
from types import SimpleNamespace

import pytest

from tools import release_preflight as gate

SOURCE = "a" * 40


@pytest.fixture
def provider(monkeypatch, tmp_path):
    """Explicit synthetic CI/Git/provider records exercise guard decisions without network or release writes."""
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "workflow_dispatch")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/main")
    monkeypatch.setenv("GITHUB_REPOSITORY", gate.REPOSITORY)
    monkeypatch.setenv("GITHUB_SHA", SOURCE)
    monkeypatch.setenv("GITHUB_RUN_ID", "900")
    monkeypatch.setattr(gate, "configuration", lambda _root: "0.3.1")
    metadata = {"source_commit": SOURCE, "version": "0.3.1", "source_dirty": False}
    monkeypatch.setattr(gate, "source_metadata", lambda _root, _version: dict(metadata))
    runs = [
        {
            "id": index + 1,
            "name": name,
            "path": path,
            "event": "push",
            "head_branch": "main",
            "head_sha": SOURCE,
            "status": "completed",
            "conclusion": "success",
        }
        for index, (name, path) in enumerate(
            (
                ("Validation", ".github/workflows/validate.yml"),
                ("CodeQL", ".github/workflows/codeql.yml"),
            )
        )
    ]
    checks = [
        {"name": name, "head_sha": SOURCE, "status": "completed", "conclusion": "success"}
        for name in sorted(gate.CHECKS)
    ]
    checks.append(
        {
            "name": "release",
            "head_sha": SOURCE,
            "status": "in_progress",
            "conclusion": None,
            "check_suite": {"id": 901},
        }
    )
    state = {
        "main": SOURCE,
        "runs": runs,
        "checks": checks,
        "alerts": [],
        "calls": [],
        "releases": [],
        "tag": None,
        "own_run": {
            "id": 900,
            "path": ".github/workflows/desktop-release.yml",
            "event": "workflow_dispatch",
            "head_branch": "main",
            "head_sha": SOURCE,
            "status": "in_progress",
            "conclusion": None,
            "check_suite_id": 901,
        },
    }

    def api(path, **_kwargs):
        state["calls"].append(path)
        assert path.startswith("repos/" + gate.REPOSITORY + "/")
        if path.endswith("/commits/main"):
            return {"sha": state["main"]}
        if "/actions/runs?" in path:
            return {"workflow_runs": copy.deepcopy(state["runs"])}
        if path.endswith("/actions/runs/900"):
            return copy.deepcopy(state["own_run"])
        if "/check-runs?" in path:
            return {"check_runs": copy.deepcopy(state["checks"])}
        if "/code-scanning/alerts?" in path:
            return copy.deepcopy(state["alerts"])
        if "/git/ref/tags/" in path:
            return state["tag"]
        if "/releases?" in path:
            return copy.deepcopy(state["releases"])
        raise AssertionError(path)

    monkeypatch.setattr(gate, "api", api)
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs/RELEASE_0_3_1.md").write_text(
        "# Source notes\n[Validation](reports/native-lifetime-2026-11-11.md)\n", encoding="utf-8"
    )
    return state, tmp_path


def test_actual_required_source_and_aggregate_set_is_explicit(provider):
    """A scanner job alone cannot stand in for the independently processed CodeQL check."""
    state, root = provider
    result = gate.check_main(root, "0.3.1")
    assert result["source_commit"] == SOURCE and result["main_validation_runs"] == [1, 2]
    assert {"CodeQL", "analyze"} <= gate.CHECKS and len(gate.CHECKS) == 11
    assert any(
        "code-scanning/alerts?state=open&ref=refs%2Fheads%2Fmain" in path for path in state["calls"]
    )


@pytest.mark.parametrize(
    "variable,value",
    [
        ("GITHUB_ACTIONS", "false"),
        ("GITHUB_EVENT_NAME", "pull_request"),
        ("GITHUB_REF", "refs/heads/unreviewed"),
        ("GITHUB_REPOSITORY", "other/repository"),
    ],
)
def test_untrusted_context_fails_before_provider_calls(provider, monkeypatch, variable, value):
    """Unreviewed refs/events cannot reach any upload or even read-side release preparation."""
    state, root = provider
    monkeypatch.setenv(variable, value)
    with pytest.raises(ValueError, match="trusted main"):
        gate.check_main(root, "0.3.1")
    assert state["calls"] == []


def test_wrong_version_or_current_main_never_prepares(provider):
    """A stale version or newer main stops assembly before artifact selection."""
    state, root = provider
    with pytest.raises(ValueError):
        gate.check_main(root, "0.3.0")
    state["main"] = "b" * 40
    with pytest.raises(ValueError, match="current main"):
        gate.check_main(root, "0.3.1")


@pytest.mark.parametrize(
    "field,value",
    [
        ("path", ".github/workflows/unreviewed.yml"),
        ("event", "pull_request"),
        ("head_branch", "unreviewed"),
        ("head_sha", "b" * 40),
        ("status", "in_progress"),
        ("conclusion", "failure"),
    ],
)
def test_each_wrong_main_workflow_field_blocks(provider, field, value):
    """Correct names alone never make wrong-source, PR or nonpassing workflows acceptable."""
    state, root = provider
    state["runs"][0][field] = value
    with pytest.raises(ValueError, match="main workflow"):
        gate.check_main(root, "0.3.1")


@pytest.mark.parametrize("duplicate", [False, True])
def test_missing_and_ambiguous_workflows_do_not_use_a_fallback(provider, duplicate):
    state, root = provider
    if duplicate:
        state["runs"].append(dict(state["runs"][0]))
    else:
        state["runs"].pop(0)
    with pytest.raises(ValueError, match="main workflow"):
        gate.check_main(root, "0.3.1")


@pytest.mark.parametrize("fault", ["missing", "duplicate", "failure", "pending", "wrong-source"])
def test_aggregate_cannot_be_missing_failed_or_ambiguous_behind_green_scanner(provider, fault):
    """Reproduce the delayed postprocessing class: analyze/workflow remain green in every negative fixture."""
    state, root = provider
    aggregate = next(row for row in state["checks"] if row["name"] == "CodeQL")
    if fault == "missing":
        state["checks"].remove(aggregate)
    elif fault == "duplicate":
        state["checks"].append(dict(aggregate))
    elif fault == "failure":
        aggregate["conclusion"] = "failure"
    elif fault == "pending":
        aggregate["status"] = "in_progress"
    else:
        aggregate["head_sha"] = "b" * 40
    with pytest.raises(ValueError):
        gate.check_main(root, "0.3.1")


def test_open_alert_and_additional_failed_check_are_not_waived(provider):
    state, root = provider
    state["alerts"] = [{"number": 1}]
    with pytest.raises(ValueError, match="Open main"):
        gate.check_main(root, "0.3.1")
    state["alerts"] = []
    state["checks"].append(
        {
            "name": "additional scan",
            "head_sha": SOURCE,
            "status": "completed",
            "conclusion": "failure",
        }
    )
    with pytest.raises(ValueError, match="Additional"):
        gate.check_main(root, "0.3.1")


@pytest.mark.parametrize(
    "field,value",
    [
        ("path", ".github/workflows/unreviewed.yml"),
        ("event", "pull_request"),
        ("head_sha", "b" * 40),
        ("head_branch", "feature"),
        ("id", 899),
        ("status", "completed"),
        ("check_suite_id", True),
    ],
)
def test_active_release_exception_is_bound_to_exact_provider_run(provider, field, value):
    """A name alone cannot exempt an unrelated or stale check from complete-green requirements."""
    state, root = provider
    state["own_run"][field] = value
    with pytest.raises(ValueError, match="run source/context"):
        gate.check_main(root, "0.3.1")


@pytest.mark.parametrize(
    "fault", ["missing", "duplicate", "unrelated-suite", "failed", "wrong-name"]
)
def test_only_actual_active_owned_suite_is_exempt(provider, fault):
    """Permit execution itself, never waive missing/failed/foreign current checks."""
    state, root = provider
    own = state["checks"][-1]
    if fault == "missing":
        state["checks"].remove(own)
    elif fault == "duplicate":
        state["checks"].append(copy.deepcopy(own))
    elif fault == "unrelated-suite":
        own["check_suite"]["id"] = 902
    elif fault == "failed":
        own.update(status="completed", conclusion="failure")
    else:
        own["name"] = "renamed"
    with pytest.raises(ValueError, match="active release check"):
        gate.check_main(root, "0.3.1")


def test_complete_provider_page_cap_cannot_become_absence(monkeypatch):
    """Three full real-shaped pages exhaust the reviewed bound instead of dropping subsequent releases."""
    calls = []

    def api(path):
        calls.append(path)
        return [{} for _ in range(100)]

    monkeypatch.setattr(gate, "api", api)
    with pytest.raises(ValueError, match="complete-page bound"):
        gate.pages("repos/" + gate.REPOSITORY + "/releases")
    assert len(calls) == 3 and calls[-1].endswith("page=3")


@pytest.mark.parametrize("published", [False, True])
def test_existing_draft_or_published_release_is_never_reused(provider, published):
    state, _root = provider
    state["releases"] = [
        {"tag_name": "v0.3.1", "draft": not published, "target_commitish": "other"}
    ]
    with pytest.raises(ValueError, match="already exists"):
        gate.require_absent("0.3.1")
    state["tag"] = {"object": {"sha": SOURCE}}
    with pytest.raises(ValueError, match="tag already exists"):
        gate.require_absent("0.3.1")


def test_read_only_prepare_does_not_invoke_release_creation(provider, monkeypatch):
    _state, root = provider
    monkeypatch.setattr(gate, "ROOT", root)
    monkeypatch.setattr(gate, "gh", lambda *_args: pytest.fail("prepare attempted a write"))
    gate.main(["prepare", "--version", "0.3.1"])


@pytest.mark.parametrize(
    "fault",
    [
        None,
        "published",
        "prerelease",
        "wrong-source",
        "bad-id",
        "extra-asset",
        "wrong-digest",
        "main-moved",
    ],
)
def test_actual_local_payload_hashes_bind_a_new_draft_without_touching_old_releases(
    provider, monkeypatch, fault
):
    """Real small local bytes and independent hash expectations exercise the complete draft state machine."""
    state, root = provider
    monkeypatch.setattr(gate, "ROOT", root)
    folder = root / "release/installers"
    folder.mkdir(parents=True)
    installer = folder / "Drone Operations Console Setup 0.3.1.exe"
    payload = b"inert installer unit fixture, never executed"
    installer.write_bytes(payload)
    old_sums = folder / "SHA256SUMS.txt"
    old_sums.write_text("preserve prior delivery evidence", encoding="ascii")
    sha = hashlib.sha256(payload).hexdigest()
    asset_name = installer.name.replace(" ", ".")
    sums = sha + "  " + asset_name + "\n"
    sidecar = root / ".runtime/release-sidecars/0.3.1/SHA256SUMS.txt"
    old = {"id": 9, "tag_name": "v0.3.0", "draft": False, "target_commitish": "c" * 40}
    state["releases"] = [copy.deepcopy(old)]
    calls = []
    original_api = gate.api

    def gh(*args):
        calls.append(args)
        assert args[:3] == ("release", "create", "v0.3.1")
        assert "--draft" in args and "--clobber" not in args and "--publish" not in args
        assert args[args.index("--target") + 1] == SOURCE
        notes = (root / ".runtime/release-sidecars/0.3.1/RELEASE-NOTES.md").read_text(
            encoding="utf-8"
        )
        assert (
            f"https://github.com/{gate.REPOSITORY}/blob/{SOURCE}/docs/reports/native-lifetime-2026-11-11.md"
            in notes
        )
        assert "](reports/" not in notes
        assert installer.read_bytes() == payload and sidecar.read_text(encoding="ascii") == sums
        created = {
            "id": 42,
            "tag_name": "v0.3.1",
            "draft": True,
            "prerelease": False,
            "target_commitish": SOURCE,
        }
        if fault == "published":
            created["draft"] = False
        if fault == "prerelease":
            created["prerelease"] = True
        if fault == "wrong-source":
            created["target_commitish"] = "b" * 40
        if fault == "bad-id":
            created["id"] = True
        if fault == "main-moved":
            state["main"] = "b" * 40
        state["releases"].append(created)
        return SimpleNamespace(returncode=0, stdout="", stderr="")

    def api(path, **kwargs):
        if path.endswith("/releases/42/assets"):
            assets = [
                {"name": asset_name, "digest": "sha256:" + sha, "state": "uploaded"},
                {
                    "name": "SHA256SUMS.txt",
                    "digest": "sha256:" + hashlib.sha256(sums.encode("ascii")).hexdigest(),
                    "state": "uploaded",
                },
            ]
            if fault == "extra-asset":
                assets.append(
                    {"name": "unexpected", "digest": "sha256:" + sha, "state": "uploaded"}
                )
            if fault == "wrong-digest":
                assets[0]["digest"] = "sha256:" + "0" * 64
            return assets
        return original_api(path, **kwargs)

    monkeypatch.setattr(gate, "gh", gh)
    monkeypatch.setattr(gate, "api", api)
    if fault is None:
        gate.main(["draft", "--version", "0.3.1"])
    else:
        with pytest.raises(ValueError):
            gate.main(["draft", "--version", "0.3.1"])
    assert len(calls) == 1 and state["releases"][0] == old
    assert old_sums.read_text(encoding="ascii") == "preserve prior delivery evidence"
    # Failure preserves the newly created candidate for review; never auto-delete or publish anything.
    assert len(state["releases"]) == 2


def test_existing_local_versioned_sidecar_is_preserved_before_any_upload(provider, monkeypatch):
    """An absent provider draft does not authorize replacing a previous local attempt."""
    _state, root = provider
    monkeypatch.setattr(gate, "ROOT", root)
    folder = root / "release/installers"
    folder.mkdir(parents=True)
    (folder / "Drone Operations Console Setup 0.3.1.exe").write_bytes(b"inert fixture")
    sidecar = root / ".runtime/release-sidecars/0.3.1/SHA256SUMS.txt"
    sidecar.parent.mkdir(parents=True)
    sidecar.write_bytes(b"previous attempt")
    monkeypatch.setattr(
        gate, "gh", lambda *_args: pytest.fail("existing local attempt reached upload")
    )
    with pytest.raises(FileExistsError):
        gate.main(["draft", "--version", "0.3.1"])
    assert sidecar.read_bytes() == b"previous attempt"


@pytest.mark.parametrize("target", ["../unreviewed.md", "http://example.invalid/plain"])
def test_unreviewed_relative_or_plain_http_release_links_cannot_reach_upload(
    provider, monkeypatch, target
):
    """Provider body links must remain source-bound; release-page-relative URLs are not silently published."""
    _state, root = provider
    monkeypatch.setattr(gate, "ROOT", root)
    folder = root / "release/installers"
    folder.mkdir(parents=True)
    (folder / "Drone Operations Console Setup 0.3.1.exe").write_bytes(b"inert fixture")
    (root / "docs/RELEASE_0_3_1.md").write_text(f"[Unknown]({target})\n", encoding="utf-8")
    monkeypatch.setattr(
        gate, "gh", lambda *_args: pytest.fail("unsafe release link reached upload")
    )
    with pytest.raises(ValueError, match="source-bound Markdown"):
        gate.main(["draft", "--version", "0.3.1"])
    assert not (root / ".runtime/release-sidecars").exists()


@pytest.mark.parametrize(
    "code,missing,accepted",
    [
        (404, True, True),
        (404, False, False),
        (401, True, False),
        (403, True, False),
        (500, True, False),
    ],
)
def test_only_explicit_authenticated_tag404_is_an_absence(monkeypatch, code, missing, accepted):
    """Auth/network/server failures cannot be relabelled as permission to replace an existing release."""
    response = SimpleNamespace(
        returncode=1,
        stdout=json.dumps({"message": "Not Found"}),
        stderr=f"gh: request failed (HTTP {code})",
    )
    monkeypatch.setattr(gate, "gh", lambda *_args: response)
    endpoint = f"repos/{gate.REPOSITORY}/git/ref/tags/v0.3.1"
    if accepted:
        assert gate.api(endpoint, absent_tag=missing) is None
    else:
        with pytest.raises(RuntimeError):
            gate.api(endpoint, absent_tag=missing)
    with pytest.raises(RuntimeError):
        gate.api(f"repos/{gate.REPOSITORY}/releases/tags/v0.3.1", absent_tag=True)


def test_release_workflow_is_manual_main_draft_only_with_original_validation_lanes():
    """Policy oracle checks source intent; hosted runtime/installer outcomes remain separate actual evidence."""
    root = gate.ROOT
    workflow = (root / ".github/workflows/desktop-release.yml").read_text(encoding="utf-8")
    assert "workflow_dispatch:" in workflow and "push:" not in workflow
    assert "if: github.ref == 'refs/heads/main'" in workflow
    assert 'python-version: "3.14.10"' in workflow
    assert "python -m tools.release_preflight prepare" in workflow
    assert "python -m tools.release_preflight draft" in workflow
    assert "upload-artifact" not in workflow and "actions/cache" not in workflow
    validation = (root / ".github/workflows/validate.yml").read_text(encoding="utf-8")
    for actual in (
        "npm run test:lifecycle",
        "python tools/postgres_acceptance.py",
        "python tools/native_acceptance.py",
        "docker build -t drone-console:test",
        "npm run test:e2e",
        "npm run test:desktop",
    ):
        assert actual in validation
