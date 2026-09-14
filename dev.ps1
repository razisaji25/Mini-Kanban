# Run the backend and frontend together. PowerShell equivalent of `make dev`
# (this machine has no `make` installed, in PowerShell or Git Bash).
#
# Usage:  .\dev.ps1
# Stop:   Ctrl+C

$BackendPort = 8030
$FrontendPort = 8000
$root = $PSScriptRoot

Write-Host "Backend:  http://localhost:$BackendPort"
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Press Ctrl+C to stop both."

Start-Process -FilePath "uv" `
    -ArgumentList @("run", "uvicorn", "app.main:app", "--port", "$BackendPort") `
    -WorkingDirectory (Join-Path $root "backend") `
    -NoNewWindow

try {
    Push-Location (Join-Path $root "frontend")
    python -m http.server $FrontendPort
}
finally {
    Pop-Location
    & (Join-Path $root "scripts\stop-port.ps1") -Port $BackendPort
}
