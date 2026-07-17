# Security Policy

## Supported versions

The `main` branch is the only supported version. Fixes ship as ordinary PRs.

## Reporting a vulnerability

Please **do not open a public issue** for security concerns.

Instead, email the maintainers via GitHub's private vulnerability reporting:
<https://github.com/petender/ms-devops-agent-skills/security/advisories/new>.

Include:
- A description of the issue and its impact.
- Steps to reproduce (a minimal repro repo is ideal).
- Any suggested mitigation.

We aim to acknowledge reports within **72 hours** and issue a fix or mitigation within **14 days** for high-severity issues.

## What is in scope

- The Astro site itself (XSS, injection, dependency issues).
- The build/import scripts (`scripts/*.mjs`).
- The CI/deploy workflows (`.github/workflows/*.yml`).

## What is out of scope

- Vulnerabilities in third-party tools referenced by skill content (e.g. `az`, `kubectl`, `terraform`). Report those upstream.
- Skill content that is intentionally illustrative (e.g. an insecure `Dockerfile` used as a "before" example in a hardening skill).

## Do not commit

- Real credentials, tokens, or keys — not in `assets/`, `scripts/`, or the site.
- Customer data, internal architecture diagrams, or anything under NDA.
