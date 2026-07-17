---
learningObjectives:
  - "Explain the OTel three-signal model."
  - "Wire OpenTelemetry + Azure Monitor into an app."
  - "Correlate logs, traces, and metrics with a trace id."
prerequisites:
  - "An app you can modify"
  - "Application Insights resource"
demoScriptMinutes: 20
exercises:
  - title: "Instrument a Node service"
    durationMinutes: 30
    summary: "Add @azure/monitor-opentelemetry to a sample Express app; verify traces in Live Metrics."
discussionQuestions:
  - "When is 100% sampling too much?"
  - "How do you handle spans across async queues?"
commonPitfalls:
  - "Logging without trace_id."
  - "Missing `deployment.environment` — you can't filter by env."
slideTalkingPoints:
  - "One SDK, many backends — that's OTel's value."
  - "Correlation > volume."
---

Trainer notes for **App Observability Wiring**. See SKILL.md and copilot.instructions.md for the agent-facing content.
