# CRAP Check GitHub Actions -- Reference

## Coverage setup per language

### Python

**Dependencies**: `coverage` (pip)

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.x'
- run: pip install coverage
- run: coverage run -m pytest
- run: coverage json -o coverage.json
```

Coverage file: `coverage.json`

### JavaScript / TypeScript (Jest)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm ci
- run: npx jest --coverage --coverageReporters=lcov
```

Coverage file: `coverage/lcov.info`

### JavaScript / TypeScript (Vitest)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm ci
- run: npx vitest run --coverage --coverage.reporter=lcov
```

Coverage file: `coverage/lcov.info`

### JavaScript / TypeScript (c8 / nyc)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm ci
- run: npx c8 --reporter=lcov npm test
```

Coverage file: `coverage/lcov.info`

### Go

```yaml
- uses: actions/setup-go@v5
  with:
    go-version: 'stable'
- run: go test -coverprofile=coverage.out ./...
- run: go install github.com/jandelgado/gcov2lcov@latest
- run: gcov2lcov -infile=coverage.out -outfile=coverage.info
```

Coverage file: `coverage.info`

### Java (Maven + JaCoCo)

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '21'
- run: mvn test jacoco:report
```

Coverage file: `target/site/jacoco/jacoco.xml`

### Java (Gradle + JaCoCo)

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '21'
- run: ./gradlew test jacocoTestReport
```

Coverage file: `build/reports/jacoco/test/jacocoTestReport.xml`

## generate_workflow.py usage

```bash
python3 scripts/generate_workflow.py \
  --language python \
  --test-cmd "coverage run -m pytest" \
  --coverage-cmd "coverage json -o coverage.json" \
  --coverage-file coverage.json \
  --source-dirs src \
  --triggers pull_request push \
  --threshold 30 \
  --fail-on-threshold \
  --python-version "3.x" \
  --output .github/workflows/crap-check.yml
```

| Flag | Description | Default |
|------|-------------|---------|
| `--language` | `python`, `node`, `go`, `java-maven`, `java-gradle` | required |
| `--test-cmd` | Command to run tests with coverage | auto from language |
| `--coverage-cmd` | Command to produce coverage report | auto from language |
| `--coverage-file` | Path to coverage report output | auto from language |
| `--source-dirs` | Space-separated source directories | `.` |
| `--triggers` | Space-separated: `pull_request`, `push`, `schedule`, `workflow_dispatch` | `pull_request` |
| `--target-branches` | Branches for PR/push triggers | `main master` |
| `--threshold` | CRAP score threshold | `30` |
| `--fail-on-threshold` / `--warn-only` | Enforcement mode | `--fail-on-threshold` |
| `--python-version` | Python version for setup-python step | `3.x` |
| `--node-version` | Node version for setup-node step | `20` |
| `--java-version` | Java version for setup-java step | `21` |
| `--go-version` | Go version for setup-go step | `stable` |
| `--output` | Output file path | stdout |

## Pre-commit hook

When the user opts in, write this script to `.git/hooks/pre-commit` (and `chmod +x` it). If a pre-commit hook already exists, append the CRAP check as a new section rather than overwriting.

```bash
#!/usr/bin/env bash
# CRAP Score pre-commit check
# Runs tests with coverage and checks CRAP threshold before allowing commit.

set -e

echo "Running CRAP score check..."

# -- Adjust these for the project --
# TEST_CMD="coverage run -m pytest"
# COVERAGE_CMD="coverage json -o coverage.json"
# COVERAGE_FILE="coverage.json"
# SOURCE_DIRS="src"
# THRESHOLD=30
# -----------------------------------

$TEST_CMD
if [ -n "$COVERAGE_CMD" ]; then
  $COVERAGE_CMD
fi

RESULT=$(python3 scripts/crap_score.py $SOURCE_DIRS -c $COVERAGE_FILE -t $THRESHOLD -f json -b .)
CRAPPY=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['crappy_functions'])")

if [ "$CRAPPY" -gt 0 ]; then
  echo "$RESULT" | python3 -c "
import sys, json
r = json.load(sys.stdin)
print(f\"CRAP check FAILED: {r['crappy_functions']} function(s) exceed threshold {r['threshold']}\")
for fn in r['functions']:
    if fn['crap_score'] > r['threshold']:
        print(f\"  {fn['crap_score']:>8.1f}  {fn['file']}:{fn['start_line']} {fn['name']}\")
"
  exit 1
fi

echo "CRAP check passed."
```

When generating the hook, replace the placeholder variables with the actual project values detected in Step 1.

**Alternative: pre-commit framework**

If the project uses the [pre-commit](https://pre-commit.com/) framework (has a `.pre-commit-config.yaml`), add a local hook instead:

```yaml
- repo: local
  hooks:
    - id: crap-check
      name: CRAP Score Check
      entry: bash -c 'TEST_CMD && python3 scripts/crap_score.py SOURCE_DIRS -c COVERAGE_FILE -t THRESHOLD -f text -b .'
      language: system
      pass_filenames: false
      stages: [pre-commit]
```

## .crapignore

The CRAP calculator respects a `.crapignore` file in the project root. Syntax is gitignore-like:

```
# Directories to skip entirely
vendor/
dist/
build/
node_modules/
.venv/
__pycache__/

# Generated code
*.gen.go
*.generated.ts
src/generated/

# Test fixtures / helpers (not production code)
testdata/
fixtures/

# Negate -- include even if matched above
!vendor/critical_patch.py
```

Rules:
- Blank lines and `#` comments are ignored
- `!` at start negates a previous match (re-includes the file)
- Patterns without `/` match against filenames and directory names
- Patterns with `/` match against the full relative path
- Trailing `/` is stripped (matches both files and directories with that name)

### Language-specific defaults

| Language | Suggested .crapignore entries |
|----------|------------------------------|
| Python | `.venv/`, `__pycache__/`, `migrations/`, `*_pb2.py` |
| Node/JS/TS | `node_modules/`, `dist/`, `build/`, `.next/`, `*.min.js` |
| Go | `vendor/`, `*_generated.go`, `*.pb.go` |
| Java | `build/`, `target/`, `*.class` |

## Suggested .gitignore additions

```
# Coverage artifacts
coverage/
coverage.json
coverage.info
coverage.out
*.lcov
htmlcov/
.coverage
```

## PR comment format

When `--warn-only` is used, the workflow posts a PR comment like:

```markdown
## CRAP Score Report

**Threshold**: 30 | **Total functions**: 142 | **CRAPpy**: 3

| CRAP | Complexity | Coverage | Function |
|------|-----------|----------|----------|
| 72.8 | 12 | 25.0% | src/orders.py:15 processOrder |
| 42.0 | 8 | 10.0% | src/auth.py:30 validateToken |
| 31.5 | 6 | 5.0% | src/utils.py:88 parseConfig |

3 function(s) exceed threshold. Consider refactoring or adding tests.
```
