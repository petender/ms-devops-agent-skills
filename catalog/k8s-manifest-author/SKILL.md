---
name: k8s-manifest-author
description: "Use this skill when the user asks to write, refactor, or review Kubernetes manifests (Deployment, Service, HPA, PDB, ConfigMap, Secret)."
---

# Kubernetes Manifest Author

## When to invoke

- Authoring a new Deployment + Service pair.
- Adding autoscaling (HPA), disruption budget (PDB), or probes to an existing manifest.

## Defaults every Deployment needs

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: { app: api }
spec:
  replicas: 2
  selector: { matchLabels: { app: api } }
  template:
    metadata:
      labels: { app: api }
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
      - name: api
        image: ghcr.io/org/api:1.2.3
        ports: [{ containerPort: 8080 }]
        env:
        - name: LOG_LEVEL
          valueFrom: { configMapKeyRef: { name: api-config, key: log_level } }
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits:   { cpu: 500m, memory: 512Mi }
        livenessProbe:
          httpGet: { path: /health, port: 8080 }
          initialDelaySeconds: 10
        readinessProbe:
          httpGet: { path: /ready, port: 8080 }
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities: { drop: [ALL] }
```

## HPA + PDB

- HPA on CPU 70% + Memory 80% for stateless services.
- PDB `minAvailable: 1` when replicas ≥ 2.

## Rules

- Always set `resources.requests`. Without them, the scheduler treats the pod as best-effort.
- Never use `:latest` in production manifests.
- Prefer `Recreate` strategy for stateful workloads, `RollingUpdate` (default) for stateless.

## Process

1. Ask replicas, port, health paths, config keys, secrets, and any storage need.
2. Emit one YAML file per resource (`api-deployment.yaml`, `api-service.yaml`, `api-hpa.yaml`, `api-pdb.yaml`).
3. Print the `kubectl apply` order.

