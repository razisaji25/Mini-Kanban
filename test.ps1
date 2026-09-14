# Run the backend test suite. PowerShell equivalent of `make test`.
Push-Location (Join-Path $PSScriptRoot "backend")
try {
    uv run pytest
}
finally {
    Pop-Location
}
