$ContainerName = "prelegal"

try {
    docker rm -f $ContainerName 2>$null | Out-Null
    Write-Host "Prelegal stopped."
}
catch {
    Write-Host "Prelegal container is not running."
}
