# DRY Check Reference

## Algorithm

Ported from [Uncle Bob's dry4clj](https://github.com/unclebob/dry4clj). The algorithm works in four stages:

### 1. Parse

Extract function-level blocks from source files.

| Language | Method | Blocks extracted |
|----------|--------|-----------------|
| Python | `ast.parse` (stdlib) | `def`, `async def`, `class` bodies |
| JS/TS | Token-based brace matching | `function`, arrow functions assigned to `const`/`let`/`var`, `class`, exported functions |

### 2. Normalise

Replace incidental details with generic markers while preserving structural shape.

**Python** — walks the AST and replaces:
- Variable names → `"symbol"`
- Literals → `("literal", type_name)` (preserves type but not value)
- Control flow keywords, collection types, operator types → preserved as-is

**JS/TS** — normalises the token stream:
- Identifiers → `":ident"`
- String literals → `":string"`
- Number literals → `":number"`
- Regex literals → `":regex"`
- Keywords, operators, brackets → preserved as-is

### 3. Fingerprint

Walk the normalised tree and collect the string representation of every subtree (including the root) into a **set**. Each normalised function produces one fingerprint set.

### 4. Compare

For every pair of blocks, compute **Jaccard similarity**:

```
score = |A ∩ B| / |A ∪ B|
```

Where A and B are the fingerprint sets of the two blocks. Pairs scoring above the threshold are reported as candidates.

## Score interpretation

| Score | Meaning | Typical action |
|-------|---------|----------------|
| 1.00 | Structurally identical | Almost certainly should unify |
| 0.95–0.99 | Near-clone, trivial delta | Unify with a parameter for the difference |
| 0.90–0.94 | Close match, small divergence | Review — likely worth unifying |
| 0.82–0.89 | Shared core, some unique structure | Review — may or may not be worth unifying |
| < 0.82 | Below default threshold | Not reported unless threshold is lowered |

## CLI usage

```bash
python3 scripts/dry_check.py <sources> [options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `sources` | Source files or directories (positional, 0+) | `.` |
| `--threshold` | Minimum Jaccard similarity score | 0.82 |
| `--min-lines` | Minimum source lines per block | 4 |
| `--min-nodes` | Minimum normalised syntax nodes per block | 20 |
| `-f, --format` | Output format: `text` or `json` | text |
| `--language` | Restrict to `python` or `jsts` | both |
| `--top N` | Show only top N worst pairs | all |
| `--base-dir` | Base directory for `.dryignore` resolution | `.` |

### JSON output schema

```json
{
  "threshold": 0.82,
  "min_lines": 4,
  "min_nodes": 20,
  "files_scanned": 42,
  "candidates": [
    {
      "score": 0.95,
      "left": {
        "file": "src/billing/invoice.py",
        "name": "process_invoices",
        "start_line": 12,
        "end_line": 28
      },
      "right": {
        "file": "src/billing/receipt.py",
        "name": "process_receipts",
        "start_line": 8,
        "end_line": 24
      },
      "left_nodes": 88,
      "right_nodes": 91
    }
  ]
}
```

### Text output

```
DUPLICATE score=0.95
  process_invoices  src/billing/invoice.py:12-28
  process_receipts  src/billing/receipt.py:8-24
```

## Auto-skipped directories

The scanner automatically ignores these directories:

`node_modules`, `.git`, `__pycache__`, `.venv`, `venv`, `dist`, `build`, `.next`, `.nuxt`, `coverage`

## Refactoring patterns

### Exact clones (score ~1.0)

Two functions with identical structure but different names/values. Extract the shared body into a single function parameterised by the differing inputs.

```python
# Before
def process_orders(orders):
    paid = [o for o in orders if o.paid]
    sorted_items = sorted(paid, key=lambda o: o.date)
    return {"count": len(sorted_items), "total": sum(o.amount for o in sorted_items)}

def process_receipts(receipts):
    closed = [r for r in receipts if r.closed]
    sorted_items = sorted(closed, key=lambda r: r.date)
    return {"count": len(sorted_items), "total": sum(r.amount for r in sorted_items)}

# After
def summarise_items(items, predicate):
    filtered = [x for x in items if predicate(x)]
    sorted_items = sorted(filtered, key=lambda x: x.date)
    return {"count": len(sorted_items), "total": sum(x.amount for x in sorted_items)}

process_orders = lambda orders: summarise_items(orders, lambda o: o.paid)
process_receipts = lambda receipts: summarise_items(receipts, lambda r: r.closed)
```

### Near-clones (score 0.90–0.99)

One function has a small extra branch or step. Identify the delta and make it a parameter or optional argument.

### Strategy pattern (behavioural variation)

When the structure is shared but the *operations* differ, use higher-order functions or a strategy object:

```typescript
// Before: two functions that filter/map/reduce with different predicates
// After: one function that takes the varying operations as parameters
function processItems<T>(
  items: T[],
  filter: (x: T) => boolean,
  transform: (x: T) => number,
): Summary {
  const filtered = items.filter(filter);
  const values = filtered.map(transform);
  return { count: filtered.length, total: values.reduce((a, b) => a + b, 0) };
}
```
