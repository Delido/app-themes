# Stellt die Windows-Farbeinstellungen von vor apply.ps1 wieder her
$ErrorActionPreference = 'Stop'
$backup = Join-Path $PSScriptRoot 'backup'
if (-not (Test-Path $backup)) { throw "Kein Backup gefunden: $backup" }

Get-ChildItem $backup -Filter *.reg | ForEach-Object { reg import $_.FullName | Out-Null }

# Hintergrund von vor wallpaper.ps1 (TranscodedWallpaper wird beim Setzen ueberschrieben,
# daher die gesicherte Kopie als eigene Datei neu setzen)
if (Test-Path "$backup\TranscodedWallpaper") {
    $img = Join-Path $backup 'original-wallpaper.jpg'
    Copy-Item "$backup\TranscodedWallpaper" $img -Force
    $sig = '[DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int SystemParametersInfo(int a, int b, string c, int d);'
    $spi = Add-Type -MemberDefinition $sig -Name SPI -Namespace AuroraRestore -PassThru
    [void]$spi::SystemParametersInfo(0x14, 0, $img, 0x3)
}

Stop-Process -Name explorer -Force
Start-Sleep -Milliseconds 800
if (-not (Get-Process explorer -ErrorAction SilentlyContinue)) { Start-Process explorer }

Write-Host 'Urspruengliche Farbeinstellungen wiederhergestellt.'
