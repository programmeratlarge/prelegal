# Builds the Docker image, runs it, and verifies the container serves
# traffic on port 8000 before tearing it down.
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot
$ImageName = "prelegal-smoke"
$ContainerName = "prelegal-smoke"

function Cleanup {
    docker rm -f $ContainerName 2>$null | Out-Null
}

try {
    docker build -t $ImageName .
    docker rm -f $ContainerName 2>$null | Out-Null
    docker run -d --name $ContainerName -p 8000:8000 --env-file .env $ImageName

    Write-Host "Waiting for http://localhost:8000 to respond..."
    $ok = $false
    for ($i = 0; $i -lt 20; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $ok = $true
                break
            }
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    if (-not $ok) {
        Write-Host "FAILED: home page never became available"
        docker logs $ContainerName
        exit 1
    }
    Write-Host "Home page: OK"

    try {
        Invoke-WebRequest -Uri "http://localhost:8000/api/me" -UseBasicParsing -TimeoutSec 2 | Out-Null
        $status = 200
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
    }

    if ($status -ne 401) {
        Write-Host "FAILED: expected 401 from /api/me, got $status"
        docker logs $ContainerName
        exit 1
    }
    Write-Host "/api/me: OK (401 as expected when signed out)"

    Write-Host "Smoke test passed."
}
finally {
    Cleanup
    Pop-Location
}
