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
