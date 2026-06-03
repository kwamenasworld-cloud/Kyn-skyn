# Local Shopify theme preview against the kynskyn.com store catalog.
#
# What this does:
#   - Launches `shopify theme dev` at http://127.0.0.1:9292 against the CURRENT
#     working tree (whatever you have checked out and edited, committed or not)
#   - Hot-reloads when you edit any .liquid / .json / .css / asset in the repo
#
# First run: the CLI will open a browser asking you to log in to
# 1mehi7-fb.myshopify.com and authorize the CLI. Approve it once and the
# token is cached, so subsequent runs of this script start instantly.
#
# Branch model: `master` is the only branch and auto-deploys to live
# kynskyn.com on push. The old `test` branch was retired 2026-06-01 -- this
# script no longer creates or switches branches; it just previews your tree.
#
# Daily use:
#   1. Run this script: .\scripts\dev-preview.ps1
#   2. Edit files, see changes at http://127.0.0.1:9292
#   3. git add + commit + push `master` when ready to ship live

$ErrorActionPreference = "Stop"
$Store = "1mehi7-fb.myshopify.com"

# Move to repo root (this script lives in scripts/)
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$currentBranch = git rev-parse --abbrev-ref HEAD

Write-Host ""
Write-Host "Kyn Skyn local preview" -ForegroundColor Cyan
Write-Host "Store  : $Store"
Write-Host "Repo   : $RepoRoot"
Write-Host "Branch : $currentBranch"
Write-Host ""

if ($currentBranch -ne "master") {
  Write-Host "Note: not on master. The dev server previews the current working tree as-is." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "Launching dev server. Press Ctrl+C to stop." -ForegroundColor Green
Write-Host "Preview URL will print below once the CLI is ready." -ForegroundColor Green
Write-Host ""

shopify theme dev --store $Store
