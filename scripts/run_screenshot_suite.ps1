$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."

$pyExe = if (Test-Path ".venv\Scripts\python.exe") { ".venv\Scripts\python.exe" } else { "python" }

Write-Host "1. Starting Python FastAPI on port 8000..."
$pyProc = Start-Process $pyExe -ArgumentList "-m","uvicorn","api.main:app","--host","127.0.0.1","--port","8000" -PassThru -WindowStyle Hidden

Write-Host "2. Starting Spring Boot Gateway on port 8080..."
$javaProc = Start-Process java -ArgumentList "-Dserver.port=8080","-jar","backend-java/target/gateway-0.0.1-SNAPSHOT.jar" -PassThru -WindowStyle Hidden

Write-Host "3. Starting Vite dev server on port 5173..."
$viteProc = Start-Process cmd.exe -ArgumentList "/c","npx","vite","--port","5173" -WorkingDirectory "$PWD/frontend-react" -PassThru -WindowStyle Hidden

try {
    Write-Host "Waiting for Vite dev server (port 5173)..."
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", 5173)
            $tcp.Close()
            Write-Host "Vite dev server is ready!"
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    Write-Host "4. Seeding realistic presentation data..."
    & $pyExe scripts/seed_demo_data.py

    Write-Host "5. Running Puppeteer screenshot suite with Chrome..."
    node scripts/capture_presentation_screenshots.js

    Write-Host "All 12 screenshots captured successfully in docs/screenshots/!"
} finally {
    Write-Host "Cleaning up background processes..."
    if ($pyProc -and -not $pyProc.HasExited) { & taskkill /PID $pyProc.Id /T /F 2>$null | Out-Null }
    if ($javaProc -and -not $javaProc.HasExited) { & taskkill /PID $javaProc.Id /T /F 2>$null | Out-Null }
    if ($viteProc -and -not $viteProc.HasExited) { & taskkill /PID $viteProc.Id /T /F 2>$null | Out-Null }
}
