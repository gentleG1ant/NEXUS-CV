# Run from PowerShell: .\start-local.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
}
if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    $env:JAVA_HOME = 'C:\Users\HP\AppData\Local\Programs\Eclipse Adoptium\jdk-17'
}
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$env:Path = "$userPath;$machinePath;$env:JAVA_HOME\bin"

$pythonExe = if (Test-Path "$PSScriptRoot\.venv\Scripts\python.exe") { "$PSScriptRoot\.venv\Scripts\python.exe" } else { "python" }

if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 17+ is required.' }
if (-not (Get-Command $pythonExe -ErrorAction SilentlyContinue)) { throw 'Python 3.10+ is required.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js and npm are required.' }
if (-not (Test-Path 'frontend-react/node_modules')) { throw 'Run npm ci inside frontend-react first.' }
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = 'nexus-cv-default-local-jwt-secret-key-32bytes-minimum'
}
if (-not $env:AI_SERVICE_KEY) {
    $env:AI_SERVICE_KEY = 'nexus-cv-default-local-ai-key'
}
if (-not $env:APP_BOOTSTRAP_ADMIN_PASSWORD) {
    $env:APP_BOOTSTRAP_ADMIN_PASSWORD = 'admin12345678'
}
New-Item -ItemType Directory -Force -Path 'backend-java/data' | Out-Null
$processes = @()
try {
    $processes += Start-Process $pythonExe -ArgumentList '-m','uvicorn','api.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $PSScriptRoot -PassThru
    $processes += Start-Process 'cmd.exe' -ArgumentList '/c','mvnw.cmd','spring-boot:run' -WorkingDirectory (Join-Path $PSScriptRoot 'backend-java') -PassThru
    $processes += Start-Process 'cmd.exe' -ArgumentList '/c','npm','run','dev' -WorkingDirectory (Join-Path $PSScriptRoot 'frontend-react') -PassThru
    Write-Host 'Open http://localhost:5173. Press Ctrl+C here to stop all services.'
    while ($true) {
        Start-Sleep -Seconds 2
        foreach ($p in $processes) {
            if ($p.HasExited) {
                if ($p.ExitCode -eq 0 -or $null -eq $p.ExitCode) {
                    Write-Host "A background service stopped cleanly. Shutting down remaining services..."
                    return
                } else {
                    throw "Service $($p.ProcessName) exited unexpectedly with code $($p.ExitCode)."
                }
            }
        }
    }
} finally {
    foreach ($p in $processes) {
        if (-not $p.HasExited) { & taskkill /PID $p.Id /T /F 2>$null | Out-Null }
    }
}
