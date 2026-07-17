---
learningObjectives:
  - "Author a Bicep module with typed, documented parameters and outputs."
  - "Compose modules from a main.bicep entry point."
  - "Recognize when to promote inline resources into modules."
prerequisites:
  - "Azure subscription with Contributor rights"
  - "Azure CLI 2.60+ with the Bicep extension"
demoScriptMinutes: 15
exercises:
  - title: "Convert an ARM template"
    durationMinutes: 25
    summary: "Take an existing storage-account ARM template and produce a Bicep module + a main.bicep caller."
  - title: "Add a Key Vault module"
    durationMinutes: 20
    summary: "Author a second module that outputs a URI, and reference it from main.bicep."
discussionQuestions:
  - "When would you prefer AVM (Azure Verified Modules) over authoring your own?"
  - "How do you version modules across teams?"
commonPitfalls:
  - "Skipping @description — makes IntelliSense useless."
  - "Hard-coding region."
slideTalkingPoints:
  - "Modules are the reuse boundary — treat them like npm packages."
  - "Outputs are your public API."
---

Trainer notes for **Bicep Module Generator**. See SKILL.md and copilot.instructions.md for the agent-facing content.
