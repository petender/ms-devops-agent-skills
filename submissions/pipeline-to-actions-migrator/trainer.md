---
learningObjectives:
  - "Map Azure DevOps YAML constructs to GitHub Actions equivalents."
  - "Replace service connections with OIDC federated credentials."
  - "Produce a migration report that surfaces semantic gaps."
prerequisites:
  - "An existing azure-pipelines.yml"
  - "A GitHub repo the pipeline should move to"
demoScriptMinutes: 20
exercises:
  - title: "Port a build+deploy pipeline"
    durationMinutes: 45
    summary: "Migrate a two-stage ADO pipeline (build → deploy) to a GHA workflow with an OIDC-federated deploy."
discussionQuestions:
  - "Which ADO features have no clean GHA equivalent?"
  - "When is a full rewrite better than a migration?"
commonPitfalls:
  - "Hard-coding secret values instead of secret names."
  - "Losing artifact retention rules silently."
slideTalkingPoints:
  - "ADO stages ≈ GHA jobs with `needs:`."
  - "OIDC eliminates long-lived service principal secrets."
---

Trainer notes for **Azure Pipelines → GitHub Actions Migrator**. See SKILL.md and copilot.instructions.md for the agent-facing content.
