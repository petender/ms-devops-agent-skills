---
learningObjectives:
  - "Pull utilization data from Azure Monitor at scale."
  - "Categorize resources into delete / rightsize / restructure / commit."
  - "Produce a defensible savings recommendation with assumptions stated."
prerequisites:
  - "Azure subscription (Reader + Cost Management Reader)"
demoScriptMinutes: 20
exercises:
  - title: "Rightsize a subscription"
    durationMinutes: 45
    summary: "Run the script, bucket the output, and produce the Markdown report for one target resource group."
discussionQuestions:
  - "When is a reserved instance the wrong choice?"
  - "How do you handle a workload with spiky bursts?"
commonPitfalls:
  - "Rightsizing on CPU only when the workload is memory-bound."
  - "Quoting savings at list price without noting EA / discount tier."
slideTalkingPoints:
  - "Cost work is data work — 14+ days or don't commit."
  - "Delete first, then rightsize, then commit."
---

Trainer notes for **Azure Cost Rightsizer**. See SKILL.md and copilot.instructions.md for the agent-facing content.
