"""Jason Stys: retain actual full browser and simulator gates behind exact vendor-host setup.

Variables/functions and locations: docs/SOURCE_MAP.md. Real workflow and locked
dependency declarations are inputs; results of browser/service tests are never mocked.
"""

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / ".github/workflows/validate.yml").read_text(encoding="utf-8")


def require_recipe(source):
    """Check this reviewed job format without claiming a general YAML security parser."""
    browser = source.split("  browser:\n")[1].split("  desktop:\n")[0]
    lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
    version = lock["packages"]["node_modules/playwright"]["dependencies"]["playwright-core"]
    for value in (
        f"image: mcr.microsoft.com/playwright:v{version}-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f",
        "options: --user 1001",
        "timeout-minutes: 15",
        "timeout-minutes: 3",
        "python -m pip install --require-hashes -r requirements-dev.lock",
        "npm ci --ignore-scripts && npm run build",
        "node tools/check_browser_host.mjs chromium firefox webkit",
        "npm run test:e2e",
    ):
        assert value in browser
    for forbidden in (
        "with-deps",
        "install-deps",
        "apt-get",
        "continue-on-error",
        "|| true",
        "SKIP_VALIDATE_HOST_REQUIREMENTS",
    ):
        assert forbidden not in browser
    configuration = (ROOT / "playwright.config.ts").read_text(encoding="utf-8")
    for engine in ("chromium", "firefox", "webkit"):
        assert f'name: "{engine}"' in configuration
    for original in (
        "px4_sitl_default -j2",
        "python tools/native_acceptance.py",
        "python tools/postgres_acceptance.py",
        "npm run test:desktop",
    ):
        assert original in source


def test_actual_complete_browser_environment():
    """Positive check reads actual checked-in workflow and original complete browser configuration."""
    require_recipe(WORKFLOW)


@pytest.mark.parametrize(
    "before,after",
    [
        ("@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f", ""),
        ("--user 1001", "--user 0"),
        ("chromium firefox webkit", "chromium firefox"),
        ("npm run test:e2e", "true"),
        (
            "node tools/check_browser_host.mjs chromium firefox webkit",
            "node tools/check_browser_host.mjs chromium firefox webkit || true",
        ),
    ],
)
def test_environment_mutations_fail(before, after):
    """Missing engine/assertion, mutable image, root identity and ignored host errors must fail."""
    with pytest.raises(AssertionError):
        require_recipe(WORKFLOW.replace(before, after))
