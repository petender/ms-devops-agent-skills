---
learningObjectives:
  - "Explain why OIDC federation is preferable to a long-lived client secret."
  - "Create a federated credential scoped to a specific branch or environment."
  - "Migrate an existing workflow off `AZURE_CLIENT_SECRET`."
prerequisites:
  - "Azure subscription (Owner or User Access Administrator)"
  - "GitHub repo with Actions enabled"
demoScriptMinutes: 20
exercises:
  - title: "Migrate a deploy workflow"
    durationMinutes: 40
    summary: "Take a workflow using AZURE_CLIENT_SECRET and swap it for OIDC federation with branch-scoped credentials."
discussionQuestions:
  - "How would you scope credentials per-environment?"
  - "What happens when a fork opens a PR — does it get the token?"
commonPitfalls:
  - "Reusing the same federated credential for main and PRs."
  - "Granting Owner instead of Contributor on the RG."
slideTalkingPoints:
  - "Federation = short-lived tokens, no rotation, no exposure."
  - "Subject is the security boundary."
---

Trainer notes for **OIDC Azure Federated Credentials**. See SKILL.md and copilot.instructions.md for the agent-facing content.
