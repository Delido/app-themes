# Stellt die PowerToys-Moduleinstellungen aus .\backup wieder her (angelegt von apply.ps1)
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA 'Microsoft\PowerToys'
$backup = Join-Path $PSScriptRoot 'backup'
if (-not (Test-Path $backup)) { throw "Kein Backup in $backup" }

$exe = (Get-Process PowerToys -ErrorAction SilentlyContinue | Select-Object -First 1).Path
if (-not $exe) { $exe = Join-Path $env:LOCALAPPDATA 'PowerToys\PowerToys.exe' }
Get-Process PowerToys*, Microsoft.CmdPal.UI -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 800

$cmdPal = Join-Path $backup 'CmdPal.json'
if (Test-Path $cmdPal) {
    Copy-Item $cmdPal (Join-Path $env:LOCALAPPDATA 'Packages\Microsoft.CommandPalette_8wekyb3d8bbwe\LocalState\settings.json') -Force
    Write-Host 'Befehlspalette zurueckgesetzt'
}
foreach ($f in Get-ChildItem $backup -Filter *.json | Where-Object BaseName -ne 'CmdPal') {
    Copy-Item $f.FullName (Join-Path $root "$($f.BaseName)\settings.json") -Force
    Write-Host "$($f.BaseName) zurueckgesetzt"
}
if (Test-Path $exe) { Start-Process $exe }
