---
learningObjectives:
  - "Explain the standard Helm chart layout."
  - "Author templates using _helpers.tpl for consistent labels/names."
  - "Design a values.yaml that covers every template branch."
prerequisites:
  - "Helm 3.12+"
  - "A running Kubernetes cluster"
demoScriptMinutes: 15
exercises:
  - title: "Convert raw manifests to a chart"
    durationMinutes: 30
    summary: "Take a set of raw Deployment/Service manifests and produce an installable chart with an ingress toggle."
discussionQuestions:
  - "When would you prefer Kustomize over Helm?"
  - "How do you test template rendering?"
commonPitfalls:
  - "Hard-coding names instead of using fullname helper."
  - "Untemplated ingress that always creates one."
slideTalkingPoints:
  - "Helm is a package manager, not a config manager."
  - "Every template branch needs a values default."
---

Trainer notes for **Helm Chart Scaffold**. See SKILL.md and copilot.instructions.md for the agent-facing content.
