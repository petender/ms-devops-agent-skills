---
learningObjectives:
  - "Compose a GitHub Actions workflow with correct permissions and concurrency."
  - "Use matrix builds to test across versions in parallel."
  - "Extract shared jobs into a reusable workflow."
prerequisites:
  - "GitHub repo with Actions enabled"
demoScriptMinutes: 12
exercises:
  - title: "Add matrix + cache"
    durationMinutes: 15
    summary: "Turn a single-version workflow into a matrix over Node 20/22 with npm cache."
  - title: "Extract a reusable build job"
    durationMinutes: 20
    summary: "Move the build steps into workflow_call and consume it from two callers."
discussionQuestions:
  - "When would you disable fail-fast?"
  - "What are the trade-offs of composite actions vs reusable workflows?"
commonPitfalls:
  - "Leaving `permissions: write-all` by default."
  - "No concurrency guard on release workflows."
slideTalkingPoints:
  - "Pin third-party actions by SHA — supply chain matters."
  - "Reusable workflows are your building block for a platform pipeline."
---

Trainer notes for **GitHub Actions Workflow Author**. See SKILL.md and copilot.instructions.md for the agent-facing content.
