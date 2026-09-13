#!/usr/bin/env python3
"""Build packs/index.json — a machine-readable index of every festpack.

Every field in the index is read from the pack itself; nothing here is
hand-typed. Run with no arguments to (re)write packs/index.json. Run with
--check to verify the committed index still matches the packs on disk
(exits non-zero and prints a diff if it has drifted) — used in CI so the
index can never go stale.

Stdlib only, on purpose: this script must run in CI (and anywhere else)
without installing anything.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKS_DIR = REPO_ROOT / "packs"
INDEX_PATH = PACKS_DIR / "index.json"
SCHEMA_ID = "fest-almanac-index/1"


def git_last_commit_date(path: Path) -> Optional[str]:
    """ISO date (YYYY-MM-DD) of the last commit that touched `path`, or None."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(path)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    out = result.stdout.strip()
    return out or None


def build_entry(festpack_path: Path) -> dict:
    raw = festpack_path.read_bytes()
    data = json.loads(raw)
    festival = data["festival"]
    meta = data.get("meta", {})
    rel_path = festpack_path.relative_to(REPO_ROOT).as_posix()

    updated = meta.get("updated") or git_last_commit_date(festpack_path)
    if not updated:
        raise ValueError(
            f"{rel_path}: no meta.updated field and no git history to fall back on"
        )

    return {
        "slug": festival["slug"],
        "year": festival["year"],
        "name": festival["name"],
        "start": festival["start"],
        "end": festival["end"],
        "timezone": festival["timezone"],
        "path": rel_path,
        "updated": updated,
        "sha256": hashlib.sha256(raw).hexdigest(),
    }


def build_index() -> dict:
    festpack_paths = sorted(PACKS_DIR.glob("*/*/festpack.json"))
    entries = [build_entry(p) for p in festpack_paths]
    entries.sort(key=lambda e: (e["start"], e["slug"]))
    return {
        "schema": SCHEMA_ID,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "packs": entries,
    }


def render(index: dict) -> str:
    return json.dumps(index, indent=2) + "\n"


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify packs/index.json is up to date; print a diff and exit "
        "non-zero if it is stale, instead of writing it",
    )
    args = parser.parse_args(argv)

    fresh = build_index()
    rel = INDEX_PATH.relative_to(REPO_ROOT)

    if not args.check:
        INDEX_PATH.write_text(render(fresh))
        print(f"wrote {rel} ({len(fresh['packs'])} packs)")
        return 0

    if not INDEX_PATH.exists():
        print(f"{rel} does not exist — run tools/build_index.py", file=sys.stderr)
        return 1

    existing_raw = INDEX_PATH.read_text()
    try:
        existing = json.loads(existing_raw)
    except json.JSONDecodeError as e:
        print(f"{rel} is not valid JSON: {e}", file=sys.stderr)
        return 1

    # The `generated` timestamp legitimately changes on every run — carry the
    # committed value over before comparing, so only real content/formatting
    # drift trips --check.
    expected = dict(fresh)
    expected["generated"] = existing.get("generated", fresh["generated"])
    expected_text = render(expected)

    if expected_text == existing_raw:
        print(f"{rel} is up to date")
        return 0

    diff = difflib.unified_diff(
        existing_raw.splitlines(keepends=True),
        expected_text.splitlines(keepends=True),
        fromfile=f"a/{rel}",
        tofile=f"b/{rel}",
    )
    sys.stdout.writelines(diff)
    print(f"\n{rel} is stale — run tools/build_index.py to regenerate", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
