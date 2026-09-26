# Run from PowerShell: .\start-local.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 17+ is required.' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python 3.10+ is required.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js and npm are required.' }
if (-not (Test-Path 'frontend-react/node_modules')) { throw 'Run npm ci inside frontend-react first.' }
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
}
if (-not $env:AI_SERVICE_KEY) {
    $env:AI_SERVICE_KEY = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
}
if (-not (Test-Path 'backend-java/data/resumedb.mv.db') -and -not $env:APP_BOOTSTRAP_ADMIN_PASSWORD) {
    $secure = Read-Host 'Set initial admin password (12+ characters)' -AsSecureString
    $env:APP_BOOTSTRAP_ADMIN_PASSWORD = [Net.NetworkCredential]::new('', $secure).Password
    if ($env:APP_BOOTSTRAP_ADMIN_PASSWORD.Length -lt 12) { throw 'Password must have at least 12 characters.' }
}
New-Item -ItemType Directory -Force -Path 'backend-java/data' | Out-Null
$processes = @()
try {
    $processes += Start-Process python -ArgumentList '-m','uvicorn','api.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $PSScriptRoot -PassThru
    $processes += Start-Process -FilePath (Join-Path $PSScriptRoot 'backend-java/mvnw.cmd') -ArgumentList 'spring-boot:run' -WorkingDirectory (Join-Path $PSScriptRoot 'backend-java') -PassThru
    $processes += Start-Process npm.cmd -ArgumentList 'run','dev' -WorkingDirectory (Join-Path $PSScriptRoot 'frontend-react') -PassThru
    Write-Host 'Open http://localhost:5173. Press Ctrl+C here to stop all services.'
    while ($true) {
        Start-Sleep -Seconds 2
        foreach ($p in $processes) { if ($p.HasExited) { throw "Service exited with code $($p.ExitCode)." } }
    }
} finally {
    foreach ($p in $processes) {
        if (-not $p.HasExited) { & taskkill /PID $p.Id /T /F 2>$null | Out-Null }
    }
}
