# Stellt die Windows-Farbeinstellungen von vor apply.ps1 wieder her
$ErrorActionPreference = 'Stop'
$backup = Join-Path $PSScriptRoot 'backup'
if (-not (Test-Path $backup)) { throw "Kein Backup gefunden: $backup" }

Get-ChildItem $backup -Filter *.reg | ForEach-Object { reg import $_.FullName | Out-Null }

Stop-Process -Name explorer -Force
Start-Sleep -Milliseconds 800
if (-not (Get-Process explorer -ErrorAction SilentlyContinue)) { Start-Process explorer }

Write-Host 'Urspruengliche Farbeinstellungen wiederhergestellt.'
