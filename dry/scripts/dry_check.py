#!/usr/bin/env python3
"""
dry_check.py — structural duplicate detector for Python and JS/TS codebases.

Port of Uncle Bob's dry4clj algorithm:
  1. Parse source files into function-level AST blocks
  2. Normalize each block (replace names/literals with generic markers,
     preserve structural shape)
  3. Fingerprint each normalized block (collect string repr of every subtree)
  4. Compare all pairs via Jaccard similarity over fingerprint sets
  5. Report pairs above a configurable threshold

Requires only the Python stdlib (ast module for Python, token-based parser
for JS/TS).
"""

import argparse
import ast
import json
import os
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------

PYTHON_EXTS = {".py"}
JSTS_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"}

def classify_file(path):
    ext = Path(path).suffix.lower()
    if ext in PYTHON_EXTS:
        return "python"
    if ext in JSTS_EXTS:
        return "jsts"
    return None


def collect_files(paths, language=None):
    files = []
    for p in paths:
        p = Path(p)
        if p.is_file():
            lang = classify_file(p)
            if lang and (language is None or lang == language):
                files.append((str(p), lang))
        elif p.is_dir():
            for root, dirs, fnames in os.walk(p):
                dirs[:] = [d for d in dirs if d not in {
                    "node_modules", ".git", "__pycache__", ".venv", "venv",
                    "dist", "build", ".next", ".nuxt", "coverage",
                }]
                for fn in sorted(fnames):
                    fp = os.path.join(root, fn)
                    lang = classify_file(fp)
                    if lang and (language is None or lang == language):
                        files.append((fp, lang))
    return sorted(files)


# ---------------------------------------------------------------------------
# Normalization helpers (shared)
# ---------------------------------------------------------------------------

def node_count(tree):
    if isinstance(tree, list):
        return 1 + sum(node_count(c) for c in tree)
    if isinstance(tree, tuple):
        return 1 + sum(node_count(c) for c in tree)
    return 1


def fingerprints(normalized):
    fps = set()
    def walk(node):
        s = repr(node)
        fps.add(s)
        if isinstance(node, (list, tuple)):
            for child in node:
                walk(child)
    walk(normalized)
    return fps


def jaccard(set_a, set_b):
    if not set_a and not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union else 0.0


# ---------------------------------------------------------------------------
# Python parser + normalizer
# ---------------------------------------------------------------------------

def python_extract_blocks(source, filepath):
    try:
        tree = ast.parse(source, filename=filepath)
    except SyntaxError:
        return []

    blocks = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            name = node.name
            start = node.lineno
            end = node.end_lineno or start
            normalized = python_normalize(node)
            blocks.append({
                "name": name,
                "file": filepath,
                "start_line": start,
                "end_line": end,
                "nodes": node_count(normalized),
                "normalized": normalized,
                "fingerprints": fingerprints(normalized),
            })
        elif isinstance(node, ast.ClassDef):
            name = node.name
            start = node.lineno
            end = node.end_lineno or start
            normalized = python_normalize(node)
            blocks.append({
                "name": name,
                "file": filepath,
                "start_line": start,
                "end_line": end,
                "nodes": node_count(normalized),
                "normalized": normalized,
                "fingerprints": fingerprints(normalized),
            })
    return blocks


def python_normalize(node):
    if isinstance(node, ast.FunctionDef):
        return ("func", [python_normalize(c) for c in node.body])
    if isinstance(node, ast.AsyncFunctionDef):
        return ("async_func", [python_normalize(c) for c in node.body])
    if isinstance(node, ast.ClassDef):
        return ("class", [python_normalize(c) for c in node.body])

    if isinstance(node, ast.Return):
        return ("return", python_normalize(node.value) if node.value else "none")
    if isinstance(node, ast.Assign):
        return ("assign", [python_normalize(t) for t in node.targets],
                python_normalize(node.value))
    if isinstance(node, ast.AugAssign):
        return ("aug_assign", type(node.op).__name__,
                python_normalize(node.target), python_normalize(node.value))
    if isinstance(node, ast.AnnAssign):
        return ("ann_assign",
                python_normalize(node.target),
                python_normalize(node.value) if node.value else "none")

    if isinstance(node, ast.If):
        return ("if", python_normalize(node.test),
                [python_normalize(c) for c in node.body],
                [python_normalize(c) for c in node.orelse])
    if isinstance(node, ast.For):
        return ("for", python_normalize(node.target),
                python_normalize(node.iter),
                [python_normalize(c) for c in node.body])
    if isinstance(node, ast.AsyncFor):
        return ("async_for", python_normalize(node.target),
                python_normalize(node.iter),
                [python_normalize(c) for c in node.body])
    if isinstance(node, ast.While):
        return ("while", python_normalize(node.test),
                [python_normalize(c) for c in node.body])
    if isinstance(node, ast.With):
        return ("with",
                [python_normalize(i.context_expr) for i in node.items],
                [python_normalize(c) for c in node.body])
    if isinstance(node, ast.AsyncWith):
        return ("async_with",
                [python_normalize(i.context_expr) for i in node.items],
                [python_normalize(c) for c in node.body])
    if isinstance(node, ast.Try):
        handlers = [("handler", python_normalize(h.body)) for h in node.handlers] if hasattr(node, 'handlers') else []
        return ("try",
                [python_normalize(c) for c in node.body],
                handlers,
                [python_normalize(c) for c in node.orelse],
                [python_normalize(c) for c in node.finalbody])
    if isinstance(node, ast.Raise):
        return ("raise", python_normalize(node.exc) if node.exc else "none")
    if isinstance(node, ast.Assert):
        return ("assert", python_normalize(node.test))

    if isinstance(node, ast.Expr):
        return ("expr", python_normalize(node.value))

    # Expressions
    if isinstance(node, ast.Call):
        return ("call", python_normalize(node.func),
                [python_normalize(a) for a in node.args],
                [(kw.arg or "**", python_normalize(kw.value)) for kw in node.keywords])
    if isinstance(node, ast.Attribute):
        return ("attr", python_normalize(node.value))
    if isinstance(node, ast.Subscript):
        return ("subscript", python_normalize(node.value),
                python_normalize(node.slice))
    if isinstance(node, ast.Name):
        return "symbol"
    if isinstance(node, ast.Constant):
        return ("literal", type(node.value).__name__)
    if isinstance(node, ast.JoinedStr):
        return ("fstring", [python_normalize(v) for v in node.values])
    if isinstance(node, ast.FormattedValue):
        return ("format_value", python_normalize(node.value))

    if isinstance(node, ast.BoolOp):
        return (type(node.op).__name__,
                [python_normalize(v) for v in node.values])
    if isinstance(node, ast.BinOp):
        return (type(node.op).__name__,
                python_normalize(node.left), python_normalize(node.right))
    if isinstance(node, ast.UnaryOp):
        return (type(node.op).__name__, python_normalize(node.operand))
    if isinstance(node, ast.Compare):
        return ("compare",
                python_normalize(node.left),
                [(type(op).__name__, python_normalize(comp))
                 for op, comp in zip(node.ops, node.comparators)])
    if isinstance(node, ast.IfExp):
        return ("ifexp", python_normalize(node.test),
                python_normalize(node.body), python_normalize(node.orelse))

    if isinstance(node, ast.Lambda):
        return ("lambda", python_normalize(node.body))
    if isinstance(node, ast.Dict):
        return ("dict",
                [(python_normalize(k) if k else "none", python_normalize(v))
                 for k, v in zip(node.keys, node.values)])
    if isinstance(node, ast.List):
        return ("list", [python_normalize(e) for e in node.elts])
    if isinstance(node, ast.Tuple):
        return ("tuple", [python_normalize(e) for e in node.elts])
    if isinstance(node, ast.Set):
        return ("set", [python_normalize(e) for e in node.elts])
    if isinstance(node, ast.ListComp):
        return ("listcomp", python_normalize(node.elt),
                [python_normalize_comp(g) for g in node.generators])
    if isinstance(node, ast.SetComp):
        return ("setcomp", python_normalize(node.elt),
                [python_normalize_comp(g) for g in node.generators])
    if isinstance(node, ast.DictComp):
        return ("dictcomp", python_normalize(node.key),
                python_normalize(node.value),
                [python_normalize_comp(g) for g in node.generators])
    if isinstance(node, ast.GeneratorExp):
        return ("genexp", python_normalize(node.elt),
                [python_normalize_comp(g) for g in node.generators])

    if isinstance(node, ast.Starred):
        return ("starred", python_normalize(node.value))
    if isinstance(node, ast.Yield):
        return ("yield", python_normalize(node.value) if node.value else "none")
    if isinstance(node, ast.YieldFrom):
        return ("yield_from", python_normalize(node.value))
    if isinstance(node, ast.Await):
        return ("await", python_normalize(node.value))

    if isinstance(node, ast.Slice):
        return ("slice",
                python_normalize(node.lower) if node.lower else "none",
                python_normalize(node.upper) if node.upper else "none",
                python_normalize(node.step) if node.step else "none")

    if isinstance(node, ast.Pass):
        return "pass"
    if isinstance(node, ast.Break):
        return "break"
    if isinstance(node, ast.Continue):
        return "continue"

    if isinstance(node, list):
        return [python_normalize(c) for c in node]

    return "other"


def python_normalize_comp(gen):
    return ("comprehension",
            python_normalize(gen.target),
            python_normalize(gen.iter),
            [python_normalize(i) for i in gen.ifs])


# ---------------------------------------------------------------------------
# JS/TS token-based structural parser + normalizer
#
# Since we can't rely on tree-sitter or node.js being installed, we use a
# brace-aware tokenizer that identifies function boundaries and normalizes
# the token stream structurally — preserving keywords/operators/shape while
# replacing identifiers and literals with generic markers.
# ---------------------------------------------------------------------------

# Tokens we preserve as structural (keywords, operators, punctuation)
JSTS_KEYWORDS = {
    "function", "class", "const", "let", "var", "if", "else", "for",
    "while", "do", "switch", "case", "default", "break", "continue",
    "return", "throw", "try", "catch", "finally", "new", "delete",
    "typeof", "instanceof", "in", "of", "void", "yield", "await",
    "async", "import", "export", "from", "extends", "implements",
    "interface", "type", "enum", "namespace", "abstract", "static",
    "public", "private", "protected", "readonly", "override",
    "get", "set", "super", "this", "true", "false", "null", "undefined",
}

JSTS_TOKEN_RE = re.compile(
    r"""
    //[^\n]*                          |  # line comment
    /\*[\s\S]*?\*/                    |  # block comment
    "(?:[^"\\]|\\.)*"                 |  # double-quoted string
    '(?:[^'\\]|\\.)*'                 |  # single-quoted string
    `(?:[^`\\]|\\.)*`                 |  # template literal (simplified)
    /(?![/*])(?:[^/\\\n]|\\.)+/[gimsuy]* |  # regex literal (heuristic)
    =>                                |  # arrow
    \.\.\.                            |  # spread
    [!=]==?                           |  # equality
    [<>]=?                            |  # comparison
    &&|\|\||\?\?                      |  # logical
    \?\.|\.                           |  # optional chain / member
    [+\-*/%&|^~!?:;,=]               |  # operators
    [{}\[\]()]                        |  # brackets
    0[xX][0-9a-fA-F_]+               |  # hex literal
    0[oO][0-7_]+                      |  # octal literal
    0[bB][01_]+                       |  # binary literal
    \d[\d_.]*(?:[eE][+-]?\d+)?        |  # number
    [a-zA-Z_$][a-zA-Z0-9_$]*         |  # identifier
    \n                                |  # newline (for line tracking)
    \S                                   # anything else
    """,
    re.VERBOSE,
)


def jsts_tokenize(source):
    tokens = []
    line = 1
    for m in JSTS_TOKEN_RE.finditer(source):
        tok = m.group()
        if tok == "\n":
            line += 1
            continue
        if tok.startswith("//") or tok.startswith("/*"):
            line += tok.count("\n")
            continue
        tokens.append((tok, line))
        line += tok.count("\n")
    return tokens


def jsts_extract_blocks(source, filepath):
    tokens = jsts_tokenize(source)
    blocks = []
    i = 0
    n = len(tokens)

    while i < n:
        tok, line = tokens[i]

        # Named function: function name(...)
        if tok == "function" and i + 1 < n and tokens[i + 1][0] not in {"(", "*"}:
            name = tokens[i + 1][0]
            start_line = line
            brace_start = _find_next(tokens, i, "{")
            if brace_start is not None:
                end_idx, end_line = _match_brace(tokens, brace_start)
                if end_idx is not None:
                    block_tokens = tokens[i:end_idx + 1]
                    normalized = jsts_normalize_tokens(block_tokens)
                    blocks.append({
                        "name": name,
                        "file": filepath,
                        "start_line": start_line,
                        "end_line": end_line,
                        "nodes": node_count(normalized),
                        "normalized": normalized,
                        "fingerprints": fingerprints(normalized),
                    })
                    i = end_idx + 1
                    continue

        # Arrow / anonymous assigned: const name = ... => or const name = function
        if tok in {"const", "let", "var"} and i + 1 < n:
            name = tokens[i + 1][0]
            eq_idx = _find_next(tokens, i + 1, "=", limit=4)
            if eq_idx is not None and tokens[eq_idx][0] == "=":
                start_line = line
                # Look for arrow or function keyword after =
                body_start = eq_idx + 1
                if body_start < n:
                    brace_or_arrow = _find_function_body(tokens, body_start)
                    if brace_or_arrow is not None:
                        brace_idx = _find_next(tokens, brace_or_arrow, "{")
                        if brace_idx is not None:
                            end_idx, end_line = _match_brace(tokens, brace_idx)
                            if end_idx is not None:
                                block_tokens = tokens[i:end_idx + 1]
                                normalized = jsts_normalize_tokens(block_tokens)
                                blocks.append({
                                    "name": name,
                                    "file": filepath,
                                    "start_line": start_line,
                                    "end_line": end_line,
                                    "nodes": node_count(normalized),
                                    "normalized": normalized,
                                    "fingerprints": fingerprints(normalized),
                                })
                                i = end_idx + 1
                                continue

        # Class methods / object methods: name(...) { or async name(...) {
        # Also handles: export default function, export function, async function
        if tok in {"export", "async"}:
            # skip modifiers, try to find function/class
            j = i + 1
            while j < n and tokens[j][0] in {"default", "async", "export"}:
                j += 1
            if j < n and tokens[j][0] == "function" and j + 1 < n:
                name_idx = j + 1
                if tokens[name_idx][0] == "*":
                    name_idx += 1
                if name_idx < n and tokens[name_idx][0] not in {"(", "{"}:
                    name = tokens[name_idx][0]
                    start_line = line
                    brace_start = _find_next(tokens, name_idx, "{")
                    if brace_start is not None:
                        end_idx, end_line = _match_brace(tokens, brace_start)
                        if end_idx is not None:
                            block_tokens = tokens[i:end_idx + 1]
                            normalized = jsts_normalize_tokens(block_tokens)
                            blocks.append({
                                "name": name,
                                "file": filepath,
                                "start_line": start_line,
                                "end_line": end_line,
                                "nodes": node_count(normalized),
                                "normalized": normalized,
                                "fingerprints": fingerprints(normalized),
                            })
                            i = end_idx + 1
                            continue
            if j < n and tokens[j][0] == "class":
                name = tokens[j + 1][0] if j + 1 < n else "anonymous"
                start_line = line
                brace_start = _find_next(tokens, j, "{")
                if brace_start is not None:
                    end_idx, end_line = _match_brace(tokens, brace_start)
                    if end_idx is not None:
                        block_tokens = tokens[i:end_idx + 1]
                        normalized = jsts_normalize_tokens(block_tokens)
                        blocks.append({
                            "name": name,
                            "file": filepath,
                            "start_line": start_line,
                            "end_line": end_line,
                            "nodes": node_count(normalized),
                            "normalized": normalized,
                            "fingerprints": fingerprints(normalized),
                        })
                        i = end_idx + 1
                        continue

        # class Foo { ... }
        if tok == "class" and i + 1 < n:
            name = tokens[i + 1][0]
            start_line = line
            brace_start = _find_next(tokens, i, "{")
            if brace_start is not None:
                end_idx, end_line = _match_brace(tokens, brace_start)
                if end_idx is not None:
                    block_tokens = tokens[i:end_idx + 1]
                    normalized = jsts_normalize_tokens(block_tokens)
                    blocks.append({
                        "name": name,
                        "file": filepath,
                        "start_line": start_line,
                        "end_line": end_line,
                        "nodes": node_count(normalized),
                        "normalized": normalized,
                        "fingerprints": fingerprints(normalized),
                    })
                    i = end_idx + 1
                    continue

        i += 1

    return blocks


def _find_next(tokens, start, target, limit=None):
    end = len(tokens) if limit is None else min(start + limit, len(tokens))
    for i in range(start, end):
        if tokens[i][0] == target:
            return i
    return None


def _match_brace(tokens, brace_idx):
    depth = 0
    for i in range(brace_idx, len(tokens)):
        tok = tokens[i][0]
        if tok == "{":
            depth += 1
        elif tok == "}":
            depth -= 1
            if depth == 0:
                return i, tokens[i][1]
    return None, None


def _find_function_body(tokens, start):
    i = start
    n = len(tokens)
    paren_depth = 0
    seen_paren = False

    while i < n:
        tok = tokens[i][0]
        if tok == "function":
            return i
        if tok == "(":
            paren_depth += 1
            seen_paren = True
        elif tok == ")":
            paren_depth -= 1
            if paren_depth == 0 and seen_paren:
                # After closing paren, look for => or {
                j = i + 1
                while j < n and tokens[j][0] in {":", "=>"}:
                    if tokens[j][0] == "=>":
                        return j
                    j += 1
                # Might have return type annotation: ): Type => {
                # skip tokens until => or {
                while j < n:
                    if tokens[j][0] == "=>" or tokens[j][0] == "{":
                        return j
                    if tokens[j][0] in {";", "\n", "}", ")"}:
                        break
                    j += 1
                return None
        elif tok == "{" and not seen_paren:
            return None
        i += 1
    return None


def jsts_normalize_tokens(tokens):
    result = []
    for tok, _line in tokens:
        if tok in JSTS_KEYWORDS or tok in {
            "{", "}", "[", "]", "(", ")", ";", ",", ":", ".",
            "=>", "...", "=", "==", "===", "!=", "!==",
            "<", ">", "<=", ">=", "+", "-", "*", "/", "%",
            "&&", "||", "??", "?.", "!", "?", "&", "|", "^", "~",
        }:
            result.append(tok)
        elif tok.startswith('"') or tok.startswith("'") or tok.startswith("`"):
            result.append(":string")
        elif tok[0].isdigit() or (tok.startswith("0") and len(tok) > 1):
            result.append(":number")
        elif tok.startswith("/") and not tok.startswith("//"):
            result.append(":regex")
        else:
            result.append(":ident")
    return tuple(result)


# ---------------------------------------------------------------------------
# Core duplicate detection (language-agnostic)
# ---------------------------------------------------------------------------

def find_duplicates(files, threshold=0.82, min_lines=4, min_nodes=20):
    entries = []
    for filepath, lang in files:
        try:
            source = Path(filepath).read_text(encoding="utf-8", errors="replace")
        except (OSError, UnicodeDecodeError):
            continue

        if lang == "python":
            blocks = python_extract_blocks(source, filepath)
        elif lang == "jsts":
            blocks = jsts_extract_blocks(source, filepath)
        else:
            continue

        for block in blocks:
            line_span = block["end_line"] - block["start_line"] + 1
            if line_span >= min_lines and block["nodes"] >= min_nodes:
                entries.append(block)

    candidates = []
    n = len(entries)
    for i in range(n):
        for j in range(i + 1, n):
            left = entries[i]
            right = entries[j]

            # Skip same location
            if (left["file"] == right["file"]
                    and left["start_line"] == right["start_line"]):
                continue

            score = jaccard(left["fingerprints"], right["fingerprints"])
            if score >= threshold:
                candidates.append({
                    "score": round(score, 4),
                    "left": {
                        "file": left["file"],
                        "name": left["name"],
                        "start_line": left["start_line"],
                        "end_line": left["end_line"],
                    },
                    "right": {
                        "file": right["file"],
                        "name": right["name"],
                        "start_line": right["start_line"],
                        "end_line": right["end_line"],
                    },
                    "left_nodes": left["nodes"],
                    "right_nodes": right["nodes"],
                })

    candidates.sort(key=lambda c: (
        -c["score"],
        c["left"]["file"],
        c["left"]["start_line"],
        c["right"]["file"],
        c["right"]["start_line"],
    ))
    return candidates


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

def line_range(loc):
    return f"{loc['file']}:{loc['start_line']}-{loc['end_line']}"


def format_text(candidates):
    if not candidates:
        return "No duplicate candidates found."
    lines = []
    for c in candidates:
        lines.append(
            f"DUPLICATE score={c['score']:.2f}\n"
            f"  {c['left']['name']}  {line_range(c['left'])}\n"
            f"  {c['right']['name']}  {line_range(c['right'])}"
        )
    return "\n\n".join(lines)


# ---------------------------------------------------------------------------
# .dryignore support
# ---------------------------------------------------------------------------

def load_dryignore(base_dir):
    ignore_path = Path(base_dir) / ".dryignore"
    if not ignore_path.exists():
        return [], []
    include = []
    exclude = []
    for raw_line in ignore_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("!"):
            include.append(line[1:])
        else:
            exclude.append(line)
    return exclude, include


def is_ignored(filepath, base_dir, exclude_patterns, include_patterns):
    from fnmatch import fnmatch
    rel = os.path.relpath(filepath, base_dir)
    name = os.path.basename(filepath)

    matched = False
    for pat in exclude_patterns:
        if "/" in pat:
            if fnmatch(rel, pat) or rel.startswith(pat.rstrip("/")):
                matched = True
                break
        else:
            if fnmatch(name, pat) or fnmatch(rel, f"**/{pat}") or f"/{pat}/" in f"/{rel}":
                matched = True
                break
            # Check directory components
            parts = Path(rel).parts
            for part in parts[:-1]:
                if fnmatch(part, pat.rstrip("/")):
                    matched = True
                    break
            if matched:
                break

    if matched:
        for pat in include_patterns:
            if "/" in pat:
                if fnmatch(rel, pat):
                    return False
            else:
                if fnmatch(name, pat):
                    return False
        return True
    return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Find structural duplicates in Python and JS/TS codebases."
    )
    parser.add_argument(
        "paths", nargs="*", default=["."],
        help="Files or directories to scan (default: current directory)"
    )
    parser.add_argument(
        "--threshold", type=float, default=0.82,
        help="Minimum Jaccard similarity score (default: 0.82)"
    )
    parser.add_argument(
        "--min-lines", type=int, default=4,
        help="Minimum source lines in a candidate block (default: 4)"
    )
    parser.add_argument(
        "--min-nodes", type=int, default=20,
        help="Minimum normalized syntax nodes (default: 20)"
    )
    parser.add_argument(
        "-f", "--format", choices=["text", "json"], default="text",
        help="Output format (default: text)"
    )
    parser.add_argument(
        "--language", choices=["python", "jsts"],
        help="Restrict to a single language (default: scan both)"
    )
    parser.add_argument(
        "--top", type=int, default=0,
        help="Show only the top N worst pairs (default: all)"
    )
    parser.add_argument(
        "--base-dir", default=".",
        help="Base directory for .dryignore resolution (default: .)"
    )

    args = parser.parse_args()

    exclude_pats, include_pats = load_dryignore(args.base_dir)

    files = collect_files(args.paths, language=args.language)

    if exclude_pats:
        files = [
            (fp, lang) for fp, lang in files
            if not is_ignored(fp, args.base_dir, exclude_pats, include_pats)
        ]

    candidates = find_duplicates(
        files,
        threshold=args.threshold,
        min_lines=args.min_lines,
        min_nodes=args.min_nodes,
    )

    if args.top > 0:
        candidates = candidates[:args.top]

    if args.format == "json":
        output = {
            "threshold": args.threshold,
            "min_lines": args.min_lines,
            "min_nodes": args.min_nodes,
            "files_scanned": len(files),
            "candidates": candidates,
        }
        json.dump(output, sys.stdout, indent=2)
        print()
    else:
        print(format_text(candidates))


if __name__ == "__main__":
    main()
