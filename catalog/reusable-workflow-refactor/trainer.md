---
learningObjectives:
  - "Identify duplicated CI logic ripe for extraction."
  - "Author a reusable workflow with typed inputs and secret passing."
  - "Migrate callers with minimal disruption."
prerequisites:
  - "Two or more existing workflows"
demoScriptMinutes: 15
exercises:
  - title: "Extract and consume"
    durationMinutes: 30
    summary: "Take two workflows that share a build job and produce a reusable workflow + two callers."
discussionQuestions:
  - "When is a composite action a better fit?"
  - "How do you version a reusable workflow across repos?"
commonPitfalls:
  - "Leaking env-specific values into the shared workflow."
  - "Forgetting `secrets: inherit`."
slideTalkingPoints:
  - "Callers stay skinny; the reusable workflow owns the recipe."
  - "Version by tag if reused cross-repo."
---

Trainer notes for **Reusable Workflow Refactor**. See SKILL.md and copilot.instructions.md for the agent-facing content.
