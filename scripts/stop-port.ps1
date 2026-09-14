# Kill whatever is listening on the given TCP port.
#
# `uv run <server>` spawns nested child processes, so the PID Start-Process
# hands back is not always the PID actually holding the port. Looking up
# the port's real owner via Get-NetTCPConnection and stopping that PID
# directly is what actually works.

param(
    [Parameter(Mandatory)]
    [int]$Port
)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

foreach ($conn in $connections) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}
