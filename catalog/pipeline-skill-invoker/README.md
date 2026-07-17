# Pipeline Skill Invoker

> **Bring AI-powered DevOps skills into your CI/CD pipelines**

This skill demonstrates how to invoke any skill from the DevOps Agent Skills catalog directly from GitHub Actions or Azure DevOps pipelines using the GitHub Models API or GitHub Copilot CLI.

## 🎯 What You Can Do

- ✅ **Validate pipelines** - Automatically review YAML pipelines for issues and anti-patterns
- ✅ **Security gates** - Block deployments that don't meet security standards (Dockerfiles, IaC, etc.)
- ✅ **Auto-generate code** - Create Helm charts, K8s manifests, Terraform from specs
- ✅ **Code review automation** - AI-powered reviews on PRs
- ✅ **Compliance checks** - Enforce organizational standards automatically
- ✅ **Local-to-pipeline workflow** - Use the same SKILL.md locally during development, then integrate into CI/CD as your team scales

## 💡 The Local-to-Pipeline Workflow

One of the key design principles: **reuse existing SKILL.md files without modification**.

**Typical adoption path:**
1. 🧪 **Local experimentation** - Team uses `dockerfile-hardener/SKILL.md` locally with Copilot agent
2. 📈 **Standardization** - Team agrees on best practices, maybe customizes the SKILL.md
3. 🚀 **Pipeline integration** - Same SKILL.md gets invoked automatically in CI/CD via helper scripts
4. 🔄 **Continuous improvement** - Updates to SKILL.md automatically apply to both local and pipeline usage

**No need to rewrite or duplicate skill logic** - the helper scripts handle the API integration while preserving your skill content.

📚 **[Read the full Local-to-Pipeline workflow guide →](./LOCAL_TO_PIPELINE.md)**

## 🚀 Quick Start

### Prerequisites

1. **GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token (classic or fine-grained)
   - No special scopes needed (tokens automatically have access to GitHub Models)

2. **Store the Token**
   - **GitHub Actions**: Repository Settings → Secrets → `GH_MODELS_TOKEN`
   - **Azure DevOps**: Pipelines → Library → Variable Groups → `ai-tokens` → `GH_MODELS_TOKEN`

### Option 1: Use GitHub Models API (Recommended)

**Advantages:**
- ✅ Free tier available (rate-limited)
- ✅ Works in any CI/CD system
- ✅ Simple HTTP API calls
- ✅ No CLI installation needed

**Example: Validate Dockerfile on PR**

```yaml
# .github/workflows/validate-docker.yml
name: Validate Dockerfile
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate with AI using existing skill
        run: |
          # Reuse the existing dockerfile-hardener SKILL.md
          ./catalog/pipeline-skill-invoker/scripts/invoke-skill.sh \
            --skill catalog/dockerfile-hardener/SKILL.md \
            --task "Review this Dockerfile: $(cat Dockerfile)" \
            --output validation.json
        env:
          GH_MODELS_TOKEN: ${{ secrets.GH_MODELS_TOKEN }}
```

### Option 2: Use GitHub Copilot CLI

**Advantages:**
- ✅ Full Copilot capabilities
- ✅ Better context awareness
- ✅ Supports custom agents

**Requirements:**
- GitHub Copilot subscription (Pro/Business/Enterprise)
- `gh` CLI installed

```yaml
- name: Validate with Copilot CLI
  run: |
    gh copilot suggest -t shell "$(cat catalog/ado-pipeline-author/SKILL.md) Review azure-pipelines.yml"
```

## 📚 Full Examples

Explore complete, ready-to-use examples in the [`examples/`](./examples/) directory:

- [`github-dockerfile-validation.yml`](./examples/github-dockerfile-validation.yml) - Validate Dockerfiles on PRs with AI-powered security analysis
- [`azure-pipeline-validation.yml`](./examples/azure-pipeline-validation.yml) - Validate Azure DevOps pipelines and enforce quality gates

## 🛠️ Helper Scripts

These scripts handle all API integration, letting you focus on **reusing existing SKILL.md files**.

### PowerShell (Windows/Linux/macOS)

```powershell
# Reuse any existing SKILL.md from the catalog
.\scripts\invoke-skill.ps1 `
    -SkillPath "catalog/terraform-module-reviewer/SKILL.md" `
    -Task "Review this Terraform for security issues" `
    -Input (Get-Content main.tf -Raw) `
    -OutputFile "review.json"
```

### Bash (Linux/macOS)

```bash
# Same SKILL.md works in pipelines and locally
./scripts/invoke-skill.sh \
    --skill catalog/helm-chart-scaffold/SKILL.md \
    --task "Generate a Helm chart for a Node.js app" \
    --input "Node 20, Express, PostgreSQL" \
    --output chart/values.yaml
```

**Key point:** You never modify the SKILL.md. The helper script reads it, constructs the API call, and returns the AI response.

## 🎓 Training & Documentation

- **[SKILL.md](./SKILL.md)** - Complete technical documentation with patterns and troubleshooting
- **[trainer.md](./trainer.md)** - Step-by-step training modules with hands-on labs

## 📦 Skills Available for Pipeline Invocation

| Skill | Pipeline Use Case |
|-------|-------------------|
| `ado-pipeline-author` | Validate/generate Azure DevOps YAML |
| `gha-workflow-author` | Validate/generate GitHub Actions workflows |
| `bicep-module-generator` | Generate/review Azure Bicep templates |
| `terraform-module-reviewer` | Review Terraform for security & best practices |
| `dockerfile-hardener` | Security analysis for Dockerfiles |
| `devsecops-preflight` | Pre-deployment security scanning |
| `helm-chart-scaffold` | Generate Helm charts from specs |
| `k8s-manifest-author` | Generate Kubernetes manifests |
| `observability-wiring` | Add monitoring/logging to apps |

## 💡 Common Use Cases

### Use Case 1: Pipeline Security Gate

Block PRs that introduce insecure pipeline configurations:

```yaml
- name: Security Gate
  run: ./scripts/invoke-skill.sh --skill catalog/devsecops-preflight/SKILL.md ...
  # Exits 1 if security issues found, blocking the PR
```

### Use Case 2: Auto-Generate Documentation

Generate README docs for Terraform modules on every push:

```yaml
- name: Generate Docs
  run: |
    ./scripts/invoke-skill.sh \
      --skill catalog/terraform-module-reviewer/SKILL.md \
      --task "Generate documentation for this module" \
      --output README.md
    git add README.md
    git commit -m "docs: auto-update README"
```

### Use Case 3: Intelligent PR Comments

Post AI-powered code review comments:

```yaml
- name: AI Code Review
  run: ./scripts/invoke-skill.sh ... > review.json
  
- name: Comment on PR
  uses: actions/github-script@v7
  with:
    script: |
      const review = require('./review.json');
      await github.rest.issues.createComment({...});
```

## 🔑 Authentication & Secrets

### GitHub Actions

```yaml
env:
  GH_MODELS_TOKEN: ${{ secrets.GH_MODELS_TOKEN }}
```

### Azure DevOps

```yaml
variables:
  - group: ai-tokens  # Contains GH_MODELS_TOKEN

env:
  GH_MODELS_TOKEN: $(GH_MODELS_TOKEN)
```

## 📊 Rate Limits & Costs

### GitHub Models Free Tier

| Model | Requests/min | Requests/day |
|-------|--------------|--------------|
| GPT-4o-mini | 15 | 150 |
| GPT-4o | 10 | 50 |

**Tips to stay within limits:**
- Use `gpt-4o-mini` for simple validation tasks
- Cache responses for unchanged files
- Only trigger on specific file path changes
- Consider upgrading to paid tier for production

## 🐛 Troubleshooting

**"401 Unauthorized"**
- Verify token is stored in secrets correctly
- Tokens automatically have `models:read` access (no special scopes needed)

**"429 Rate Limit Exceeded"**
- Free tier limits exceeded
- Scripts have built-in retry with exponential backoff
- Consider paid GitHub Models tier or Azure OpenAI

**"Empty or invalid JSON response"**
- Check prompt formatting and special character escaping
- Verify model name (`gpt-4o`, `gpt-4o-mini`)
- Increase `max_tokens` if response is truncated

## 🌐 Resources

- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Azure DevOps YAML Schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)

## 🤝 Contributing

Found a useful pattern? Share it by creating a PR with:
1. A new example workflow in `examples/`
2. Documentation in the README
3. Test results showing it works

## 📄 License

This skill is part of the DevOps Agent Skills collection and follows the repository's license.

---

**Questions or issues?** Open an issue in the main repository or check the [trainer.md](./trainer.md) for detailed troubleshooting.
