$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot
try {
    $ImageName = "prelegal"
    $ContainerName = "prelegal"

    docker build -t $ImageName .

    docker rm -f $ContainerName 2>$null | Out-Null

    docker run -d --name $ContainerName -p 8000:8000 --env-file .env $ImageName

    Write-Host "Prelegal is running at http://localhost:8000"
}
finally {
    Pop-Location
}
