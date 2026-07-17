# Contributing

Thanks for helping the DevOps trainer & learner community share reusable agent skills!

## The one-minute path

```bash
git clone https://github.com/petender/ms-devops-agent-skills
cd ms-devops-agent-skills
npm install
npm run new-skill -- --slug my-skill --name "My Skill" --category ci
# ... edit submissions/my-skill/ ...
npm run validate
npm run dev
```

Then open a PR. CI runs `npm run validate && npm test && npm run build`.

## Submission anatomy

```
submissions/<slug>/
├── metadata.json           # required — catalog entry
├── SKILL.md                # required — Claude format
├── copilot.instructions.md # required — Copilot format
├── trainer.md              # recommended — lesson plan
├── assets/                 # optional — templates, sample YAML, etc.
├── scripts/                # optional — helper scripts (bash, pwsh, py)
└── references/             # optional — linked reference docs
```

The **slug** is the folder name. Use lowercase, digits, and hyphens.

### `metadata.json`

```json
{
  "name": "Bicep Module Generator",
  "description": "Author idempotent, parameterized Bicep modules …",
  "category": "iac",
  "platforms": ["Claude", "GitHub Copilot"],
  "tools": ["Azure", "Bicep", "azd"],
  "tags": ["iac", "azure", "bicep"],
  "level": "intermediate",
  "estimatedMinutes": 25,
  "learningPaths": ["platform-engineer"],
  "author": "DevOps Community",
  "version": "1.0.0"
}
```

**Required**: `name`, `description`, `category`, `platforms`, `tags`, `level`, `estimatedMinutes`. See [`src/content/config.ts`](src/content/config.ts) for the full zod schema.

Valid `category`: `ci`, `iac`, `container`, `k8s`, `security`, `obs`, `release`, `ir`, `finops`.
Valid `level`: `beginner`, `intermediate`, `advanced`.
Valid `platforms`: `Claude`, `GitHub Copilot`.

### `SKILL.md` (Claude)

```markdown
---
name: bicep-module-generator
description: Use this skill whenever the user asks to write, review, or refactor a Bicep module.
---

# Body

Agent-facing instructions in Markdown.
```

The **frontmatter description is what Claude sees to decide when to invoke** — write it as a trigger sentence. The body is the instruction the agent follows.

Keep the body **under ~200 lines**. The validator warns above 300.

### `copilot.instructions.md` (GitHub Copilot)

```markdown
---
description: Author idempotent, parameterized Bicep modules with @description, outputs, and a main.bicep composition example.
applyTo: "**/*.bicep"
---

# Body

Same guidance as SKILL.md, phrased for Copilot.
```

`applyTo` is a glob controlling when Copilot auto-includes this instruction. Use `"**"` if the skill is invoked manually.

### `trainer.md` (optional)

```yaml
---
learningObjectives:
  - Author a reusable Bicep module with typed parameters and outputs.
prerequisites:
  - Azure subscription with Contributor rights
  - Azure CLI (`az`) 2.60+
demoScriptMinutes: 15
exercises:
  - title: "Convert an ARM sample to a Bicep module"
    durationMinutes: 20
    summary: "Take an existing storage account ARM template and produce a Bicep module with parameters and outputs."
discussionQuestions:
  - "When would you prefer a Bicep module over a Terraform module?"
commonPitfalls:
  - "Forgetting `@description()` decorators — makes downstream reuse painful."
slideTalkingPoints:
  - "Modules are the reuse boundary — treat them like npm packages."
---

Optional narrative for the trainer; not rendered by the site.
```

Populating `trainer.md` sets `hasTrainerNotes: true` and exposes the skill on the Trainer view.

## Style guide

- **Description**: 1 sentence, ≤ 320 chars. It appears on the card and in metadata endpoints.
- **Tags**: 3–6 lowercase, kebab-case terms.
- **Tools**: real product/tool names as users type them (`Azure`, `Bicep`, `Terraform`, `Docker`, `Helm`, `GitHub Actions`, …). Casing matters — filters compare exactly.
- **Body**: prefer imperative voice ("Do X", "Check Y before Z"). Include a small worked example.
- **No secrets** in scripts or assets. Never commit credentials.

## PR checklist

- [ ] `npm run validate` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` completes without warnings.
- [ ] Skill body is under ~200 lines.
- [ ] Both format files describe the *same* skill (drift is a bug).
- [ ] If the skill needs external tooling, list versions in `prerequisites`.

## Learning paths

Curated paths live in [`src/data/learning-paths.json`](src/data/learning-paths.json). Add your slug to an existing path or open a discussion to propose a new one.

## Reporting issues

Open an issue at <https://github.com/petender/ms-devops-agent-skills/issues>.

## Code of conduct

By participating you agree to abide by the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
