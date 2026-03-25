Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$logPath = Join-Path $repoRoot 'backend-preview.log'
$envPath = Join-Path $backendPath '.env'

if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

Set-Location $backendPath

Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or [string]::IsNullOrWhiteSpace($_)) {
    return
  }

  if ($_ -match '^([^=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    Set-Item -Path "Env:$name" -Value $value
  }
}

if (-not $env:JWT_SECRET) {
  Set-Item -Path Env:JWT_SECRET -Value 'local-preview-secret'
}

if (-not $env:PORT) {
  Set-Item -Path Env:PORT -Value '3001'
}

if (-not $env:FRONTEND_ORIGIN) {
  Set-Item -Path Env:FRONTEND_ORIGIN -Value 'http://localhost:3000'
}

if (-not $env:AUTH_COOKIE_NAME) {
  Set-Item -Path Env:AUTH_COOKIE_NAME -Value 'companyos_auth'
}

if (-not $env:AUTH_COOKIE_SAME_SITE) {
  Set-Item -Path Env:AUTH_COOKIE_SAME_SITE -Value 'lax'
}

if (-not $env:AUTH_COOKIE_SECURE) {
  Set-Item -Path Env:AUTH_COOKIE_SECURE -Value 'false'
}

if (-not $env:AUTH_COOKIE_MAX_AGE_MS) {
  Set-Item -Path Env:AUTH_COOKIE_MAX_AGE_MS -Value '1800000'
}

if (-not $env:MFA_ISSUER) {
  Set-Item -Path Env:MFA_ISSUER -Value 'CompanyOS'
}

if (-not $env:REQUIRED_MFA_ROLES) {
  Set-Item -Path Env:REQUIRED_MFA_ROLES -Value 'Super Admin,Admin,Owner'
}

if (-not $env:COMPLIANCE_UPLOAD_MAX_BYTES) {
  Set-Item -Path Env:COMPLIANCE_UPLOAD_MAX_BYTES -Value '10485760'
}

if (-not $env:PO_DOCUMENT_UPLOAD_MAX_BYTES) {
  Set-Item -Path Env:PO_DOCUMENT_UPLOAD_MAX_BYTES -Value '10485760'
}

& 'C:\nvm4w\nodejs\npm.cmd' run start:prod *>> $logPath
