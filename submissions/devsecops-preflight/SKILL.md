---
name: devsecops-preflight
description: "Use this skill when the user asks to add security scanning (SAST, secret scan, dependency scan, image scan, SBOM) to their CI pipeline."
---

# DevSecOps Preflight

## When to invoke

The user wants a "security preflight" gate that runs before merge or deploy.

## The five checks

1. **Secret scanning** — Gitleaks or `trufflehog`. Fail on any high-confidence finding.
2. **SAST** — Semgrep (`p/ci` + language-specific rulesets) or CodeQL.
3. **Dependency scan** — `npm audit --production`, `pip-audit`, `osv-scanner`, or Dependabot alerts.
4. **Container image scan** — Trivy against the built image. Fail on CRITICAL by default, warn on HIGH.
5. **SBOM** — Syft to generate a CycloneDX or SPDX SBOM. Attach as workflow artifact.

## Skeleton (GitHub Actions)

```yaml
name: Security Preflight
on:
  pull_request:
  push: { branches: [main] }

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2

      - name: SAST (Semgrep)
        uses: semgrep/semgrep-action@v1
        with: { config: p/ci }

      - name: Dependency audit
        run: npm ci && npm audit --omit=dev --audit-level=high

      - name: Build image
        run: docker build -t app:pr .

      - name: Image scan (Trivy)
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: app:pr
          severity: CRITICAL
          exit-code: 1

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: app:pr
          format: cyclonedx-json
```

## Process

1. Ask which checks are already in place (don't duplicate).
2. Add the missing ones. Fail on CRITICAL only initially; ratchet up to HIGH once the backlog is cleared.
3. Attach SBOM as an artifact so downstream tools (image signing, VEX) can consume it.

