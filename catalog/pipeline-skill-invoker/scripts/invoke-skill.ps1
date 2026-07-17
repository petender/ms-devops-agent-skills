<#
.SYNOPSIS
    Invoke a DevOps skill using GitHub Models API

.DESCRIPTION
    This script reads a SKILL.md file, constructs a prompt with the provided task and input,
    calls the GitHub Models API, and returns the AI-generated response.

.PARAMETER SkillPath
    Path to the SKILL.md file (required)

.PARAMETER Task
    The task/question to ask the AI (required)

.PARAMETER Input
    Additional input context (optional, e.g., file content to analyze)

.PARAMETER Model
    AI model to use (default: gpt-4o-mini)

.PARAMETER Temperature
    Temperature for response generation (default: 0.3)

.PARAMETER MaxTokens
    Maximum tokens in response (default: 4096)

.PARAMETER OutputFile
    Path to save the response (optional, defaults to stdout)

.PARAMETER Token
    GitHub PAT token (defaults to GH_MODELS_TOKEN env var)

.EXAMPLE
    .\invoke-skill.ps1 -SkillPath "catalog/ado-pipeline-author/SKILL.md" `
        -Task "Review this pipeline for issues" `
        -Input (Get-Content pipeline.yml -Raw) `
        -OutputFile "result.json"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SkillPath,
    
    [Parameter(Mandatory=$true)]
    [string]$Task,
    
    [Parameter(Mandatory=$false)]
    [string]$Input = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Model = "gpt-4o-mini",
    
    [Parameter(Mandatory=$false)]
    [double]$Temperature = 0.3,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxTokens = 4096,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:GH_MODELS_TOKEN
)

$ErrorActionPreference = "Stop"

# Validate inputs
if (-not (Test-Path $SkillPath)) {
    Write-Error "Skill file not found: $SkillPath"
    exit 1
}

if ([string]::IsNullOrEmpty($Token)) {
    Write-Error "GitHub token not provided. Set GH_MODELS_TOKEN environment variable or use -Token parameter."
    exit 1
}

# Read the skill content
Write-Verbose "Reading skill from: $SkillPath"
$skillContent = Get-Content $SkillPath -Raw

# Construct the prompt
$prompt = @"
You are a DevOps expert with deep knowledge of best practices and automation.

$skillContent

Task: $Task
"@

if (-not [string]::IsNullOrEmpty($Input)) {
    $prompt += "`n`nInput:`n$Input"
}

Write-Verbose "Prompt constructed (${prompt.Length} characters)"

# Prepare the API request
$apiUrl = "https://models.github.com/v1/chat/completions"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$body = @{
    model = $Model
    messages = @(
        @{
            role = "system"
            content = "You are a DevOps expert. Always provide accurate, actionable advice."
        }
        @{
            role = "user"
            content = $prompt
        }
    )
    temperature = $Temperature
    max_tokens = $MaxTokens
} | ConvertTo-Json -Depth 10

# Call the API with retry logic
$maxRetries = 3
$retryDelay = 5
$attempt = 1

while ($attempt -le $maxRetries) {
    try {
        Write-Verbose "Calling GitHub Models API (attempt $attempt/$maxRetries)..."
        
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
        
        # Extract the response content
        $result = $response.choices[0].message.content
        
        # Output statistics
        $usage = $response.usage
        Write-Verbose "Tokens used: $($usage.total_tokens) (prompt: $($usage.prompt_tokens), completion: $($usage.completion_tokens))"
        
        # Write output
        if ([string]::IsNullOrEmpty($OutputFile)) {
            Write-Output $result
        } else {
            $result | Out-File -FilePath $OutputFile -Encoding UTF8
            Write-Host "Response saved to: $OutputFile" -ForegroundColor Green
        }
        
        exit 0
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 429) {
            # Rate limit - retry with backoff
            Write-Warning "Rate limited. Waiting ${retryDelay}s before retry..."
            Start-Sleep -Seconds $retryDelay
            $retryDelay *= 2
            $attempt++
        } elseif ($statusCode -eq 401) {
            Write-Error "Authentication failed. Check your GitHub token."
            exit 1
        } else {
            Write-Error "API call failed: $_"
            exit 1
        }
    }
}

Write-Error "Failed after $maxRetries attempts"
exit 1
