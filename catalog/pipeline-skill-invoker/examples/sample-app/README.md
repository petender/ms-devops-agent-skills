# Sample Hello World Application

A simple Node.js Express application for testing the pipeline-skill-invoker feature.

## 🎯 Purpose

This sample app demonstrates:
1. **Local testing** - Validate the Dockerfile with AI locally
2. **Pipeline integration** - Same validation runs automatically in CI/CD
3. **Security issues detection** - The Dockerfile intentionally has issues for demo purposes

## 🔴 Intentional Security Issues

The `Dockerfile` has several common security problems:

1. **Using `latest` tag** - Base image is `node:latest` (not pinned)
2. **Running as root** - No USER directive to drop privileges
3. **No health check** - Missing HEALTHCHECK instruction
4. **No multi-stage build** - Includes build dependencies in final image
5. **Loose permissions** - Files copied with default (too permissive) permissions

## 🧪 Testing Locally

### 1. Test with the helper script

```bash
# From repository root
./catalog/pipeline-skill-invoker/scripts/invoke-skill.sh \
  --skill catalog/dockerfile-hardener/SKILL.md \
  --task "Analyze this Dockerfile for security issues and suggest improvements" \
  --input "$(cat catalog/pipeline-skill-invoker/examples/sample-app/Dockerfile)" \
  --output analysis.json \
  --verbose
```

### 2. View the results

```bash
cat analysis.json | jq .
```

Expected output:
- Security score: ~40-60/100
- Critical issues: Running as root, using latest tag
- Recommendations: Pin versions, add USER directive, add HEALTHCHECK, use multi-stage build

## 🚀 Testing in Pipeline

### GitHub Actions

Copy `github-dockerfile-validation.yml` to `.github/workflows/` and create a PR that modifies this Dockerfile.

### Azure DevOps

Use `azure-pipeline-validation.yml` and point it to this directory.

## ✅ Fixed Dockerfile

Here's what the Dockerfile should look like after applying AI recommendations:

```dockerfile
# Use specific version instead of latest
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY app.js ./

# Production stage
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup appuser

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=appuser:appgroup /app /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run application
CMD ["node", "app.js"]
```

## 🏃 Running the Application

### Build and run (current version with issues):
```bash
docker build -t hello-world-insecure .
docker run -p 3000:3000 hello-world-insecure
```

### Test the endpoints:
```bash
curl http://localhost:3000
curl http://localhost:3000/health
```

### Build and run (fixed version):
```bash
# Save the fixed Dockerfile as Dockerfile.secure
docker build -f Dockerfile.secure -t hello-world-secure .
docker run -p 3000:3000 hello-world-secure
```

## 📚 Learning Exercise

1. Run the AI validation on the current Dockerfile
2. Review the issues found
3. Create a new `Dockerfile.secure` with the fixes
4. Run validation again and compare scores
5. Test both versions to verify they work the same but one is more secure

## 🔗 Related Files

- [Dockerfile](./Dockerfile) - The intentionally insecure version
- [../../scripts/invoke-skill.sh](../../scripts/invoke-skill.sh) - Helper script for validation
- [../../README.md](../../README.md) - Full documentation
- [../../LOCAL_TO_PIPELINE.md](../../LOCAL_TO_PIPELINE.md) - Workflow guide
