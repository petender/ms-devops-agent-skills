# DevOps Agent Skills

**A community gallery of dual-format agent skills for the DevOps engineer's daily work.**

Every skill ships in two formats so you can drop it into whichever agent you use:

- **Claude** — `SKILL.md` with a YAML frontmatter `name` + `description`.
- **GitHub Copilot** — `.instructions.md` with `description` + `applyTo`.

The site is inspired by [microsoft/cat-agent-skills](https://github.com/microsoft/cat-agent-skills), rebuilt around DevOps tasks — Azure DevOps, GitHub Actions, Bicep, Terraform, Docker, Kubernetes/AKS, observability, DevSecOps, release, incident response, FinOps — with a **trainer view** so instructors get a lesson plan for every skill.

Built with [Astro](https://astro.build/) + [Tailwind CSS](https://tailwindcss.com/), deployed as a static site to GitHub Pages.

## Live site

`https://<owner>.github.io/ms-devops-agent-skills/`

## For learners

- Browse the [catalog](https://<owner>.github.io/ms-devops-agent-skills/).
- Pick a skill, copy the tab that matches your agent, or download the file — Claude or Copilot flavor.
- Some skills ship a `.zip` bundle with helper scripts and sample assets.

## For trainers

- Open the [Trainer view](https://<owner>.github.io/ms-devops-agent-skills/trainer/). Every skill has a lesson plan: learning objectives, prerequisites, live demo script, hands-on exercises, discussion questions, common pitfalls.
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

That scaffolds `submissions/my-awesome-skill/` with the four files below. Edit them, run `npm run validate`, open a PR.

```
submissions/<slug>/
├── metadata.json           # catalog entry (name, description, category, tags, tools, level, ...)
├── SKILL.md                # Claude format
├── copilot.instructions.md # Copilot format
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
