"""Jason Stys: deterministic safety/docs/workflow and bounded build-output contract checks.

Functions/variables and source lines: docs/SOURCE_MAP.md. This is a narrow secret-pattern
check, not a complete secret scanner, security certification or proof of functional correctness.
"""

import gzip
import re
import sys
from pathlib import Path

from docs_index import ROOT, files


def main():
    """Require headers, pinned Actions, named docs, public-safe text and unchanged output budgets."""
    for name in (
        "README.md",
        "LICENSE",
        "SECURITY.md",
        "CONTRIBUTING.md",
        "docs/ARCHITECTURE.md",
        "docs/TESTING.md",
        "docs/SECURITY.md",
        "docs/OPERATIONS.md",
        "docs/VALIDATION.md",
        "docs/RESEARCH.md",
        "docs/FILE_CATALOG.md",
        "docs/SOURCE_MAP.md",
    ):
        assert (ROOT / name).is_file(), name
    for path in files():
        if path.suffix in (".png",):
            continue
        content = path.read_text(encoding="utf-8")
        assert not re.search(
            r"(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)",
            content,
        ), path
        if path.suffix in (".py", ".ts", ".tsx", ".css", ".mjs", ".html", ".sh"):
            assert "Jason Stys:" in "\n".join(content.splitlines()[:12]), path
            assert "SOURCE_MAP.md" in "\n".join(content.splitlines()[:12]), path
        if path.parent.name == "workflows":
            for action in re.findall(r"uses:\s*([^\s]+)", content):
                assert re.fullmatch(r"[\w./-]+@[0-9a-f]{40}", action), action
    if "--dist" in sys.argv:
        scripts = list(Path("dist/assets").glob("*.js"))
        styles = list(Path("dist/assets").glob("*.css"))
        js = sum(len(gzip.compress(p.read_bytes())) for p in scripts)
        css = sum(len(gzip.compress(p.read_bytes())) for p in styles)
        assert js <= 100_000 and css <= 12_000, (js, css)
        print(f"Production gzip: JS {js} B / 100000; CSS {css} B / 12000")
    print("Public-source, headers, docs and Actions contracts passed")


if __name__ == "__main__":
    main()
