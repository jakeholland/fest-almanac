#!/usr/bin/env python3
"""Validate every packs/*/*/festpack.json against schema/festpack.schema.json.

Requires the `jsonschema` package (see tools/requirements.txt) — unlike
build_index.py, this one isn't stdlib-only, since a real JSON Schema
validator is worth the dependency for CI.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print(
        "error: this script requires the 'jsonschema' package "
        "(pip install -r tools/requirements.txt)",
        file=sys.stderr,
    )
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "festpack.schema.json"
PACKS_DIR = REPO_ROOT / "packs"


def main() -> int:
    schema = json.loads(SCHEMA_PATH.read_text())
    validator_cls = jsonschema.validators.validator_for(schema)
    validator_cls.check_schema(schema)
    validator = validator_cls(schema, format_checker=jsonschema.FormatChecker())

    festpack_paths = sorted(PACKS_DIR.glob("*/*/festpack.json"))
    if not festpack_paths:
        print(f"no festpack.json files found under {PACKS_DIR.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1

    ok = True
    for path in festpack_paths:
        rel = path.relative_to(REPO_ROOT).as_posix()
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            print(f"{rel}: invalid JSON: {e}")
            ok = False
            continue

        errors = sorted(validator.iter_errors(data), key=lambda e: list(map(str, e.path)))
        if errors:
            ok = False
            for err in errors:
                loc = "/".join(str(p) for p in err.path) or "<root>"
                print(f"{rel}: {loc}: {err.message}")
        else:
            print(f"{rel}: ok")

    if not ok:
        print("\nschema validation failed", file=sys.stderr)
        return 1

    print(f"\n{len(festpack_paths)} festpack(s) valid against {SCHEMA_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
