---
name: dockerfile-hardener
description: "Use this skill when the user asks to review, harden, minify, or optimize a Dockerfile."
---

# Dockerfile Hardener

## When to invoke

The user shares a Dockerfile and asks to make it smaller, faster, or more secure.

## Guardrails

- **Multi-stage**: builder + runtime. Runtime image contains only what's needed at runtime.
- **Base image**: prefer `-slim`, `-alpine`, or distroless. Pin by **digest** (`@sha256:…`), not tag.
- **Non-root**: create a user, `USER 10001`. Don't run as `root` in the final image.
- **Layer ordering**: copy manifests + install deps *before* copying source. Maximizes cache hits.
- **HEALTHCHECK**: add one that exercises the app, not just `curl /`.
- **No secrets** in build args or env. Use BuildKit `--secret` for build-time secrets.
- **.dockerignore**: exclude `node_modules`, `.git`, tests.
- **Explicit port** with `EXPOSE` (doc-only, but expected).

## Before → After example

```dockerfile
# --- builder ---
FROM node:20-slim@sha256:<digest> AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime ---
FROM gcr.io/distroless/nodejs20-debian12@sha256:<digest>
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
CMD ["dist/server.js"]
```

## Process

1. Read the source Dockerfile. Identify base image, package manager, entrypoint.
2. Split into builder + runtime. Move any build tools (compilers, npm, pip, etc.) to the builder only.
3. Pin the base image by digest (ask the user to run `docker pull … && docker inspect --format='{{.RepoDigests}}' …`).
4. Add `USER`, `HEALTHCHECK`, `.dockerignore`.
5. Report **image-size before/after** if the user can run `docker build`.

