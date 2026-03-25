Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'

Write-Host 'Release 1 verification: backend smoke suite' -ForegroundColor Cyan
Push-Location $backendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run test:release1
} finally {
  Pop-Location
}

Write-Host 'Release 1 verification: backend production build' -ForegroundColor Cyan
Push-Location $backendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run build
} finally {
  Pop-Location
}

Write-Host 'Release 1 verification: frontend production build' -ForegroundColor Cyan
Push-Location $frontendPath
try {
  & 'C:\nvm4w\nodejs\npm.cmd' run build:release1
} finally {
  Pop-Location
}

Write-Host 'Release 1 verification passed.' -ForegroundColor Green
