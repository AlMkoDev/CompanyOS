Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$migrationPath = Join-Path $backendPath 'prisma\migrations'

Write-Host 'Finance release verification: recent AP/AR/accounting migrations' -ForegroundColor Cyan
Get-ChildItem -Path $migrationPath -Directory |
  Where-Object { $_.Name -match '20260328|20260329' } |
  Sort-Object Name |
  Select-Object -ExpandProperty Name

Write-Host ''
Write-Host 'Finance release verification: focused backend finance specs' -ForegroundColor Cyan
Push-Location $backendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run test:finance-release
} finally {
  Pop-Location
}

Write-Host 'Finance release verification: backend production build' -ForegroundColor Cyan
Push-Location $backendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run build
} finally {
  Pop-Location
}

Write-Host 'Finance release verification: frontend production build' -ForegroundColor Cyan
Push-Location $frontendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run build:release1
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Finance release verification checklist:' -ForegroundColor Yellow
Write-Host '1. Apply latest Prisma migrations on staging.'
Write-Host '2. Check /ar, /ar/disputes, /disputes, /ap, and /accounting in staging.'
Write-Host '3. Confirm dispute closure acceptance, dossier export, and vendor bill wording render correctly.'
Write-Host ''
Write-Host 'Finance release verification passed.' -ForegroundColor Green
