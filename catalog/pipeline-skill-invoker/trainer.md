# Pipeline Skill Invoker Training

## Overview

Learn how to integrate AI-powered DevOps skills into your CI/CD pipelines, enabling automated validation, generation, and intelligent decision-making in your workflows.

## Learning Objectives

By the end of this training, you will be able to:

1. Invoke AI skills from GitHub Actions and Azure DevOps pipelines
2. Use GitHub Models API for AI-powered automation
3. Integrate GitHub Copilot CLI into pipeline workflows
4. Implement AI-powered pipeline gates and validators
5. Handle authentication, rate limits, and error scenarios
6. Parse and act on AI-generated responses in pipelines

## Prerequisites

- Active GitHub account
- Access to GitHub Models (free tier) or GitHub Copilot subscription
- Basic understanding of YAML syntax
- Experience with GitHub Actions or Azure DevOps Pipelines
- Familiarity with REST APIs and command-line tools

## Module 1: Understanding the Architecture

### Concepts

**AI Skills**: Markdown files (SKILL.md) that contain expert knowledge and guardrails for specific DevOps tasks.

**GitHub Models API**: A free (rate-limited) inference API providing access to GPT-4, GPT-4o, and other models.

**GitHub Copilot CLI**: A command-line interface for GitHub Copilot with agent/plugin support.

**Pipeline Integration**: Invoking AI models from CI/CD workflows to automate DevOps tasks.

### How It Works

1. **Trigger**: Pipeline starts (PR, push, schedule, manual)
2. **Read Context**: Load SKILL.md file and input data
3. **Construct Prompt**: Combine skill instructions with task-specific context
4. **Invoke AI**: Call GitHub Models API or Copilot CLI
5. **Parse Response**: Extract structured output (JSON, YAML, etc.)
6. **Act**: Use response to gate deployment, create artifacts, comment on PR, etc.

### Decision Matrix: API vs. CLI

| Factor | GitHub Models API | GitHub Copilot CLI |
|--------|-------------------|-------------------|
| **Cost** | Free tier available | Requires Copilot subscription ($10-19/user/mo) |
| **Setup** | PAT token only | Requires `gh` CLI + Copilot extension |
| **Flexibility** | Works anywhere (any CI/CD) | Best in GitHub ecosystem |
| **Rate Limits** | 10-15 req/min (free) | Higher (subscription-based) |
| **Context** | Manual (pass as text) | Automatic (repo awareness) |
| **Complexity** | Simple HTTP calls | More powerful, more setup |
| **Best For** | Most automation use cases | Complex multi-step workflows |

**Recommendation**: Start with GitHub Models API for simplicity and cost.

## Module 2: Setting Up GitHub Models API

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (if accessing private repos in pipelines)
   - ✅ `workflow` (if modifying workflows)
   - ✅ *Note: `models:read` is implicit for all tokens*
4. Generate and copy the token

### Step 2: Store Token in Pipeline Secrets

**GitHub Actions:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GH_MODELS_TOKEN`
4. Value: Paste your PAT
5. Click "Add secret"

**Azure DevOps:**
1. Go to Pipelines → Library → Variable groups
2. Create new group: `ai-tokens`
3. Add variable: `GH_MODELS_TOKEN`
4. Check "Keep this value secret"
5. Save

### Step 3: Test the API

```bash
# Test with curl
curl -X POST https://models.github.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "You are a helpful DevOps assistant."},
      {"role": "user", "content": "Say hello and confirm you can help with pipelines."}
    ]
  }'
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! I'm ready to help with pipelines..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}
```

## Module 3: Your First Pipeline Skill Invocation

### Use Case: Validate Dockerfile Security

Let's create a pipeline that validates Dockerfiles using the `dockerfile-hardener` skill.

**Step 1: Create the GitHub Actions Workflow**

```yaml
name: Dockerfile Security Check
on:
  pull_request:
    paths:
      - '**/Dockerfile'

jobs:
  validate-dockerfile:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Find modified Dockerfiles
        id: find-files
        run: |
          FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }} | grep Dockerfile | head -1)
          echo "dockerfile=$FILES" >> $GITHUB_OUTPUT
      
      - name: Validate with AI
        id: validate
        if: steps.find-files.outputs.dockerfile != ''
        run: |
          # Read the skill (offline, included in repo)
          SKILL=$(cat catalog/dockerfile-hardener/SKILL.md)
          
          # Read the Dockerfile
          DOCKERFILE=$(cat ${{ steps.find-files.outputs.dockerfile }})
          
          # Construct the prompt
          PROMPT="You are a Docker security expert.

$SKILL

Task: Analyze this Dockerfile for security issues and provide hardening recommendations.

Dockerfile:
\`\`\`dockerfile
$DOCKERFILE
\`\`\`

Respond in JSON format:
{
  \"security_score\": 0-100,
  \"critical_issues\": [\"issue description\"],
  \"warnings\": [\"warning description\"],
  \"recommendations\": [\"recommendation with code example\"],
  \"passes_gate\": true/false (false if security_score < 70 or critical_issues exist)
}"
          
          # Call GitHub Models API
          RESPONSE=$(curl -s -X POST \
            https://models.github.com/v1/chat/completions \
            -H "Authorization: Bearer ${{ secrets.GH_MODELS_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"model\": \"gpt-4o\",
              \"messages\": [
                {\"role\": \"system\", \"content\": \"You are a Docker security expert. Always respond with valid JSON.\"},
                {\"role\": \"user\", \"content\": $(echo "$PROMPT" | jq -Rs .)}
              ],
              \"temperature\": 0.2
            }")
          
          # Extract the result
          RESULT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
          
          # Save for later steps
          echo "$RESULT" > validation-result.json
          echo "$RESULT" | jq .
          
          # Check if it passes the gate
          PASSES=$(echo "$RESULT" | jq -r '.passes_gate')
          echo "passes=$PASSES" >> $GITHUB_OUTPUT
          
          if [ "$PASSES" != "true" ]; then
            echo "::error::Dockerfile security validation failed"
          fi
      
      - name: Comment on PR
        if: always() && steps.validate.conclusion != 'skipped'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('validation-result.json', 'utf8'));
            
            const emoji = result.passes_gate ? '✅' : '❌';
            const status = result.passes_gate ? 'PASS' : 'FAIL';
            
            let body = `## ${emoji} Dockerfile Security Check: ${status}

**Security Score:** ${result.security_score}/100

`;
            
            if (result.critical_issues?.length) {
              body += `### 🔴 Critical Issues\n${result.critical_issues.map(i => `- ${i}`).join('\n')}\n\n`;
            }
            
            if (result.warnings?.length) {
              body += `### ⚠️ Warnings\n${result.warnings.map(w => `- ${w}`).join('\n')}\n\n`;
            }
            
            if (result.recommendations?.length) {
              body += `### 💡 Recommendations\n${result.recommendations.map(r => `- ${r}`).join('\n')}\n\n`;
            }
            
            body += `\n---\n*Powered by AI Skill: dockerfile-hardener*`;
            
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
      
      - name: Fail if validation failed
        if: steps.validate.outputs.passes != 'true'
        run: exit 1
```

**Step 2: Test the Workflow**

1. Create a test Dockerfile with security issues:
```dockerfile
FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl
USER root
EXPOSE 8080
CMD ["/app/server"]
```

2. Commit and create a PR
3. Watch the workflow run and comment on the PR

## Module 4: Advanced Patterns

### Pattern 1: Structured Output Parsing

Request JSON output and parse it programmatically:

```yaml
- name: Parse AI Response
  run: |
    RESPONSE='${{ steps.ai-call.outputs.response }}'
    
    # Extract specific fields
    VALID=$(echo "$RESPONSE" | jq -r '.valid')
    SCORE=$(echo "$RESPONSE" | jq -r '.score')
    ISSUES=$(echo "$RESPONSE" | jq -r '.issues | length')
    
    echo "Valid: $VALID"
    echo "Score: $SCORE"
    echo "Issues: $ISSUES"
    
    # Set as outputs for other jobs
    echo "valid=$VALID" >> $GITHUB_OUTPUT
    echo "score=$SCORE" >> $GITHUB_OUTPUT
```

### Pattern 2: Multi-Skill Chain

Invoke multiple skills in sequence:

```yaml
- name: Generate Pipeline
  id: generate
  run: |
    # Use gha-workflow-author skill to generate workflow
    ./scripts/invoke-skill.sh \
      --skill catalog/gha-workflow-author/SKILL.md \
      --task "Generate CI workflow for Python app with pytest" \
      --output generated-workflow.yml

- name: Validate Pipeline
  run: |
    # Use workflow validator to check the generated workflow
    ./scripts/invoke-skill.sh \
      --skill catalog/gha-workflow-author/SKILL.md \
      --task "Validate this workflow" \
      --input "$(cat generated-workflow.yml)" \
      --output validation.json
```

### Pattern 3: Conditional Invocation

Only invoke AI when certain conditions are met:

```yaml
- name: Check if AI validation needed
  id: check
  run: |
    # Only validate if high-risk files changed
    CHANGED=$(git diff --name-only HEAD~1 HEAD | grep -E "(Dockerfile|\.tf|\.bicep)")
    if [ -n "$CHANGED" ]; then
      echo "needs_validation=true" >> $GITHUB_OUTPUT
    fi

- name: AI Validation
  if: steps.check.outputs.needs_validation == 'true'
  run: ./scripts/invoke-skill.sh ...
```

### Pattern 4: Caching AI Responses

Avoid redundant API calls:

```yaml
- name: Cache AI Responses
  uses: actions/cache@v4
  with:
    path: .ai-cache
    key: ai-${{ hashFiles('**/*.tf') }}

- name: Invoke AI (with cache)
  run: |
    CACHE_KEY=$(echo "$INPUT" | sha256sum | cut -d' ' -f1)
    CACHE_FILE=".ai-cache/$CACHE_KEY.json"
    
    if [ -f "$CACHE_FILE" ]; then
      echo "Using cached response"
      cat "$CACHE_FILE"
    else
      # Call API
      RESPONSE=$(./scripts/invoke-skill.sh ...)
      echo "$RESPONSE" > "$CACHE_FILE"
    fi
```

## Module 5: Azure DevOps Integration

### PowerShell Script for ADO

```yaml
steps:
- task: PowerShell@2
  displayName: 'Validate with AI'
  inputs:
    targetType: 'inline'
    script: |
      $skill = Get-Content catalog/ado-pipeline-author/SKILL.md -Raw
      $pipeline = Get-Content azure-pipelines.yml -Raw
      
      $prompt = "You are an Azure DevOps expert. $skill`n`nValidate this pipeline:`n$pipeline`n`nRespond in JSON."
      
      $body = @{
        model = "gpt-4o-mini"
        messages = @(
          @{role="system"; content="You are a DevOps expert."}
          @{role="user"; content=$prompt}
        )
      } | ConvertTo-Json -Depth 10
      
      $response = Invoke-RestMethod `
        -Uri "https://models.github.com/v1/chat/completions" `
        -Method Post `
        -Headers @{
          "Authorization" = "Bearer $(GH_MODELS_TOKEN)"
          "Content-Type" = "application/json"
        } `
        -Body $body
      
      $result = $response.choices[0].message.content | ConvertFrom-Json
      
      if (-not $result.valid) {
        Write-Host "##vso[task.logissue type=error]Validation failed"
        exit 1
      }
  env:
    GH_MODELS_TOKEN: $(GH_MODELS_TOKEN)
```

## Module 6: Error Handling and Resilience

### Rate Limit Handling

```bash
invoke_with_retry() {
  local max_attempts=3
  local attempt=1
  local delay=5
  
  while [ $attempt -le $max_attempts ]; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ...)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
      echo "$BODY"
      return 0
    elif [ "$HTTP_CODE" = "429" ]; then
      echo "Rate limited, retrying in ${delay}s..." >&2
      sleep $delay
      delay=$((delay * 2))
    else
      echo "Error: HTTP $HTTP_CODE" >&2
      return 1
    fi
    
    attempt=$((attempt + 1))
  done
  
  return 1
}
```

### Response Validation

```bash
validate_json_response() {
  local response="$1"
  local required_fields="$2"  # e.g., "valid issues recommendations"
  
  # Check if valid JSON
  if ! echo "$response" | jq . > /dev/null 2>&1; then
    echo "Invalid JSON response" >&2
    return 1
  fi
  
  # Check required fields
  for field in $required_fields; do
    if ! echo "$response" | jq -e ".$field" > /dev/null 2>&1; then
      echo "Missing required field: $field" >&2
      return 1
    fi
  done
  
  return 0
}
```

## Module 7: Cost Optimization

### Free Tier Limits (GitHub Models)

| Model | Requests/min | Requests/day | Tokens/request |
|-------|--------------|--------------|----------------|
| GPT-4o | 10 | 50 | 8K in, 4K out |
| GPT-4o-mini | 15 | 150 | 8K in, 4K out |

### Tips to Stay Within Limits

1. **Use smaller models**: `gpt-4o-mini` for simple tasks
2. **Cache responses**: Don't re-analyze unchanged files
3. **Batch processing**: Combine multiple files into one request
4. **Trigger wisely**: Only on relevant file changes
5. **Optimize prompts**: Shorter prompts = fewer tokens

### Example: Conditional Triggering

```yaml
on:
  pull_request:
    paths:
      - '**.yml'
      - '**.yaml'
      - '**.tf'
      - '**.bicep'
      # Only trigger on IaC/pipeline files
```

## Hands-On Lab

### Lab 1: Pipeline Validation Gate

**Objective**: Create a GitHub Actions workflow that validates all YAML pipeline changes using AI.

**Steps**:
1. Fork this repository
2. Generate a GitHub PAT with appropriate scopes
3. Add the token as `GH_MODELS_TOKEN` secret
4. Create `.github/workflows/validate-pipelines.yml` using the examples
5. Modify a workflow file to introduce an issue (e.g., unpinned action)
6. Create a PR and observe the AI validation
7. Fix the issue and see it pass

### Lab 2: Auto-Generate Documentation

**Objective**: Use AI to auto-generate README documentation for Terraform modules on PR.

**Challenge**: Create a workflow that:
1. Detects new/modified `.tf` files
2. Invokes the `terraform-module-reviewer` skill
3. Generates markdown documentation
4. Commits it back to the PR branch

## Resources

- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Azure DevOps Pipeline YAML](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Next Steps

After completing this training:

1. ✅ Integrate AI validation into your team's pipelines
2. ✅ Create custom skills for your organization's needs
3. ✅ Share successful patterns with the community
4. ✅ Explore advanced use cases (auto-remediation, compliance checks)
5. ✅ Consider upgrading to paid GitHub Models or Azure OpenAI for production use

## Troubleshooting FAQ

**Q: I get "401 Unauthorized" errors**
A: Verify your token has the right scopes and is stored correctly in secrets.

**Q: Responses are getting truncated**
A: Increase `max_tokens` in the API request (default is 4096 for output).

**Q: The AI is not following the skill instructions**
A: Make sure the skill content is included in the prompt and try increasing the temperature to 0.1-0.3 for more deterministic responses.

**Q: Rate limits are too restrictive**
A: Consider upgrading to GitHub Models paid tier or using Azure OpenAI with your own deployment.

**Q: How do I debug failed API calls?**
A: Add verbose logging: `curl -v` or `Invoke-RestMethod -Verbose`, and inspect the full response body.
