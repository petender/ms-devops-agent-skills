---
name: helm-chart-scaffold
description: "Use this skill when the user asks to create a Helm chart or convert raw manifests into a chart."
---

# Helm Chart Scaffold

## When to invoke

- Creating a new Helm chart from scratch.
- Converting raw `k8s/*.yaml` into a parametrized chart.

## Structure

```
charts/<name>/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── serviceaccount.yaml
│   └── NOTES.txt
└── .helmignore
```

## Rules

- Every resource uses `{{ include "<chart>.fullname" . }}` for its name.
- Every resource carries the standard labels from `_helpers.tpl`.
- Ingress is templated on `.Values.ingress.enabled`.
- ServiceAccount is templated on `.Values.serviceAccount.create`.
- `values.yaml` is exhaustive — every branch in the templates has a default.
- Bump `appVersion` for image bumps, `version` for chart-schema changes.

## Process

1. Ask for chart name, image repo, service port.
2. Emit the scaffold. Prefer `helm create` conventions but strip the boilerplate NOTES you don't need.
3. Add a `README.md` with a values table.
4. Verify with `helm template . | kubectl apply --dry-run=server -f -`.

