# DevOps Agent Skills

**A community gallery of DevOps agent skills in the [Agent Skills open standard](https://agentskills.io/).**

Each skill ships as a single portable `SKILL.md` — name + description in YAML frontmatter, agent-facing instructions in the body — loaded natively by:

- **GitHub Copilot** (VS Code, CLI, Cloud Agent)
- **Claude** (Desktop, Code, API)
- Any other client that speaks the Agent Skills spec

The site is inspired by [microsoft/cat-agent-skills](https://github.com/microsoft/cat-agent-skills), rebuilt around DevOps tasks — Azure DevOps, GitHub Actions, Bicep, Terraform, Docker, Kubernetes/AKS, observability, DevSecOps, release, incident response, FinOps — with a **trainer view** so instructors get a lesson plan for every skill.

Built with [Astro](https://astro.build/) + [Tailwind CSS](https://tailwindcss.com/), deployed as a static site to GitHub Pages.

## Live site

https://petender.github.io/ms-devops-agent-skills/

## For learners

- Browse the [catalog](https://petender.github.io/ms-devops-agent-skills/).
- Pick a skill, copy the `SKILL.md` body, or download the file. Drop it into your agent's skills folder — same file for every compatible client.
- Some skills ship a `.zip` bundle with helper scripts and sample assets.

## For trainers

- Open the [Trainer view](https://petender.github.io/ms-devops-agent-skills/trainer/). Every skill has a lesson plan: learning objectives, prerequisites, live demo script, hands-on exercises, discussion questions, common pitfalls.
- Use a **learning path** to sequence a workshop end-to-end.
- Hand learners the same URL after class — they get the identical instructions their agent will read.

## Local development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:4321/ms-devops-agent-skills/`. The `base` path matches the GitHub Pages URL — override it locally with `SITE_BASE=/` in `.env`.

```bash
npm run validate    # schema-check every submission
npm run build       # full build (validate + import + astro build)
npm run test        # unit tests
```

## Adding a skill

```bash
npm run new-skill -- --slug my-awesome-skill --name "My Awesome Skill" --category ci
```

That scaffolds `submissions/my-awesome-skill/` with the files below. Edit them, run `npm run validate`, open a PR.

```
submissions/<slug>/
├── metadata.json           # catalog entry (name, description, category, tags, tools, level, ...)
├── SKILL.md                # required — the portable skill (name + description frontmatter, body)
├── trainer.md              # optional lesson plan
├── assets/                 # optional templates / sample files
├── scripts/                # optional helper scripts (bash, pwsh, py, ...)
└── references/             # optional linked docs
```

Full details in [CONTRIBUTING.md](CONTRIBUTING.md).

## Categories

| Slug        | Domain                                                    |
|-------------|-----------------------------------------------------------|
| `ci`        | CI / pipelines (Azure DevOps, GitHub Actions)             |
| `iac`       | Infrastructure as Code (Bicep, ARM, Terraform, Pulumi)    |
| `container` | Containers (Docker, Buildpacks)                           |
| `k8s`       | Kubernetes (AKS, Helm, GitOps)                            |
| `security`  | DevSecOps (SAST, secrets, SBOM, image scan, OIDC)         |
| `obs`       | Observability (App Insights, OpenTelemetry, Grafana)      |
| `release`   | Release strategies (blue-green, canary, rollback)         |
| `ir`        | Incident response (runbooks, postmortems)                 |
| `finops`    | Cost optimization (Cost Mgmt, rightsizing)                |

## Deploy

Push to `main` — the `Deploy to GitHub Pages` workflow builds and publishes. In repo **Settings → Pages**, set the source to **GitHub Actions**.

## License

MIT — see [LICENSE](LICENSE).
