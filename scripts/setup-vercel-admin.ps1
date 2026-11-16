<#
  Sets the three admin environment variables on Vercel and starts a fresh
  production deployment. Run from the project root:

    powershell -ExecutionPolicy Bypass -File .\scripts\setup-vercel-admin.ps1

  You will be asked for a Vercel access token and the admin password.
  Neither is written to a file or to the repository. The session secret is
  read from the local .env.local file.
#>

param(
  [string] $TeamSlug = "micro-div",
  [string] $Project = "us-ecommerce",
  [string] $AdminEmail = "damsacoture@gmail.com"
)

$ErrorActionPreference = "Stop"
$base = "https://api.vercel.com"

$tokenSecure = Read-Host "Vercel access token (create at https://vercel.com/account/tokens)" -AsSecureString
$token = [System.Net.NetworkCredential]::new("", $tokenSecure).Password

$passwordSecure = Read-Host "Admin password" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $passwordSecure).Password

$envFile = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile - the session secret must be set locally first."
}
$secretMatch = Select-String -Path $envFile -Pattern '^ADMIN_SESSION_SECRET=(.*)$'
if (-not $secretMatch) {
  throw "ADMIN_SESSION_SECRET is missing from $envFile."
}
$secret = $secretMatch.Matches[0].Groups[1].Value.Trim().Trim('"')
if (-not $secret) {
  throw "ADMIN_SESSION_SECRET is empty in $envFile."
}

$headers = @{
  Authorization  = "Bearer $token"
  "Content-Type" = "application/json"
}

# Find the git repository details used by the Vercel project.
$projectInfo = Invoke-RestMethod `
  -Uri "$base/v9/projects/$Project`?slug=$TeamSlug" `
  -Headers $headers

$repoId = $projectInfo.link.repoId
$branch = $projectInfo.link.productionBranch
if (-not $repoId -or -not $branch) {
  throw "Project '$Project' is not linked to a git repository with a production branch."
}

$targets = @("production", "preview", "development")
$variables = @(
  @{ key = "ADMIN_EMAIL";         value = $AdminEmail;  type = "encrypted"; target = $targets },
  @{ key = "ADMIN_PASSWORD";      value = $password;    type = "encrypted"; target = $targets },
  @{ key = "ADMIN_SESSION_SECRET"; value = $secret;     type = "encrypted"; target = $targets }
)

$body = $variables | ConvertTo-Json -Depth 6

Write-Host "Saving environment variables on Vercel..."
Invoke-RestMethod `
  -Uri "$base/v10/projects/$Project/env?upsert=true&slug=$TeamSlug" `
  -Method Post `
  -Headers $headers `
  -Body $body | Out-Null

# Verify the saved keys and targets without printing the values.
$saved = Invoke-RestMethod `
  -Uri "$base/v10/projects/$Project/env?slug=$TeamSlug" `
  -Headers $headers

$saved.envs |
  Where-Object { $_.key -in @("ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET") } |
  Select-Object key, target |
  Format-Table -AutoSize

# Trigger a new deployment so the new values are used.
$deployBody = @{
  name    = $Project
  project = $Project
  target  = "production"
  gitSource = @{
    type = "github"
    repoId = $repoId
    ref  = $branch
  }
} | ConvertTo-Json -Depth 5

Write-Host "Starting a fresh production deployment..."
$deployment = Invoke-RestMethod `
  -Uri "$base/v13/deployments?forceNew=1&slug=$TeamSlug" `
  -Method Post `
  -Headers $headers `
  -Body $deployBody

Write-Host "Deployment: https://vercel.com/$TeamSlug/$Project/$($deployment.id)"
Write-Host "Check: https://us-ecommerce-indol.vercel.app/admin/login"
