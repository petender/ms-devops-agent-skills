---
learningObjectives:
  - "Compose a five-check security preflight into an existing CI workflow."
  - "Distinguish blocking from advisory findings."
  - "Produce an SBOM as a CI artifact."
prerequisites:
  - "A repo with a working CI workflow and a Dockerfile"
demoScriptMinutes: 20
exercises:
  - title: "Add the preflight job"
    durationMinutes: 30
    summary: "Add the security preflight to an existing repo and drive it green."
discussionQuestions:
  - "How do you triage a HIGH finding that has no fix upstream?"
  - "Where does the SBOM live long-term?"
commonPitfalls:
  - "Failing on all severities from day 1 — the pipeline never goes green."
  - "Skipping the image scan because the SAST already ran."
slideTalkingPoints:
  - "Shift-left, but don't shift-blame — start advisory, then enforce."
  - "SBOM is the receipt."
---

Trainer notes for **DevSecOps Preflight**. See SKILL.md and copilot.instructions.md for the agent-facing content.
