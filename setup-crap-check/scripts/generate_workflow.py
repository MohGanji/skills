#!/usr/bin/env python3
"""
Generate a GitHub Actions workflow YAML for CRAP score checking.

Produces a complete, ready-to-commit workflow file based on project
language, test/coverage commands, triggers, and threshold settings.
"""

import argparse
import sys
from pathlib import Path
from typing import List, Optional


# ---------------------------------------------------------------------------
# Language presets
# ---------------------------------------------------------------------------

PRESETS = {
    "python": {
        "setup_action": "actions/setup-python@v5",
        "setup_with": {"python-version": "3.x"},
        "version_key": "python-version",
        "install_deps": "pip install coverage",
        "test_cmd": "coverage run -m pytest",
        "coverage_cmd": "coverage json -o coverage.json",
        "coverage_file": "coverage.json",
        "label": "Python",
    },
    "node": {
        "setup_action": "actions/setup-node@v4",
        "setup_with": {"node-version": "20"},
        "version_key": "node-version",
        "install_deps": "npm ci",
        "test_cmd": "npx jest --coverage --coverageReporters=lcov",
        "coverage_cmd": None,
        "coverage_file": "coverage/lcov.info",
        "label": "Node",
    },
    "node-vitest": {
        "setup_action": "actions/setup-node@v4",
        "setup_with": {"node-version": "20"},
        "version_key": "node-version",
        "install_deps": "npm ci",
        "test_cmd": "npx vitest run --coverage --coverage.reporter=lcov",
        "coverage_cmd": None,
        "coverage_file": "coverage/lcov.info",
        "label": "Node",
    },
    "node-c8": {
        "setup_action": "actions/setup-node@v4",
        "setup_with": {"node-version": "20"},
        "version_key": "node-version",
        "install_deps": "npm ci",
        "test_cmd": "npx c8 --reporter=lcov npm test",
        "coverage_cmd": None,
        "coverage_file": "coverage/lcov.info",
        "label": "Node",
    },
    "go": {
        "setup_action": "actions/setup-go@v5",
        "setup_with": {"go-version": "stable"},
        "version_key": "go-version",
        "install_deps": None,
        "test_cmd": "go test -coverprofile=coverage.out ./...",
        "coverage_cmd": "go install github.com/jandelgado/gcov2lcov@latest && gcov2lcov -infile=coverage.out -outfile=coverage.info",
        "coverage_file": "coverage.info",
        "label": "Go",
    },
    "java-maven": {
        "setup_action": "actions/setup-java@v4",
        "setup_with": {"distribution": "temurin", "java-version": "21"},
        "version_key": "java-version",
        "install_deps": None,
        "test_cmd": "mvn test jacoco:report",
        "coverage_cmd": None,
        "coverage_file": "target/site/jacoco/jacoco.xml",
        "label": "Java",
    },
    "java-gradle": {
        "setup_action": "actions/setup-java@v4",
        "setup_with": {"distribution": "temurin", "java-version": "21"},
        "version_key": "java-version",
        "install_deps": None,
        "test_cmd": "./gradlew test jacocoTestReport",
        "coverage_cmd": None,
        "coverage_file": "build/reports/jacoco/test/jacocoTestReport.xml",
        "label": "Java",
    },
}


# ---------------------------------------------------------------------------
# Inline Python scripts for the enforce/report steps
# ---------------------------------------------------------------------------

ENFORCE_SCRIPT = r'''import json, sys
with open("crap-report.json") as f:
    report = json.load(f)
total = report["total_functions"]
crappy = report["crappy_functions"]
threshold = report["threshold"]
print("CRAP Score Report")
print("=================")
print(f"Threshold: {threshold} | Total functions: {total} | CRAPpy: {crappy}")
print()
if crappy > 0:
    print(f"{crappy} function(s) exceed CRAP threshold {threshold}:")
    print()
    for fn in report["functions"]:
        if fn["crap_score"] > threshold:
            print(f"  {fn['crap_score']:>8.1f}  complexity={fn['complexity']}  "
                  f"coverage={fn['coverage']}%  {fn['file']}:{fn['start_line']} {fn['name']}")
    print()
    sys.exit(1)
else:
    print("All functions are below the CRAP threshold.")
'''

WARN_SCRIPT = r'''import json, os
with open("crap-report.json") as f:
    report = json.load(f)
crappy = report["crappy_functions"]
threshold = report["threshold"]
total = report["total_functions"]
lines = [f"## CRAP Score Report", "", f"**Threshold**: {threshold} | **Total functions**: {total} | **CRAPpy**: {crappy}", ""]
if crappy > 0:
    lines += ["| CRAP | Cmplx | Cov% | Function |", "|------|-------|------|----------|"]
    for fn in report["functions"]:
        if fn["crap_score"] > threshold:
            lines.append(f"| {fn['crap_score']:.1f} | {fn['complexity']} | {fn['coverage']}% | `{fn['file']}:{fn['start_line']}` {fn['name']} |")
    lines.append(f"\n{crappy} function(s) exceed threshold.")
else:
    lines.append("All functions are below the CRAP threshold.")
with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
    f.write("\n".join(lines) + "\n")
'''


# ---------------------------------------------------------------------------
# YAML builder (line-by-line to guarantee correct indentation)
# ---------------------------------------------------------------------------

def _add(lines: list, indent: int, text: str):
    """Append a line with the given indent level (2-space based)."""
    lines.append(" " * indent + text)


def _add_block(lines: list, indent: int, text: str):
    """Append a multi-line block, each line indented."""
    for line in text.rstrip().split("\n"):
        lines.append(" " * indent + line)


def generate_workflow(
    language: str,
    test_cmd: Optional[str],
    coverage_cmd: Optional[str],
    coverage_file: Optional[str],
    source_dirs: List[str],
    triggers: List[str],
    target_branches: List[str],
    threshold: float,
    fail_on_threshold: bool,
    version_override: Optional[str],
    schedule_cron: Optional[str],
    install_cmd: Optional[str],
) -> str:
    preset = PRESETS.get(language)
    if not preset:
        print(f"ERROR: Unknown language '{language}'. "
              f"Valid: {', '.join(PRESETS.keys())}", file=sys.stderr)
        sys.exit(1)

    # Resolve values (CLI overrides > preset defaults)
    setup_with = dict(preset["setup_with"])
    if version_override:
        setup_with[preset["version_key"]] = version_override

    _install = install_cmd or preset.get("install_deps")
    _test = test_cmd or preset["test_cmd"]
    _cov_cmd = coverage_cmd or preset.get("coverage_cmd")
    _cov_file = coverage_file or preset["coverage_file"]
    _src = " ".join(source_dirs) if source_dirs else "."
    _label = preset["label"]
    needs_extra_python = language != "python"

    L: List[str] = []

    # --- Header ---
    _add(L, 0, "name: CRAP Score Check")
    L.append("")

    # --- on: ---
    _add(L, 0, "on:")
    for t in triggers:
        if t == "pull_request":
            _add(L, 2, "pull_request:")
            _add(L, 4, "branches:")
            for b in target_branches:
                _add(L, 6, f"- {b}")
        elif t == "push":
            _add(L, 2, "push:")
            _add(L, 4, "branches:")
            for b in target_branches:
                _add(L, 6, f"- {b}")
        elif t == "schedule":
            cron = schedule_cron or "0 6 * * 1"
            _add(L, 2, "schedule:")
            _add(L, 4, f'- cron: "{cron}"')
        elif t == "workflow_dispatch":
            _add(L, 2, "workflow_dispatch:")
    L.append("")

    # --- jobs: ---
    _add(L, 0, "jobs:")
    _add(L, 2, "crap-check:")
    _add(L, 4, "runs-on: ubuntu-latest")
    _add(L, 4, "steps:")

    # Checkout
    _add(L, 6, "- uses: actions/checkout@v4")
    L.append("")

    # Language setup
    _add(L, 6, f"- name: Set up {_label}")
    _add(L, 8, f"uses: {preset['setup_action']}")
    _add(L, 8, "with:")
    for k, v in setup_with.items():
        _add(L, 10, f"{k}: '{v}'")
    L.append("")

    # Extra Python setup for non-Python projects
    if needs_extra_python:
        _add(L, 6, "- name: Set up Python (for CRAP calculator)")
        _add(L, 8, "uses: actions/setup-python@v5")
        _add(L, 8, "with:")
        _add(L, 10, "python-version: '3.x'")
        L.append("")

    # Install deps
    if _install:
        _add(L, 6, "- name: Install dependencies")
        _add(L, 8, f"run: {_install}")
        L.append("")

    # Run tests
    _add(L, 6, "- name: Run tests with coverage")
    _add(L, 8, f"run: {_test}")
    L.append("")

    # Coverage generation (if separate step)
    if _cov_cmd:
        _add(L, 6, "- name: Generate coverage report")
        _add(L, 8, f"run: {_cov_cmd}")
        L.append("")

    # CRAP score calculation
    _add(L, 6, "- name: Calculate CRAP scores")
    _add(L, 8, f"run: python3 scripts/crap_score.py {_src} -c {_cov_file} -t {threshold} -f json -b . > crap-report.json")
    L.append("")

    # Enforce or report
    if fail_on_threshold:
        _add(L, 6, "- name: Enforce CRAP threshold")
        _add(L, 8, "run: |")
        _add(L, 10, "python3 - <<'PYEOF'")
        _add_block(L, 10, ENFORCE_SCRIPT)
        _add(L, 10, "PYEOF")
    else:
        _add(L, 6, "- name: Report CRAP scores")
        _add(L, 8, "run: |")
        _add(L, 10, "python3 - <<'PYEOF'")
        _add_block(L, 10, WARN_SCRIPT)
        _add(L, 10, "PYEOF")

    return "\n".join(L) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(
        description="Generate a GitHub Actions workflow for CRAP score checking"
    )
    ap.add_argument("--language", required=True,
                    choices=list(PRESETS.keys()),
                    help="Project language/framework")
    ap.add_argument("--test-cmd", help="Override test command")
    ap.add_argument("--coverage-cmd", help="Override coverage generation command")
    ap.add_argument("--coverage-file", help="Override coverage report path")
    ap.add_argument("--source-dirs", nargs="+", default=["."],
                    help="Source directories to scan")
    ap.add_argument("--triggers", nargs="+", default=["pull_request"],
                    choices=["pull_request", "push", "schedule", "workflow_dispatch"],
                    help="Workflow trigger events")
    ap.add_argument("--target-branches", nargs="+", default=["main", "master"],
                    help="Target branches for PR/push triggers")
    ap.add_argument("--threshold", type=float, default=30.0,
                    help="CRAP score threshold (default: 30)")
    ap.add_argument("--fail-on-threshold", action="store_true", default=True,
                    help="Fail the check when threshold exceeded (default)")
    ap.add_argument("--warn-only", action="store_true",
                    help="Post summary but don't fail the check")
    ap.add_argument("--version", dest="version_override",
                    help="Override language version (e.g. 3.12, 20, 21)")
    ap.add_argument("--schedule-cron",
                    help="Cron expression for schedule trigger (default: Monday 6am)")
    ap.add_argument("--install-cmd",
                    help="Override dependency installation command")
    ap.add_argument("--output", "-o", help="Output file path (default: stdout)")

    args = ap.parse_args()

    yaml_content = generate_workflow(
        language=args.language,
        test_cmd=args.test_cmd,
        coverage_cmd=args.coverage_cmd,
        coverage_file=args.coverage_file,
        source_dirs=args.source_dirs,
        triggers=args.triggers,
        target_branches=args.target_branches,
        threshold=args.threshold,
        fail_on_threshold=not args.warn_only,
        version_override=args.version_override,
        schedule_cron=args.schedule_cron,
        install_cmd=args.install_cmd,
    )

    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(yaml_content)
        print(f"Wrote workflow to {args.output}", file=sys.stderr)
    else:
        print(yaml_content, end="")


if __name__ == "__main__":
    main()
