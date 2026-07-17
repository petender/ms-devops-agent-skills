---
learningObjectives:
  - "Structure an Azure DevOps YAML pipeline into stages, jobs, and steps."
  - "Extract reusable logic into pipeline templates."
  - "Configure a gated deployment using environments and approvals."
prerequisites:
  - "Azure DevOps organization + project"
  - "A repo with a small buildable app"
demoScriptMinutes: 15
exercises:
  - title: "Convert a flat pipeline to stages"
    durationMinutes: 20
    summary: "Take a 60-line flat azure-pipelines.yml and refactor it into Build + Deploy_Dev stages."
  - title: "Add environment approvals"
    durationMinutes: 15
    summary: "Configure the dev environment to require one reviewer before deploy."
discussionQuestions:
  - "When does a stage boundary help vs hurt pipeline speed?"
  - "What belongs in a variable group vs a template parameter?"
commonPitfalls:
  - "Copy-pasting the same steps across jobs instead of extracting a template."
  - "Using `condition: always()` to hide flaky steps."
slideTalkingPoints:
  - "Stages are the unit of promotion; jobs are the unit of parallelism."
  - "Templates make pipelines reviewable at PR time — treat them like functions."
---

Trainer notes for **Azure DevOps Pipeline Author**. See SKILL.md and copilot.instructions.md for the agent-facing content.
