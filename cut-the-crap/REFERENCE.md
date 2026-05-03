# CRAP Score Reference

## Formula

```
CRAP(m) = comp(m)^2 * (1 - cov(m)/100)^3 + comp(m)
```

- **comp(m)** = cyclomatic complexity of method m
- **cov(m)** = automated test coverage percentage (0-100) for method m

## Score behaviour

| Coverage | Formula reduces to | Implication |
|----------|-------------------|-------------|
| 100% | `comp(m)` | Risk scales linearly with complexity |
| 0% | `comp(m)^2 + comp(m)` | Risk scales quadratically -- write tests |
| 50% | `comp(m)^2 * 0.125 + comp(m)` | Moderate penalty |

**Threshold**: CRAP > 30 is considered unacceptable.

Quick reference -- max complexity before CRAPpy at given coverage:

| Coverage % | Max complexity to stay under 30 |
|-----------|-------------------------------|
| 0% | 5 |
| 50% | 8 |
| 75% | 14 |
| 85% | 21 |
| 100% | 30 (any complexity is ok if fully tested) |

## Generating coverage reports

### Python
```bash
# coverage.py JSON (preferred)
pip install coverage
coverage run -m pytest && coverage json -o coverage.json

# or lcov
pip install coverage
coverage run -m pytest && coverage lcov -o coverage.info
```

### JavaScript / TypeScript
```bash
# c8 (Node.js native coverage)
npx c8 --reporter=lcov npm test       # produces coverage/lcov.info

# nyc / istanbul
npx nyc --reporter=lcov npm test       # produces coverage/lcov.info

# jest
npx jest --coverage --coverageReporters=lcov  # produces coverage/lcov.info

# vitest
npx vitest --coverage --coverage.reporter=lcov
```

### Java
```bash
# Maven + JaCoCo (produces target/site/jacoco/jacoco.xml -- Cobertura-compatible)
mvn test jacoco:report

# Gradle + JaCoCo
./gradlew test jacocoTestReport
```

### Go
```bash
go test -coverprofile=coverage.out ./...
# Convert to lcov if needed:
go install github.com/jandelgado/gcov2lcov@latest
gcov2lcov -infile=coverage.out -outfile=coverage.info
```

## Script usage

```bash
python3 scripts/crap_score.py <sources> -c <coverage_file> [options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `sources` | Source files or directories (positional, 1+) | required |
| `-c, --coverage` | Path to coverage report | required |
| `-t, --threshold` | CRAP threshold | 30.0 |
| `-f, --format` | Output format: `json` or `text` | text |
| `--top N` | Show only top N worst offenders | all |
| `-b, --base-dir` | Base directory for path resolution | `.` |

### JSON output schema

```json
{
  "threshold": 30.0,
  "total_functions": 42,
  "crappy_functions": 5,
  "functions": [
    {
      "name": "processOrder",
      "file": "src/orders.py",
      "start_line": 15,
      "end_line": 80,
      "complexity": 12,
      "coverage": 25.0,
      "crap_score": 72.75
    }
  ]
}
```

## Reduction strategies

### Lowering complexity

| Pattern | Before | After | Complexity change |
|---------|--------|-------|-------------------|
| Extract method | Large function with nested ifs | Several small focused functions | Splits across functions |
| Guard clauses / early return | Deeply nested if-else | Flat function with early exits | -1 per extracted guard |
| Replace conditional with polymorphism | switch/case on type | Strategy/visitor pattern | Moves branches to dispatch |
| Simplify boolean expressions | `if (a && b \|\| c && !d)` | Named boolean variables | Clarifies, may reduce |
| Replace loop with pipeline | Manual loop with accumulators | map/filter/reduce chain | Often -1 to -3 |
| Decompose conditional | `if (complex_expr)` | `if is_valid_order(order)` | Moves complexity to helper |

### Increasing coverage

| Situation | Action |
|-----------|--------|
| Function never called in tests | Write a basic happy-path test |
| Only happy path tested | Add edge case and error path tests |
| Complex branches untested | Write parameterised tests hitting each branch |
| Private helper untested | Test through public interface or extract + test |
| External dependency blocks testing | Introduce interface/mock at boundary |

### Combined approach (most effective)

1. Write characterisation tests for the function as-is (raises coverage)
2. Refactor to reduce complexity (lowers comp)
3. Run CRAP script to confirm improvement
4. Add any missing tests for new structure
