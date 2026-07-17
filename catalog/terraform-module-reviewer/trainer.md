---
learningObjectives:
  - "Apply a systematic review checklist to a Terraform module."
  - "Recognize state-safety anti-patterns."
  - "Recommend variable/output improvements that raise reusability."
prerequisites:
  - "A Terraform module to review"
  - "Terraform 1.6+"
demoScriptMinutes: 20
exercises:
  - title: "Review a real module"
    durationMinutes: 30
    summary: "Bring a module from your organization; run it through the checklist and produce a review doc."
discussionQuestions:
  - "What review items would you add for AWS specifically?"
  - "How do you enforce tagging without a policy engine?"
commonPitfalls:
  - "`count` vs `for_each` confusion causing destroy-and-recreate."
  - "Missing provider version constraints causing surprise upgrades."
slideTalkingPoints:
  - "State is the source of truth — protect it first."
  - "`for_each` uses map keys as identity; picking bad keys creates churn."
---

Trainer notes for **Terraform Module Reviewer**. See SKILL.md and copilot.instructions.md for the agent-facing content.
