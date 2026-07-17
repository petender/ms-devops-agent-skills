---
name: terraform-module-reviewer
description: "Use this skill when the user asks to review, audit, or improve an existing Terraform module or root module."
---

# Terraform Module Reviewer

## When to invoke

The user shares one or more `.tf` files and asks for a review.

## Checklist (walk it top to bottom)

1. **Provider pinning** — `required_providers` block with `version = "~> X.Y"` for every provider. No implicit provider blocks.
2. **Backend configured** — no `local` backend in prod modules.
3. **Variables** — every `variable` has `type`, `description`, and (where possible) `validation` rules.
4. **Outputs** — every top-level resource has an output for its `id` and, if useful, `name`.
5. **Naming** — `locals` compute names once. Nothing hard-coded like environment or region.
6. **Idempotency** — no `null_resource` with `local-exec` unless justified. No `triggers = { always_run = timestamp() }`.
7. **State safety** — no `terraform_remote_state` where a data source works. No `import` blocks left in code long-term.
8. **Tagging** — a `local.common_tags` merged into every taggable resource.
9. **Sensitive** — outputs referencing secrets marked `sensitive = true`.
10. **for_each vs count** — `for_each` on a stable map, `count` only for boolean feature flags.

## Output format

Produce a Markdown review with three sections:
- ✅ **Good** — what the module already does well.
- ⚠ **Should fix** — issues that will bite eventually.
- ❌ **Must fix** — bugs, security holes, state hazards.

Cite specific line numbers.

