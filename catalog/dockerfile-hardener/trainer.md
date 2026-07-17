---
learningObjectives:
  - "Refactor a naive Dockerfile into a multi-stage, non-root build."
  - "Pin base images by digest for supply-chain safety."
  - "Add a meaningful HEALTHCHECK."
prerequisites:
  - "Docker Desktop or a Docker-in-Docker CI runner"
demoScriptMinutes: 15
exercises:
  - title: "Harden a Node.js Dockerfile"
    durationMinutes: 30
    summary: "Take a 20-line single-stage Node Dockerfile and produce a multi-stage distroless image; measure the size delta."
discussionQuestions:
  - "When is Alpine a bad choice?"
  - "Where does distroless not fit?"
commonPitfalls:
  - "Copying `.env` into the image."
  - "Installing curl just for HEALTHCHECK."
slideTalkingPoints:
  - "Small images ship faster and expose less."
  - "Digest pins protect you from tag hijacks."
---

Trainer notes for **Dockerfile Hardener**. See SKILL.md and copilot.instructions.md for the agent-facing content.
