Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repoRoot 'frontend'
$logPath = Join-Path $repoRoot 'frontend-preview.log'
$buildPath = Join-Path $frontendPath '.next'

if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

if (Test-Path $buildPath) {
  Remove-Item $buildPath -Recurse -Force
}

Set-Location $frontendPath
Set-Item -Path Env:NEXT_PUBLIC_API_BASE_URL -Value 'http://localhost:3001'

& 'C:\nvm4w\nodejs\npm.cmd' run build:release1 *>> $logPath
& 'C:\nvm4w\nodejs\npm.cmd' run start -- --port 3000 *>> $logPath
