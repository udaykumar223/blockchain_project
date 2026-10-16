# TerraVault Clean Packaging Script
# Creates a lightweight zip file excluding node_modules, cache, and .git for sharing.

$projectName = "TerraVault_Blockchain_Project"
$zipPath = Join-Path -Path $PSScriptRoot -ChildPath "$projectName.zip"

Write-Host "Creating clean project archive: $zipPath..." -ForegroundColor Cyan

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

# Create a clean temporary export folder
$tempFolder = Join-Path -Path $env:TEMP -ChildPath "TerraVault_Export_$(Get-Random)"
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

try {
    # Copy project files excluding heavy/temporary folders
    $excludePatterns = @("node_modules", "dist", "artifacts", "cache", ".git", ".idea", ".vscode")
    
    Get-ChildItem -Path $PSScriptRoot -Exclude $excludePatterns | ForEach-Object {
        $dest = Join-Path -Path $tempFolder -ChildPath $_.Name
        if ($_.PSIsContainer) {
            # Recursively copy container, skipping node_modules & cache
            robocopy $_.FullName $dest /E /XD node_modules cache artifacts dist .git /XF *.zip *.log /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        } else {
            if ($_.Name -notlike "*.zip" -and $_.Name -notlike "*.log") {
                Copy-Item -Path $_.FullName -Destination $dest -Force
            }
        }
    }

    # Compress to ZIP
    Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -Force
    
    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "✅ Project successfully packaged to $zipPath ($sizeMB MB)" -ForegroundColor Green
    Write-Host "You can now send this lightweight zip file to your friend via WhatsApp, Email, or Google Drive!" -ForegroundColor Yellow
}
finally {
    if (Test-Path $tempFolder) {
        Remove-Item -Recurse -Force $tempFolder -ErrorAction SilentlyContinue
    }
}
