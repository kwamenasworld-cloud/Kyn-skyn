# Local Shopify theme preview against the kynskyn.com store catalog.
#
# What this does:
#   - Checks out the `test` branch (creates it if missing)
#   - Pulls latest from origin/test
#   - Launches `shopify theme dev` at http://127.0.0.1:9292
#   - Hot-reloads when you edit any .liquid / .json / .css / asset in the repo
#
# One-time setup (run manually the first time):
#   1. cd to the repo root
#   2. shopify auth login --store=kynskyn.myshopify.com
#   3. Browser opens, log in, approve the CLI
#
# Daily use:
#   1. Run this script: .\scripts\dev-preview.ps1
#   2. Edit files, see changes at http://127.0.0.1:9292
#   3. git add + commit + push to `test` branch when ready to share
#   4. When fully tested, merge `test` -> `master` to auto-deploy live

$ErrorActionPreference = "Stop"
$Store = "kynskyn.myshopify.com"

# Move to repo root (this script lives in scripts/)
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host ""
Write-Host "Kyn Skyn local preview" -ForegroundColor Cyan
Write-Host "Store : $Store"
Write-Host "Repo  : $RepoRoot"
Write-Host ""

# Make sure git working tree is clean enough to switch branches
$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Uncommitted changes in working tree:" -ForegroundColor Yellow
  Write-Host $dirty
  Write-Host ""
  Write-Host "Stash, commit, or discard them before switching branches. Aborting." -ForegroundColor Red
  exit 1
}

# Switch to test branch, creating + tracking it if needed
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "test") {
  Write-Host "Switching to test branch..." -ForegroundColor Cyan
  git show-ref --verify --quiet refs/heads/test
  if ($LASTEXITCODE -eq 0) {
    git checkout test
  } else {
    git fetch origin test 2>$null
    if ($LASTEXITCODE -eq 0) {
      git checkout -b test origin/test
    } else {
      Write-Host "Creating test branch from origin/master" -ForegroundColor Cyan
      git fetch origin master
      git checkout -b test origin/master
      git push -u origin test
    }
  }
}

# Pull latest test before launching
Write-Host "Pulling origin/test..." -ForegroundColor Cyan
git pull --ff-only origin test 2>$null

Write-Host ""
Write-Host "Launching dev server. Press Ctrl+C to stop." -ForegroundColor Green
Write-Host "Preview URL will print below once the CLI is ready." -ForegroundColor Green
Write-Host ""

shopify theme dev --store=$Store
