#!/usr/bin/env python3
"""
CRAP Score Calculator
Computes Change Risk Anti-Patterns scores for functions/methods.
CRAP(m) = comp(m)^2 * (1 - cov(m)/100)^3 + comp(m)

Supports: Python (AST), JS/TS/Java/Go (heuristic complexity).
Coverage formats: lcov, coverage.py JSON, istanbul JSON, Cobertura XML.
"""

import ast
import json
import os
import re
import sys
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class FunctionInfo:
    name: str
    file: str
    start_line: int
    end_line: int
    complexity: int = 1
    coverage: float = 0.0
    crap_score: float = 0.0


def calc_crap(complexity: int, coverage: float) -> float:
    """CRAP(m) = comp^2 * (1 - cov/100)^3 + comp"""
    cov = max(0.0, min(100.0, coverage)) / 100.0
    return complexity ** 2 * (1 - cov) ** 3 + complexity


# ---------------------------------------------------------------------------
# Python complexity (AST-based, accurate)
# ---------------------------------------------------------------------------

class _PyComplexityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.functions: List[FunctionInfo] = []
        self._class_stack: List[str] = []

    def _complexity_of(self, node: ast.AST) -> int:
        cc = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For)):
                cc += 1
            elif isinstance(child, ast.ExceptHandler):
                cc += 1
            elif isinstance(child, ast.BoolOp):
                # each additional operand adds a branch
                cc += len(child.values) - 1
            elif isinstance(child, ast.IfExp):
                cc += 1
            elif isinstance(child, ast.Assert):
                cc += 1
            elif isinstance(child, ast.comprehension):
                cc += 1 + len(child.ifs)
        return cc

    def visit_ClassDef(self, node: ast.ClassDef):
        self._class_stack.append(node.name)
        self.generic_visit(node)
        self._class_stack.pop()

    def _visit_func(self, node):
        end = getattr(node, "end_lineno", None) or node.lineno
        prefix = ".".join(self._class_stack) + "." if self._class_stack else ""
        self.functions.append(FunctionInfo(
            name=f"{prefix}{node.name}",
            file="",
            start_line=node.lineno,
            end_line=end,
            complexity=self._complexity_of(node),
        ))
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self._visit_func(node)

    def visit_AsyncFunctionDef(self, node):
        self._visit_func(node)


def _extract_python(source: str, filepath: str) -> List[FunctionInfo]:
    try:
        tree = ast.parse(source, filename=filepath)
    except SyntaxError:
        return []
    v = _PyComplexityVisitor()
    v.visit(tree)
    for f in v.functions:
        f.file = filepath
    return v.functions


# ---------------------------------------------------------------------------
# Generic complexity (regex heuristic for JS/TS/Java/Go/C#/etc.)
# ---------------------------------------------------------------------------

_FUNC_PATTERNS: Dict[str, List[str]] = {
    "js": [
        r"(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)\s*\(",
        r"(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(?[^)]*\)?\s*=>",
        r"(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{",
    ],
    "java": [
        r"(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{",
    ],
    "go": [
        r"func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(",
    ],
}

_BRANCH_RE = re.compile(
    r"\b(?:if|else\s+if|elif|for|while|case|catch|except)\b|&&|\|\||\?"
)


def _find_brace_end(lines: List[str], start: int) -> int:
    depth = 0
    started = False
    for i in range(start, len(lines)):
        for ch in lines[i]:
            if ch == "{":
                depth += 1
                started = True
            elif ch == "}":
                depth -= 1
                if started and depth == 0:
                    return i + 1
    return min(start + 50, len(lines))


def _extract_generic(source: str, filepath: str, lang: str) -> List[FunctionInfo]:
    lines = source.split("\n")
    functions: List[FunctionInfo] = []
    patterns = _FUNC_PATTERNS.get(lang, _FUNC_PATTERNS["js"])
    seen: set = set()

    for i, line in enumerate(lines):
        for pat in patterns:
            m = re.search(pat, line)
            if m:
                name = m.group(1)
                start = i + 1  # 1-indexed
                end = _find_brace_end(lines, i)
                key = (name, start)
                if key in seen:
                    break
                seen.add(key)
                body = "\n".join(lines[i:end])
                cc = 1 + len(_BRANCH_RE.findall(body))
                functions.append(FunctionInfo(
                    name=name, file=filepath,
                    start_line=start, end_line=end,
                    complexity=cc,
                ))
                break
    return functions


# ---------------------------------------------------------------------------
# Coverage parsing
# ---------------------------------------------------------------------------

def _parse_lcov(path: str) -> Dict[str, Dict[int, int]]:
    cov: Dict[str, Dict[int, int]] = {}
    cur = None
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("SF:"):
                cur = line[3:]
                cov.setdefault(cur, {})
            elif line.startswith("DA:") and cur is not None:
                parts = line[3:].split(",")
                if len(parts) >= 2:
                    cov[cur][int(parts[0])] = int(parts[1])
            elif line == "end_of_record":
                cur = None
    return cov


def _parse_coverage_json(path: str) -> Dict[str, Dict[int, int]]:
    with open(path) as f:
        data = json.load(f)
    cov: Dict[str, Dict[int, int]] = {}
    # coverage.py format
    if "files" in data:
        for fp, fd in data["files"].items():
            lc: Dict[int, int] = {}
            for ln in fd.get("executed_lines", []):
                lc[ln] = 1
            for ln in fd.get("missing_lines", []):
                lc[ln] = 0
            cov[fp] = lc
    else:
        # istanbul / nyc format
        for fp, fd in data.items():
            if not isinstance(fd, dict) or "s" not in fd:
                continue
            lc = {}
            sm = fd.get("statementMap", {})
            for sid, hits in fd.get("s", {}).items():
                if sid in sm:
                    s = sm[sid]["start"]["line"]
                    e = sm[sid]["end"]["line"]
                    for ln in range(s, e + 1):
                        lc[ln] = max(lc.get(ln, 0), hits)
            cov[fp] = lc
    return cov


def _parse_cobertura(path: str) -> Dict[str, Dict[int, int]]:
    import xml.etree.ElementTree as ET
    tree = ET.parse(path)
    cov: Dict[str, Dict[int, int]] = {}
    for cls in tree.iter("class"):
        fn = cls.get("filename", "")
        if not fn:
            continue
        lc: Dict[int, int] = {}
        for line in cls.iter("line"):
            lc[int(line.get("number", 0))] = int(line.get("hits", 0))
        if lc:
            cov[fn] = lc
    return cov


def load_coverage(path: str) -> Dict[str, Dict[int, int]]:
    if path.endswith(".info"):
        return _parse_lcov(path)
    if path.endswith(".json"):
        return _parse_coverage_json(path)
    if path.endswith(".xml"):
        return _parse_cobertura(path)
    # auto-detect
    with open(path) as f:
        head = f.read(64)
    if head.lstrip().startswith(("{",)):
        return _parse_coverage_json(path)
    if head.startswith("TN:") or head.startswith("SF:"):
        return _parse_lcov(path)
    if head.lstrip().startswith("<?xml"):
        return _parse_cobertura(path)
    print(f"WARNING: cannot detect coverage format for {path}", file=sys.stderr)
    return {}


# ---------------------------------------------------------------------------
# Glue
# ---------------------------------------------------------------------------

_LANG_MAP = {
    ".py": "python", ".pyw": "python",
    ".js": "js", ".jsx": "js", ".ts": "js", ".tsx": "js",
    ".mjs": "js", ".cjs": "js",
    ".java": "java", ".kt": "java",
    ".go": "go",
    ".cs": "js",  # C# uses brace-based heuristic
    ".rb": "js",
    ".php": "js",
}

_SOURCE_EXTS = set(_LANG_MAP.keys())


def _detect_lang(fp: str) -> str:
    return _LANG_MAP.get(Path(fp).suffix, "js")


def extract_functions(source: str, filepath: str) -> List[FunctionInfo]:
    lang = _detect_lang(filepath)
    if lang == "python":
        return _extract_python(source, filepath)
    return _extract_generic(source, filepath, lang)


def _func_coverage(func: FunctionInfo, file_cov: Dict[int, int]) -> float:
    if not file_cov:
        return 0.0
    total = covered = 0
    for ln in range(func.start_line, func.end_line + 1):
        if ln in file_cov:
            total += 1
            if file_cov[ln] > 0:
                covered += 1
    return (covered / total * 100.0) if total > 0 else 0.0


def _normalise_cov_paths(
    raw: Dict[str, Dict[int, int]], base: Path
) -> Dict[str, Dict[int, int]]:
    out: Dict[str, Dict[int, int]] = {}
    for p, lines in raw.items():
        # store multiple variants for matching
        rp = Path(p)
        candidates = [p]
        try:
            candidates.append(str(rp.relative_to(base)))
        except (ValueError, TypeError):
            pass
        if not rp.is_absolute():
            candidates.append(str(base / rp))
        candidates.append(str(rp.resolve()) if not rp.is_absolute() else p)
        if p.startswith("./"):
            candidates.append(p[2:])
        else:
            candidates.append("./" + p)
        for c in candidates:
            out[c] = lines
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse

    ap = argparse.ArgumentParser(description="CRAP score calculator")
    ap.add_argument("sources", nargs="+", help="Source files or directories")
    ap.add_argument("-c", "--coverage", required=True, help="Coverage report path")
    ap.add_argument("-t", "--threshold", type=float, default=30.0)
    ap.add_argument("-f", "--format", choices=["json", "text"], default="text")
    ap.add_argument("--top", type=int, default=0, help="Top N worst offenders")
    ap.add_argument("-b", "--base-dir", default=".")
    args = ap.parse_args()

    base = Path(args.base_dir).resolve()

    # collect source files
    src_files: List[str] = []
    for s in args.sources:
        p = Path(s)
        if p.is_file() and p.suffix in _SOURCE_EXTS:
            src_files.append(str(p))
        elif p.is_dir():
            for ext in _SOURCE_EXTS:
                src_files.extend(str(f) for f in p.rglob(f"*{ext}")
                                 if ".venv" not in f.parts
                                 and "node_modules" not in f.parts
                                 and "__pycache__" not in f.parts)

    # load + normalise coverage
    raw_cov = load_coverage(args.coverage)
    cov = _normalise_cov_paths(raw_cov, base)

    # process
    all_funcs: List[FunctionInfo] = []
    for fp in src_files:
        try:
            source = Path(fp).read_text(errors="replace")
        except IOError:
            continue
        funcs = extract_functions(source, fp)
        # resolve coverage for this file
        abs_fp = str(Path(fp).resolve())
        try:
            rel_fp = str(Path(fp).relative_to(base))
        except ValueError:
            rel_fp = fp
        file_cov = cov.get(rel_fp) or cov.get(abs_fp) or cov.get(fp) or {}
        for fn in funcs:
            fn.coverage = round(_func_coverage(fn, file_cov), 1)
            fn.crap_score = round(calc_crap(fn.complexity, fn.coverage), 1)
            all_funcs.append(fn)

    all_funcs.sort(key=lambda f: f.crap_score, reverse=True)
    if args.top > 0:
        all_funcs = all_funcs[: args.top]

    crappy = sum(1 for f in all_funcs if f.crap_score > args.threshold)
    total = len(all_funcs)

    if args.format == "json":
        print(json.dumps({
            "threshold": args.threshold,
            "total_functions": total,
            "crappy_functions": crappy,
            "functions": [asdict(f) for f in all_funcs],
        }, indent=2))
    else:
        print("CRAP Score Report")
        print("=" * 90)
        print(f"Threshold: {args.threshold}  |  Total functions: {total}  |  CRAPpy: {crappy}")
        print()
        if all_funcs:
            hdr = f"{'CRAP':>8}  {'Cmplx':>5}  {'Cov%':>6}  Function"
            print(hdr)
            print("-" * len(hdr) + "-" * 40)
            for fn in all_funcs:
                flag = " !!!" if fn.crap_score > args.threshold else ""
                loc = f"{fn.file}:{fn.start_line}"
                print(f"{fn.crap_score:>8.1f}  {fn.complexity:>5}  {fn.coverage:>5.1f}%  {loc} {fn.name}{flag}")
        print()
        if crappy:
            print(f"{crappy} function(s) exceed CRAP threshold {args.threshold}.")
        else:
            print("All functions are below the CRAP threshold. Code is clean.")


if __name__ == "__main__":
    main()
