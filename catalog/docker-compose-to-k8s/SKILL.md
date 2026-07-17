---
name: docker-compose-to-k8s
description: "Use this skill when the user asks to convert a docker-compose.yml file into Kubernetes manifests."
---

# Docker Compose → Kubernetes Manifests

## When to invoke

The user has a `docker-compose.yml` and wants a Kubernetes deployment.

## Mapping

| compose                    | Kubernetes                            |
|----------------------------|----------------------------------------|
| `services.<x>.image`     | Deployment container image            |
| `ports:`                 | Service (ClusterIP), plus Deployment containerPort |
| `environment:`           | ConfigMap + envFrom                   |
| `env_file:`              | ConfigMap generated from the file     |
| `secrets:`               | Secret (base64-encoded)               |
| `volumes:`               | PersistentVolumeClaim + volumeMount   |
| `depends_on:`            | initContainer or readiness probe on target |
| `restart: unless-stopped`| Deployment default (Always)           |
| `networks:`              | NetworkPolicy (only if needed)        |
| `healthcheck:`           | livenessProbe / readinessProbe        |

## Defaults to add

- `resources.requests`: 100m CPU, 128Mi memory.
- `resources.limits`: 500m CPU, 512Mi memory.
- `readinessProbe` on the app's health path.
- `securityContext`: `runAsNonRoot: true`, `readOnlyRootFilesystem: true` when possible.

## Process

1. Read the compose file, list services.
2. For each service, produce Deployment + Service (+ ConfigMap / PVC if applicable).
3. Split manifests into one file per kind under `k8s/` (e.g. `api-deployment.yaml`, `api-service.yaml`).
4. Print an `Apply` order: ConfigMap/Secret → PVC → Deployment → Service → Ingress.
5. Add a `README.md` snippet with `kubectl apply -f k8s/`.

