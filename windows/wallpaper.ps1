# Setzt ein dunkles Aurora-Bild als Windows-Hintergrund.
# Gedacht als Unterlage fuer Lively: Lively liegt darueber, aber Windows nimmt die
# Mica-Toenung (Store, Einstellungen, Explorer-Kopfzeile) aus diesem Bild.
# Das bisherige Bild wird nach .\backup gesichert, restore.ps1 stellt es wieder her.
param(
    [ValidateSet('ice', 'mint', 'violet', 'ember', 'rose')]
    [string]$Variant = 'ice',
    [switch]$NoApply   # nur Bild erzeugen
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$variants = @{
    ice    = '3b82f6', '22d3ee'
    mint   = '14b8a6', '818cf8'
    violet = '8b5cf6', '22d3ee'
    ember  = 'f97316', 'f43f5e'
    rose   = 'ec4899', 'a855f7'
}
$color = { param($hex, $alpha) [Drawing.Color]::FromArgb($alpha, [Convert]::ToInt32($hex.Substring(0, 2), 16), [Convert]::ToInt32($hex.Substring(2, 2), 16), [Convert]::ToInt32($hex.Substring(4, 2), 16)) }
$hexA, $hexB = $variants[$Variant]

Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
$w = [Math]::Max(1920, ($screens | ForEach-Object { $_.Bounds.Width } | Measure-Object -Maximum).Maximum)
$h = [Math]::Max(1080, ($screens | ForEach-Object { $_.Bounds.Height } | Measure-Object -Maximum).Maximum)

$bmp = [Drawing.Bitmap]::new($w, $h)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'HighQuality'
$g.Clear((& $color '06070b' 255))

# Weiche Aurora-Schimmer wie im TeamSpeak-Servertree: A oben rechts, B unten links
function Add-Glow($cx, $cy, $rx, $ry, $hex, $alpha) {
    $path = [Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddEllipse($cx - $rx, $cy - $ry, 2 * $rx, 2 * $ry)
    $brush = [Drawing.Drawing2D.PathGradientBrush]::new($path)
    $brush.CenterColor = & $color $hex $alpha
    $brush.SurroundColors = @(& $color $hex 0)
    $g.FillPath($brush, $path)
    $brush.Dispose(); $path.Dispose()
}
Add-Glow ($w * 0.95) ($h * 0.05) ($w * 0.75) ($h * 0.85) $hexA 46
Add-Glow ($w * 0.05) ($h * 0.98) ($w * 0.65) ($h * 0.70) $hexB 30
$g.Dispose()

$out = Join-Path $PSScriptRoot "aurora-$Variant-wallpaper.png"
$bmp.Save($out, [Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Bild erzeugt: $out ($w x $h)"
if ($NoApply) { return }

# Bisheriges Bild sichern (nur beim ersten Mal)
$backup = Join-Path $PSScriptRoot 'backup'
New-Item -ItemType Directory -Force $backup | Out-Null
$transcoded = "$env:APPDATA\Microsoft\Windows\Themes\TranscodedWallpaper"
if (-not (Test-Path "$backup\TranscodedWallpaper") -and (Test-Path $transcoded)) {
    Copy-Item $transcoded "$backup\TranscodedWallpaper"
    $d = Get-ItemProperty 'HKCU:\Control Panel\Desktop'
    @{ WallPaper = $d.WallPaper; WallpaperStyle = $d.WallpaperStyle; TileWallpaper = $d.TileWallpaper } |
        ConvertTo-Json | Set-Content "$backup\wallpaper.json"
    Write-Host "Bisheriger Hintergrund gesichert."
}

$sig = '[DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int SystemParametersInfo(int a, int b, string c, int d);'
$spi = Add-Type -MemberDefinition $sig -Name SPI -Namespace Aurora -PassThru
Set-ItemProperty 'HKCU:\Control Panel\Desktop' WallpaperStyle '10'   # Fuellen
Set-ItemProperty 'HKCU:\Control Panel\Desktop' TileWallpaper '0'
[void]$spi::SystemParametersInfo(0x14, 0, $out, 0x3)                  # SPI_SETDESKWALLPAPER, speichern + broadcast
Write-Host "Aurora-Hintergrund ($Variant) gesetzt."
