---
learningObjectives:
  - "Structure a runbook that a fresh on-call can execute."
  - "Separate mitigation from root cause."
  - "Extract additional monitoring signals from an incident."
prerequisites:
  - "One real or hypothetical alert"
  - "A monitoring system to reference"
demoScriptMinutes: 15
exercises:
  - title: "Author a runbook from an alert"
    durationMinutes: 30
    summary: "Take a \"high 5xx rate\" alert and produce a full runbook including mitigation and communication."
discussionQuestions:
  - "How often should runbooks be exercised?"
  - "What belongs in the runbook vs the postmortem?"
commonPitfalls:
  - "Runbooks that try to root-cause."
  - "Commands that require the reader to substitute values in three places."
slideTalkingPoints:
  - "Runbook = stabilize. Postmortem = understand."
  - "Read-only before mutation."
---

Trainer notes for **Incident Runbook Author**. See SKILL.md and copilot.instructions.md for the agent-facing content.
